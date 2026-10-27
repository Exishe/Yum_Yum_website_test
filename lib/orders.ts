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
import { customerHistory } from "./blocklist";
import { bothNames, orderMessage } from "./staff-message";
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

/** Message for the shop staff (Telegram / email): Armenian first, English next to it. */
export async function orderNotification(publicId: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.publicId, publicId) });
  if (!order) return null;
  const [items, shops, menu] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    getShops(),
    getMenu(),
  ]);
  // Names were stored in the customer's language; staff get them from the menu in Armenian.
  const products = new Map(menu.flatMap((c) => c.products).map((p) => [p.id, p]));
  const optionNames = new Map(
    [...products.values()].flatMap((p) => p.options).map((o) => [o.id, o.name]),
  );

  const { subject, text } = orderMessage({
    shortCode: order.shortCode,
    fulfilment: order.fulfilment,
    shopName: shops.find((s) => s.id === order.shopId)?.name,
    address: order.address,
    districtName: districts.find((d) => d.key === order.district)?.name,
    districtKey: order.district,
    scheduledFor: order.scheduledFor,
    slotLabel: order.slotLabel,
    customerName: order.customerName,
    phone: formatPhone(order.phone),
    paymentMethod: order.paymentMethod,
    deliveryFeeAmd: order.deliveryFeeAmd,
    totalAmd: order.totalAmd,
    comment: order.comment,
    adminUrl: `${env.siteUrl}/admin/orders/${order.id}`,
    history: await customerHistory(order.phone, order.id),
    items: items.map((i) => ({
      quantity: i.quantity,
      name: i.name,
      names: i.productId ? products.get(i.productId)?.name : null,
      lineTotalAmd: i.lineTotalAmd,
      options: i.details?.options?.map((o) => bothNames(optionNames.get(o.id), o.name)),
      contents: i.details?.contents?.map((c) => bothNames(products.get(c.productId)?.name, c.name)),
      messages: i.details?.messages,
    })),
  });
  return { orderId: order.id, subject, text };
}
