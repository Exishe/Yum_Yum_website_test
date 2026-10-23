import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, orderStatusHistory } from "@/db/schema";
import type { Locale } from "@/i18n/routing";
import { getMenu, getShops, getZones, type MenuProduct } from "./catalog";
import { districts } from "./districts";
import { env } from "./env";
import { formatAmd, formatPhone } from "./format";
import { t } from "./localized";
import { availableDays, findSlot } from "./ordering";
import { isPricingError, leadDays, priceLine, quoteDelivery, type PricedLine } from "./pricing";
import { getSettings } from "./settings";
import type { CheckoutData } from "./validation";

export type OrderError = {
  ok: false;
  error: string;
  params?: Record<string, string>;
  field?: string;
};
export type OrderSuccess = { ok: true; publicId: string };

export function newPublicId() {
  return randomBytes(12).toString("base64url");
}

export async function createOrder(
  data: CheckoutData,
  ipHash: string,
): Promise<OrderSuccess | OrderError> {
  const locale = data.locale as Locale;
  const [menu, shops, zones, settings] = await Promise.all([
    getMenu(),
    getShops(),
    getZones(),
    getSettings(),
  ]);

  const products = new Map<number, MenuProduct>();
  for (const c of menu) for (const p of c.products) products.set(p.id, p);
  const boxable = new Set(menu.find((c) => c.slug === "donuts")?.products.map((p) => p.id) ?? []);

  // 1. Price every line from the database.
  const lines: PricedLine[] = [];
  for (const item of data.items) {
    const priced = priceLine(item, products, boxable);
    if (isPricingError(priced)) {
      const name = t(products.get(priced.productId)?.name, locale);
      return { ok: false, error: priced.code, params: { name } };
    }
    lines.push(priced);
  }
  const subtotal = lines.reduce((s, l) => s + l.lineTotalAmd, 0);

  // 2. Fulfilment, place and time.
  const rules = settings.ordering;
  let shopId: number | null = null;
  let zoneId: number | null = null;
  let deliveryFee = 0;

  if (data.fulfilment === "pickup") {
    if (!rules.pickupEnabled) return { ok: false, error: "generic" };
    const shop = shops.find((s) => s.id === data.shopId && s.pickupEnabled);
    if (!shop) return { ok: false, error: "shop", field: "shopId" };
    shopId = shop.id;
  } else {
    if (!rules.deliveryEnabled) return { ok: false, error: "generic" };
    const quote = quoteDelivery(data.district, subtotal, zones);
    if (!quote.ok) {
      return quote.reason === "noZone"
        ? { ok: false, error: "noZone", field: "district" }
        : {
            ok: false,
            error: "belowMinimum",
            params: { price: formatAmd(quote.minOrderAmd, locale) },
          };
    }
    zoneId = quote.zone.id;
    deliveryFee = quote.feeAmd;
  }

  const lead = leadDays(lines);
  const days = availableDays({
    fulfilment: data.fulfilment,
    shopHours: shops.find((s) => s.id === shopId)?.hours,
    rules,
    leadDays: lead,
  });
  const slot = findSlot(days, data.slot);
  if (!slot) {
    const dateOk = days.some((d) => d.dateKey === data.date);
    return { ok: false, error: lead > 0 && !dateOk ? "leadTime" : "slotPast", field: "slot" };
  }

  // 3. Save.
  const publicId = newPublicId();
  const shortCode = String(randomInt(1000, 10000));
  const total = subtotal + deliveryFee;

  await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        publicId,
        shortCode,
        fulfilment: data.fulfilment,
        shopId,
        zoneId,
        customerName: data.name,
        phone: data.phone,
        address: data.fulfilment === "delivery" ? data.address : null,
        district: data.fulfilment === "delivery" ? data.district : null,
        scheduledFor: slot.start,
        slotLabel: slot.label,
        comment: data.comment || null,
        paymentMethod: data.paymentMethod,
        subtotalAmd: subtotal,
        deliveryFeeAmd: deliveryFee,
        totalAmd: total,
        locale,
        consentAt: new Date(),
        ipHash,
      })
      .returning({ id: orders.id });
    await tx.insert(orderItems).values(
      lines.map((l) => ({
        orderId: order!.id,
        productId: l.product.id,
        name: t(l.product.name, locale),
        unitPriceAmd: l.unitPriceAmd,
        quantity: l.quantity,
        lineTotalAmd: l.lineTotalAmd,
        details: {
          options: l.options.map((o) => ({
            id: o.id,
            name: t(o.name, locale),
            priceDeltaAmd: o.priceDeltaAmd,
          })),
          messages: l.messages.length ? l.messages : undefined,
          contents: l.contents.length
            ? l.contents.map((c) => ({
                productId: c.id,
                name: t(c.name, locale),
                priceAmd: c.priceAmd,
              }))
            : undefined,
        },
      })),
    );
    await tx.insert(orderStatusHistory).values({ orderId: order!.id, toStatus: "new" });
  });

  return { ok: true, publicId };
}

/** Plain-text summary for Telegram / email. Staff read Russian or Armenian; we send English + item names as ordered. */
export async function orderNotification(publicId: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.publicId, publicId) });
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const shops = await getShops();
  const shop = shops.find((s) => s.id === order.shopId);
  const district = districts.find((d) => d.key === order.district);
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Yerevan",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(order.scheduledFor);

  const lines = items.map((i) => {
    const d = i.details;
    const extra = [
      d?.options?.map((o) => o.name).join(", "),
      d?.contents?.length ? `box: ${d.contents.map((c) => c.name).join(", ")}` : "",
      d?.messages?.length ? `text: «${d.messages.join(" / ")}»` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    return `• ${i.quantity} × ${i.name}${extra ? ` (${extra})` : ""} = ${i.lineTotalAmd} AMD`;
  });

  const where =
    order.fulfilment === "pickup"
      ? `PICKUP at ${shop ? t(shop.name, "en") : "?"}`
      : `DELIVERY to ${order.address?.street} ${order.address?.building}` +
        `${order.address?.entrance ? `, entr. ${order.address.entrance}` : ""}` +
        `${order.address?.floor ? `, fl. ${order.address.floor}` : ""}` +
        `${order.address?.apartment ? `, apt ${order.address.apartment}` : ""}` +
        ` (${district ? t(district.name, "en") : order.district})`;

  const text = [
    `${where}`,
    `When: ${date}, ${order.slotLabel}`,
    `Name: ${order.customerName}`,
    `Phone: ${formatPhone(order.phone)}`,
    `Payment: ${order.paymentMethod === "cash" ? "cash" : "card"}`,
    "",
    ...lines,
    order.deliveryFeeAmd ? `Delivery: ${order.deliveryFeeAmd} AMD` : "",
    `TOTAL: ${order.totalAmd} AMD`,
    order.comment ? `\nComment: ${order.comment}` : "",
    `\nAdmin: ${env.siteUrl}/admin/orders/${order.id}`,
  ]
    .filter((l) => l !== "")
    .join("\n");

  return {
    orderId: order.id,
    subject: `New order #${order.shortCode} · ${order.totalAmd} AMD`,
    text,
  };
}
