"use server";

/*
 * Admin server actions. Every action starts with requireUser(), so roles are
 * enforced on the server no matter what the browser sends. Every change is
 * written to the audit log.
 */
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import {
  blockedPhones,
  categories,
  contactMessages,
  deliveryZones,
  orders,
  orderStatus,
  orderStatusHistory,
  productOptions,
  products,
  reviews,
  settings,
  shops,
  siteTexts,
  users,
  type Localized,
  type WeekHours,
} from "@/db/schema";
import { ADMIN_LANG_COOKIE, encodeFlash, type Params } from "@/lib/admin-i18n";
import { audit, diff } from "@/lib/audit";
import {
  hashPassword,
  login,
  logout,
  logoutEverywhere,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { CATALOG_TAG, REVIEWS_TAG, SHOPS_TAG, ZONES_TAG } from "@/lib/catalog";
import { clientIp } from "@/lib/security";
import { SETTINGS_TAG } from "@/lib/settings";
import { TEXTS_TAG } from "@/lib/site-texts";
import { anonymizeOldOrders } from "@/lib/retention";
import { saveImage } from "@/lib/storage";
import { normalizeArmenianPhone } from "@/lib/format";
import { clean, loginName, loginSchema, passwordSchema } from "@/lib/validation";

/* ── helpers ── */

const str = (fd: FormData, k: string, max = 2000) => clean(String(fd.get(k) ?? "")).slice(0, max);
const num = (fd: FormData, k: string) => {
  const v = Number(String(fd.get(k) ?? "").replace(/[\s ]/g, ""));
  return Number.isFinite(v) ? Math.round(v) : NaN;
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
const loc = (fd: FormData, k: string, max = 400): Localized => ({
  hy: str(fd, `${k}.hy`, max),
  ru: str(fd, `${k}.ru`, max),
  en: str(fd, `${k}.en`, max),
});
const locOrNull = (fd: FormData, k: string, max = 400) => {
  const v = loc(fd, k, max);
  return v.hy || v.ru || v.en ? v : null;
};
const list = (fd: FormData, k: string) =>
  str(fd, k)
    .split(/[,\n]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 20);
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

/** Back to a page with a message; the English text is translated when shown. */
function back(path: string, kind: "ok" | "error", msg: string, params?: Params): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${kind}=${encodeURIComponent(encodeFlash(msg, params))}`);
}

async function maybeUpload(fd: FormData, key: string, folder: "products" | "shops" | "categories") {
  const file = fd.get(key);
  if (file instanceof File && file.size > 0) return saveImage(file, folder);
  return undefined;
}

/* ── language ── */

export async function setAdminLangAction(fd: FormData) {
  const lang = fd.get("lang") === "en" ? "en" : "hy";
  (await cookies()).set(ADMIN_LANG_COOKIE, lang, {
    path: "/admin",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  const back = (await headers()).get("referer");
  redirect(back && new URL(back).pathname.startsWith("/admin") ? new URL(back).pathname : "/admin");
}

/* ── auth ── */

export async function loginAction(_prev: { error?: string } | undefined, fd: FormData) {
  const parsed = loginSchema.safeParse({ login: fd.get("login"), password: fd.get("password") });
  if (!parsed.success) return { error: "Enter your login and password." };
  const res = await login(parsed.data.login, parsed.data.password, await clientIp());
  if (!res.ok) return { error: res.error };
  redirect(res.mustChangePassword ? "/admin/account?first=1" : "/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

export async function changePasswordAction(fd: FormData) {
  const user = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!(await verifyPassword(user.id, current)))
    back("/admin/account", "error", "The current password is wrong.");
  const parsed = passwordSchema.safeParse(next);
  if (!parsed.success)
    back("/admin/account", "error", parsed.error.issues[0]?.message ?? "Weak password.");
  if (next !== String(fd.get("confirm") ?? ""))
    back("/admin/account", "error", "The two new passwords differ.");
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(next), mustChangePassword: false })
    .where(eq(users.id, user.id));
  await audit(user, "change_password", "user", user.id);
  back("/admin/account", "ok", "Password changed.");
}

/* ── orders ── */

const statusSchema = z.enum(orderStatus.enumValues);

export async function updateOrderStatusAction(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("orderId") ?? "");
  const parsed = statusSchema.safeParse(fd.get("status"));
  if (!z.uuid().safeParse(id).success || !parsed.success)
    back("/admin/orders", "error", "Unknown order or status.");
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) back("/admin/orders", "error", "Order not found.");
  if (order.status !== parsed.data) {
    await db.update(orders).set({ status: parsed.data }).where(eq(orders.id, id));
    await db.insert(orderStatusHistory).values({
      orderId: id,
      fromStatus: order.status,
      toStatus: parsed.data,
      userId: user.id,
      note: str(fd, "note", 300) || null,
    });
    await audit(user, "order_status", "order", order.shortCode, {
      status: [order.status, parsed.data],
    });
  }
  back(`/admin/orders/${id}`, "ok", "Status updated.");
}

/*
 * Confirm-by-call: a new order is only prepared after staff reached the
 * customer. "fake" cancels it and, by default, blocks the number.
 */
export async function callOutcomeAction(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("orderId") ?? "");
  const outcome = z.enum(["confirmed", "no_answer", "fake"]).safeParse(fd.get("outcome"));
  if (!z.uuid().safeParse(id).success || !outcome.success)
    back("/admin/orders", "error", "Unknown order or answer.");
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) back("/admin/orders", "error", "Order not found.");

  const next =
    outcome.data === "confirmed"
      ? "confirmed"
      : outcome.data === "fake"
        ? "cancelled"
        : order.status;
  const note = {
    confirmed: "Confirmed by phone",
    no_answer: "Called: no answer",
    fake: "Fake order: cancelled after the call",
  }[outcome.data];
  if (next !== order.status) await db.update(orders).set({ status: next }).where(eq(orders.id, id));
  await db.insert(orderStatusHistory).values({
    orderId: id,
    fromStatus: order.status,
    toStatus: next,
    userId: user.id,
    note,
  });
  await audit(user, "order_call", "order", order.shortCode, { outcome: outcome.data });

  back(
    `/admin/orders/${id}`,
    "ok",
    {
      confirmed: "Confirmed. Prepare the order.",
      no_answer: "Call noted.",
      fake: "Order cancelled. If it was a prank, you can block the number below.",
    }[outcome.data],
  );
}

/** Where to go back to after (un)blocking: the order page it came from, or the list. */
function blockReturn(fd: FormData) {
  const to = String(fd.get("returnTo") ?? "");
  return /^\/admin\/orders\/[0-9a-f-]{36}$/.test(to) ? to : "/admin/blocked";
}

export async function blockPhoneAction(fd: FormData) {
  const user = await requireUser();
  const to = blockReturn(fd);
  const phone = normalizeArmenianPhone(str(fd, "phone", 25));
  if (!phone) back(to, "error", "Check the number: +374 and 8 digits.");
  await db
    .insert(blockedPhones)
    .values({ phone, reason: str(fd, "reason", 200) || null, blockedBy: user.id })
    .onConflictDoNothing();
  await audit(user, "block_phone", "phone", phone);
  back(to, "ok", "Number blocked. It can no longer order online.");
}

export async function unblockPhoneAction(fd: FormData) {
  const user = await requireUser();
  const to = blockReturn(fd);
  const phone = normalizeArmenianPhone(str(fd, "phone", 25));
  if (!phone) back(to, "error", "Unknown number.");
  await db.delete(blockedPhones).where(eq(blockedPhones.phone, phone));
  await audit(user, "unblock_phone", "phone", phone);
  back(to, "ok", "Number unblocked.");
}

export async function updateOrderNoteAction(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("orderId") ?? "");
  if (!z.uuid().safeParse(id).success) back("/admin/orders", "error", "Unknown order.");
  await db
    .update(orders)
    .set({ staffNote: str(fd, "staffNote", 1000) || null })
    .where(eq(orders.id, id));
  await audit(user, "order_note", "order", id);
  back(`/admin/orders/${id}`, "ok", "Note saved.");
}

/* ── products ── */

const optionSchema = z.object({
  kind: z.enum(["size", "syrup", "filling", "text", "extra"]),
  name: z.object({ hy: z.string().max(80), ru: z.string().max(80), en: z.string().max(80) }),
  priceDeltaAmd: z.number().int().min(-100000).max(100000),
  isDefault: z.boolean(),
  maxLength: z.number().int().min(1).max(200).nullable(),
});

export async function saveProductAction(fd: FormData) {
  const user = await requireUser(["admin", "staff"]);
  const id = num(fd, "id");
  const isNew = !Number.isFinite(id) || id <= 0;
  const path = isNew ? "/admin/products/new" : `/admin/products/${id}`;

  const name = loc(fd, "name", 120);
  if (!name.hy || !name.ru || !name.en)
    back(path, "error", "Give the product a name in all three languages.");
  const priceAmd = num(fd, "priceAmd");
  if (!Number.isFinite(priceAmd) || priceAmd < 0 || priceAmd > 10_000_000)
    back(path, "error", "Check the price.");
  const categoryId = num(fd, "categoryId");
  if (!Number.isFinite(categoryId)) back(path, "error", "Choose a category.");

  let options: z.infer<typeof optionSchema>[] = [];
  try {
    options = z
      .array(optionSchema)
      .max(30)
      .parse(JSON.parse(String(fd.get("options") || "[]")));
  } catch {
    back(path, "error", "One of the options is not valid.");
  }

  let image: string | undefined;
  try {
    image = await maybeUpload(fd, "imageFile", "products");
  } catch (err) {
    back(path, "error", err instanceof Error ? err.message : "Upload failed.");
  }

  const buyamUrl = str(fd, "buyamUrl", 300) || null;
  if (buyamUrl && !/^https:\/\/buy\.am\/\S+$/.test(buyamUrl))
    back(path, "error", "The buy.am link must start with https://buy.am/");

  const boxSize = num(fd, "boxSize");
  const values = {
    categoryId,
    name,
    description: locOrNull(fd, "description", 300),
    imageAlt: locOrNull(fd, "imageAlt", 200),
    priceAmd,
    priceIsSample: bool(fd, "priceIsSample"),
    priceOnRequest: bool(fd, "priceOnRequest"),
    buyamUrl,
    tags: list(fd, "tags"),
    badges: list(fd, "badges").filter((b) => b === "new" || b === "bestseller"),
    isAvailable: bool(fd, "isAvailable"),
    isPublished: bool(fd, "isPublished"),
    isFeatured: bool(fd, "isFeatured"),
    leadTimeDays: Math.max(0, Math.min(14, num(fd, "leadTimeDays") || 0)),
    boxSize: Number.isFinite(boxSize) && boxSize > 0 ? boxSize : null,
    sortOrder: num(fd, "sortOrder") || 0,
    ...(image ? { image } : {}),
    ...(bool(fd, "removeImage") ? { image: null } : {}),
  };

  let productId = id;
  if (isNew) {
    const slug = `${slugify(name.en) || "item"}-${randomBytes(2).toString("hex")}`;
    const [row] = await db
      .insert(products)
      .values({ ...values, slug, source: "admin" })
      .returning({ id: products.id });
    productId = row!.id;
    await audit(user, "create", "product", productId, values);
  } else {
    const [before] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!before) back("/admin/products", "error", "Product not found.");
    await db.update(products).set(values).where(eq(products.id, id));
    await audit(user, "update", "product", id, diff(before as Record<string, unknown>, values));
  }

  await db.transaction(async (tx) => {
    await tx.delete(productOptions).where(eq(productOptions.productId, productId));
    if (options.length) {
      await tx
        .insert(productOptions)
        .values(options.map((o, i) => ({ ...o, productId, sortOrder: i })));
    }
  });
  updateTag(CATALOG_TAG);
  back(`/admin/products/${productId}`, "ok", "Saved.");
}

/** Inline edit from the product list: price and availability only. */
export async function quickProductAction(fd: FormData) {
  const user = await requireUser();
  const id = num(fd, "id");
  const priceAmd = num(fd, "priceAmd");
  if (!Number.isFinite(id) || !Number.isFinite(priceAmd) || priceAmd < 0)
    back("/admin/products", "error", "Check the price.");
  const [before] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!before) back("/admin/products", "error", "Product not found.");
  const changed = priceAmd !== before.priceAmd;
  const values = {
    priceAmd,
    isAvailable: bool(fd, "isAvailable"),
    priceIsSample: changed ? false : before.priceIsSample,
    // Typing a new price is the answer to "price on request".
    priceOnRequest: changed ? false : before.priceOnRequest,
  };
  await db.update(products).set(values).where(eq(products.id, id));
  await audit(user, "update", "product", id, diff(before as Record<string, unknown>, values));
  updateTag(CATALOG_TAG);
  back(`/admin/products?c=${before.categoryId}`, "ok", "Saved.");
}

export async function confirmAllPricesAction() {
  const user = await requireUser(["admin"]);
  await db.update(products).set({ priceIsSample: false }).where(eq(products.priceIsSample, true));
  await audit(user, "confirm_prices", "product", null);
  updateTag(CATALOG_TAG);
  back("/admin/products", "ok", "All prices marked as confirmed.");
}

export async function deleteProductAction(fd: FormData) {
  const user = await requireUser(["admin"]);
  const id = num(fd, "id");
  const [before] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!before) back("/admin/products", "error", "Product not found.");
  await db.delete(products).where(eq(products.id, id));
  await audit(user, "delete", "product", id, { name: before.name });
  updateTag(CATALOG_TAG);
  back("/admin/products", "ok", "Product deleted.");
}

/* ── categories ── */

export async function saveCategoryAction(fd: FormData) {
  const user = await requireUser(["admin"]);
  const id = num(fd, "id");
  const name = loc(fd, "name", 80);
  if (!name.hy || !name.ru || !name.en)
    back("/admin/categories", "error", "Name the category in all three languages.");
  let image: string | undefined;
  try {
    image = await maybeUpload(fd, "imageFile", "categories");
  } catch (err) {
    back("/admin/categories", "error", err instanceof Error ? err.message : "Upload failed.");
  }
  const values = {
    name,
    description: locOrNull(fd, "description", 200),
    sortOrder: num(fd, "sortOrder") || 0,
    isPublished: bool(fd, "isPublished"),
    inMenu: bool(fd, "inMenu"),
    ...(image ? { image } : {}),
  };
  if (Number.isFinite(id) && id > 0) {
    const [before] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    await db.update(categories).set(values).where(eq(categories.id, id));
    await audit(
      user,
      "update",
      "category",
      id,
      before ? diff(before as Record<string, unknown>, values) : values,
    );
  } else {
    const [row] = await db
      .insert(categories)
      .values({
        ...values,
        slug: `${slugify(name.en) || "category"}-${randomBytes(2).toString("hex")}`,
      })
      .returning({ id: categories.id });
    await audit(user, "create", "category", row!.id, values);
  }
  updateTag(CATALOG_TAG);
  back("/admin/categories", "ok", "Saved.");
}

/* ── shops ── */

const hhmm = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;

export async function saveShopAction(fd: FormData) {
  const user = await requireUser(["admin"]);
  const id = num(fd, "id");
  const path = Number.isFinite(id) && id > 0 ? `/admin/shops/${id}` : "/admin/shops/new";
  const name = loc(fd, "name", 80);
  const address = loc(fd, "address", 160);
  if (!name.hy || !name.en || !address.hy) back(path, "error", "Name and address are required.");

  let hours: WeekHours | null = null;
  if (!bool(fd, "isMall")) {
    hours = Array.from({ length: 7 }, (_, d) => {
      if (bool(fd, `closed.${d}`)) return null;
      const open = str(fd, `open.${d}`, 5);
      const close = str(fd, `close.${d}`, 5);
      return hhmm.test(open) && hhmm.test(close)
        ? { open, close }
        : { open: "09:00", close: "22:00" };
    });
  }
  const url = (k: string) => {
    const v = str(fd, k, 500);
    return /^https:\/\//.test(v) ? v : null;
  };
  let image: string | undefined;
  try {
    image = await maybeUpload(fd, "imageFile", "shops");
  } catch (err) {
    back(path, "error", err instanceof Error ? err.message : "Upload failed.");
  }
  const lat = Number(str(fd, "lat", 20));
  const lng = Number(str(fd, "lng", 20));
  const values = {
    name,
    address,
    district: str(fd, "district", 40) || "kentron",
    lat: Number.isFinite(lat) && lat !== 0 ? lat : null,
    lng: Number.isFinite(lng) && lng !== 0 ? lng : null,
    phone: str(fd, "phone", 20) || null,
    hours,
    hoursNote: locOrNull(fd, "hoursNote", 120),
    isMall: bool(fd, "isMall"),
    googleMapsUrl: url("googleMapsUrl"),
    yandexMapsUrl: url("yandexMapsUrl"),
    twoGisUrl: url("twoGisUrl"),
    pickupEnabled: bool(fd, "pickupEnabled"),
    isActive: bool(fd, "isActive"),
    isConfirmed: bool(fd, "isConfirmed"),
    sortOrder: num(fd, "sortOrder") || 0,
    ...(image ? { image } : {}),
  };
  let shopId = id;
  if (Number.isFinite(id) && id > 0) {
    const [before] = await db.select().from(shops).where(eq(shops.id, id)).limit(1);
    await db.update(shops).set(values).where(eq(shops.id, id));
    await audit(
      user,
      "update",
      "shop",
      id,
      before ? diff(before as Record<string, unknown>, values) : values,
    );
  } else {
    const [row] = await db
      .insert(shops)
      .values({
        ...values,
        slug: `${slugify(name.en) || "shop"}-${randomBytes(2).toString("hex")}`,
      })
      .returning({ id: shops.id });
    shopId = row!.id;
    await audit(user, "create", "shop", shopId, values);
  }
  updateTag(SHOPS_TAG);
  back(`/admin/shops/${shopId}`, "ok", "Saved.");
}

/* ── delivery zones ── */

export async function saveZoneAction(fd: FormData) {
  const user = await requireUser(["admin"]);
  const id = num(fd, "id");
  const free = num(fd, "freeFromAmd");
  const values = {
    name: loc(fd, "name", 80),
    districts: fd.getAll("districts").map(String).slice(0, 12),
    feeAmd: Math.max(0, num(fd, "feeAmd") || 0),
    minOrderAmd: Math.max(0, num(fd, "minOrderAmd") || 0),
    freeFromAmd: Number.isFinite(free) && free > 0 ? free : null,
    etaMinutes: Math.max(10, num(fd, "etaMinutes") || 60),
    isActive: bool(fd, "isActive"),
    sortOrder: num(fd, "sortOrder") || 0,
  };
  if (!values.name.en || !values.name.hy) back("/admin/zones", "error", "Name the zone.");
  if (Number.isFinite(id) && id > 0) {
    const [before] = await db.select().from(deliveryZones).where(eq(deliveryZones.id, id)).limit(1);
    await db.update(deliveryZones).set(values).where(eq(deliveryZones.id, id));
    await audit(
      user,
      "update",
      "zone",
      id,
      before ? diff(before as Record<string, unknown>, values) : values,
    );
  } else {
    const [row] = await db.insert(deliveryZones).values(values).returning({ id: deliveryZones.id });
    await audit(user, "create", "zone", row!.id, values);
  }
  updateTag(ZONES_TAG);
  back("/admin/zones", "ok", "Saved.");
}

export async function deleteZoneAction(fd: FormData) {
  const user = await requireUser(["admin"]);
  const id = num(fd, "id");
  await db.delete(deliveryZones).where(eq(deliveryZones.id, id));
  await audit(user, "delete", "zone", id);
  updateTag(ZONES_TAG);
  back("/admin/zones", "ok", "Zone deleted.");
}

/* ── reviews ── */

export async function saveReviewAction(fd: FormData) {
  const user = await requireUser(["admin"]);
  const id = num(fd, "id");
  const rating = num(fd, "rating");
  const url = str(fd, "url", 500);
  const values = {
    author: str(fd, "author", 80),
    platform: str(fd, "platform", 40),
    url: /^https:\/\//.test(url) ? url : null,
    rating: rating >= 1 && rating <= 5 ? rating : null,
    // The quote is stored exactly as the reviewer wrote it.
    quote: String(fd.get("quote") ?? "")
      .trim()
      .slice(0, 600),
    quoteLocale: ["hy", "ru", "en"].includes(str(fd, "quoteLocale"))
      ? str(fd, "quoteLocale")
      : "en",
    reviewDate: str(fd, "reviewDate", 20) || null,
    isApproved: bool(fd, "isApproved"),
    sortOrder: num(fd, "sortOrder") || 0,
  };
  if (!values.author || !values.platform || !values.quote)
    back("/admin/reviews", "error", "Author, platform and quote are required.");
  if (Number.isFinite(id) && id > 0) {
    await db.update(reviews).set(values).where(eq(reviews.id, id));
    await audit(user, "update", "review", id, values);
  } else {
    const [row] = await db.insert(reviews).values(values).returning({ id: reviews.id });
    await audit(user, "create", "review", row!.id, values);
  }
  updateTag(REVIEWS_TAG);
  back("/admin/reviews", "ok", "Saved.");
}

export async function deleteReviewAction(fd: FormData) {
  const user = await requireUser(["admin"]);
  const id = num(fd, "id");
  await db.delete(reviews).where(eq(reviews.id, id));
  await audit(user, "delete", "review", id);
  updateTag(REVIEWS_TAG);
  back("/admin/reviews", "ok", "Review deleted.");
}

/* ── site texts ── */

export async function saveTextAction(fd: FormData) {
  const user = await requireUser(["admin"]);
  const key = str(fd, "key", 120);
  const q = str(fd, "q", 120);
  if (!/^[a-zA-Z0-9_.]+$/.test(key)) back("/admin/texts", "error", "Unknown text key.");
  for (const locale of ["hy", "ru", "en"] as const) {
    const value = String(fd.get(`value.${locale}`) ?? "")
      .trim()
      .slice(0, 2000);
    const original = String(fd.get(`original.${locale}`) ?? "");
    if (!value || value === original) {
      await db.delete(siteTexts).where(and(eq(siteTexts.key, key), eq(siteTexts.locale, locale)));
    } else {
      await db
        .insert(siteTexts)
        .values({ key, locale, value })
        .onConflictDoUpdate({ target: [siteTexts.key, siteTexts.locale], set: { value } });
    }
  }
  await audit(user, "update", "site_text", key);
  updateTag(TEXTS_TAG);
  back(`/admin/texts?q=${encodeURIComponent(q || key)}`, "ok", "Saved “{key}”.", { key });
}

/* ── settings ── */

const settingsSchemas = {
  banner: z.object({
    enabled: z.boolean(),
    text: z.object({ hy: z.string(), ru: z.string(), en: z.string() }),
  }),
  contact: z.object({
    phones: z
      .array(z.string().regex(/^\+374\d{8}$/))
      .min(1)
      .max(4),
    whatsapp: z
      .string()
      .regex(/^374\d{8}$/)
      .nullable(),
    whatsappConfirmed: z.boolean(),
    instagram: z
      .string()
      .regex(/^[A-Za-z0-9_.]{1,30}$/)
      .nullable(),
    facebook: z
      .string()
      .regex(/^[A-Za-z0-9_.-]{1,60}$/)
      .nullable(),
    tiktok: z
      .string()
      .regex(/^[A-Za-z0-9_.]{1,30}$/)
      .nullable(),
    email: z.email().nullable(),
  }),
  ordering: z.object({
    pickupEnabled: z.boolean(),
    deliveryEnabled: z.boolean(),
    deliveryHours: z.object({ open: z.string().regex(hhmm), close: z.string().regex(hhmm) }),
    pickupSlotMinutes: z.number().int().min(15).max(120),
    deliverySlotMinutes: z.number().int().min(30).max(240),
    minLeadMinutes: z.number().int().min(0).max(600),
    maxDaysAhead: z.number().int().min(1).max(30),
  }),
  externalDelivery: z
    .array(z.object({ name: z.string().max(40), url: z.string().max(300), enabled: z.boolean() }))
    .max(6),
  legal: z.object({
    companyName: z.string().nullable(),
    taxId: z.string().nullable(),
    address: z.string().nullable(),
  }),
  demoNotes: z.object({ enabled: z.boolean() }),
} as const;

export async function saveSettingsAction(fd: FormData) {
  const user = await requireUser(["admin"]);
  const key = String(fd.get("key") ?? "") as keyof typeof settingsSchemas;
  const schema = settingsSchemas[key];
  if (!schema) back("/admin/settings", "error", "Unknown setting.");
  const n = (v: string) => (v ? v : null);
  let value: unknown;
  switch (key) {
    case "banner":
      value = { enabled: bool(fd, "enabled"), text: loc(fd, "text", 160) };
      break;
    case "contact":
      value = {
        phones: str(fd, "phones")
          .split(/[,\s]+/)
          .filter(Boolean),
        whatsapp: n(str(fd, "whatsapp").replace(/\D/g, "")),
        whatsappConfirmed: bool(fd, "whatsappConfirmed"),
        instagram: n(str(fd, "instagram").replace(/^@/, "")),
        facebook: n(str(fd, "facebook")),
        tiktok: n(str(fd, "tiktok").replace(/^@/, "")),
        email: n(str(fd, "email")),
      };
      break;
    case "ordering":
      value = {
        pickupEnabled: bool(fd, "pickupEnabled"),
        deliveryEnabled: bool(fd, "deliveryEnabled"),
        deliveryHours: { open: str(fd, "deliveryOpen"), close: str(fd, "deliveryClose") },
        pickupSlotMinutes: num(fd, "pickupSlotMinutes"),
        deliverySlotMinutes: num(fd, "deliverySlotMinutes"),
        minLeadMinutes: num(fd, "minLeadMinutes"),
        maxDaysAhead: num(fd, "maxDaysAhead"),
      };
      break;
    case "externalDelivery":
      value = [0, 1, 2, 3]
        .map((i) => ({
          name: str(fd, `name.${i}`, 40),
          url: str(fd, `url.${i}`, 300),
          enabled: bool(fd, `enabled.${i}`),
        }))
        .filter((d) => d.name);
      break;
    case "demoNotes":
      value = { enabled: bool(fd, "enabled") };
      break;
    case "legal":
      value = {
        companyName: n(str(fd, "companyName")),
        taxId: n(str(fd, "taxId")),
        address: n(str(fd, "address")),
      };
      break;
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success)
    back("/admin/settings", "error", "Check “{key}”: {field} is not valid.", {
      key,
      field: parsed.error.issues[0]?.path.join(".") ?? "",
    });
  await db
    .insert(settings)
    .values({ key, value: parsed.data })
    .onConflictDoUpdate({ target: settings.key, set: { value: parsed.data } });
  await audit(user, "update", "settings", key, parsed.data);
  updateTag(SETTINGS_TAG);
  back("/admin/settings", "ok", "Settings saved.");
}

/* ── users ── */

export async function createUserAction(fd: FormData) {
  const user = await requireUser(["admin"]);
  const login = loginName(str(fd, "login", 160));
  if (!login)
    back("/admin/users", "error", "Check the login: Latin letters, numbers, dots or dashes.");
  const role = fd.get("role") === "admin" ? "admin" : "staff";
  const password = String(fd.get("password") ?? "");
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success)
    back("/admin/users", "error", parsed.error.issues[0]?.message ?? "Weak password.");
  try {
    await db.insert(users).values({
      email: login,
      name: str(fd, "name", 80) || login,
      role,
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
    });
  } catch {
    back("/admin/users", "error", "This login is already taken.");
  }
  await audit(user, "create", "user", login, { role });
  back("/admin/users", "ok", "{login} can now sign in with the password you set.", { login });
}

export async function toggleUserAction(fd: FormData) {
  const user = await requireUser(["admin"]);
  const id = num(fd, "id");
  if (id === user.id) back("/admin/users", "error", "You cannot switch off your own account.");
  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) back("/admin/users", "error", "User not found.");
  await db.update(users).set({ isActive: !target.isActive }).where(eq(users.id, id));
  if (target.isActive) await logoutEverywhere(id);
  await audit(user, target.isActive ? "deactivate" : "activate", "user", target.email);
  back("/admin/users", "ok", "Saved.");
}

export async function resetUserPasswordAction(fd: FormData) {
  const user = await requireUser(["admin"]);
  const id = num(fd, "id");
  const password = String(fd.get("password") ?? "");
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success)
    back("/admin/users", "error", parsed.error.issues[0]?.message ?? "Weak password.");
  const [target] = await db
    .update(users)
    .set({
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
      failedLogins: 0,
      lockedUntil: null,
    })
    .where(eq(users.id, id))
    .returning({ email: users.email });
  if (!target) back("/admin/users", "error", "User not found.");
  await logoutEverywhere(id);
  await audit(user, "reset_password", "user", target.email);
  back("/admin/users", "ok", "New password set for {login}. They will change it at sign-in.", {
    login: target.email,
  });
}

/* ── messages & privacy ── */

export async function markMessageAction(fd: FormData) {
  const user = await requireUser();
  const id = num(fd, "id");
  await db.update(contactMessages).set({ isHandled: true }).where(eq(contactMessages.id, id));
  await audit(user, "handled", "contact_message", id);
  back("/admin/messages", "ok", "Marked as handled.");
}

export async function runRetentionAction() {
  const user = await requireUser(["admin"]);
  const n = await anonymizeOldOrders();
  await audit(user, "retention_run", "order", null, { anonymized: n });
  back("/admin", "ok", "Anonymised {n} old orders.", { n });
}
