/*
 * Texts sent to the shop staff (Telegram, email). Armenian first, English next
 * to it, whatever language the customer ordered in. Pure functions, no I/O.
 */
import type { Localized } from "@/db/schema";

/** "Armenian / English" for one label. */
const L = {
  newOrder: "Նոր պատվեր / New order",
  pickup: "ԻՆՔՆԱՌԱՔՈՒՄ / PICKUP",
  delivery: "ԱՌԱՔՈՒՄ / DELIVERY",
  when: "Երբ / When",
  name: "Անուն / Name",
  phone: "Հեռախոս / Phone",
  payment: "Վճարում / Payment",
  cash: "կանխիկ / cash",
  card: "քարտով / card",
  deliveryFee: "Առաքում / Delivery",
  total: "ԸՆԴԱՄԵՆԸ / TOTAL",
  comment: "Մեկնաբանություն / Comment",
  admin: "Ադմին / Admin",
  box: "տուփ / box",
  text: "գրություն / text",
  entrance: "մուտք",
  floor: "հարկ",
  apartment: "բն.",
  callFirst: "Զանգահարեք հաճախորդին՝ պատվերը հաստատելու համար / Call the customer to confirm",
  firstOrder: "Առաջին պատվերն այս համարից / First order from this number",
  earlier: "Նախկին պատվերներ / Earlier orders",
  done: "կատարված / done",
  cancelled: "չեղարկված / cancelled",
  newMessage: "Նոր հաղորդագրություն կայքից / Website message",
  wrote: "գրել է / wrote",
} as const;

/** "Armenian (English)" for a menu name; just one when both are the same or one is missing. */
export function bothNames(name: Localized | null | undefined, fallback: string): string {
  const hy = name?.hy?.trim();
  const en = name?.en?.trim();
  if (hy && en && hy !== en) return `${hy} (${en})`;
  return hy || en || fallback;
}

const amd = (n: number) => `${n.toLocaleString("en-US").replace(/,/g, " ")} ֏`;

export type StaffOrder = {
  shortCode: string;
  fulfilment: "pickup" | "delivery";
  shopName?: Localized | null;
  address?: {
    street?: string;
    building?: string;
    entrance?: string;
    floor?: string;
    apartment?: string;
  } | null;
  districtName?: Localized | null;
  districtKey?: string | null;
  scheduledFor: Date;
  slotLabel: string;
  customerName: string;
  phone: string;
  paymentMethod: string;
  deliveryFeeAmd: number;
  totalAmd: number;
  comment?: string | null;
  adminUrl: string;
  /** Earlier orders from the same number; omitted when unknown. */
  history?: { total: number; done: number; cancelled: number };
  items: Array<{
    quantity: number;
    name: string;
    names?: Localized | null;
    lineTotalAmd: number;
    options?: string[];
    contents?: string[];
    messages?: string[];
  }>;
};

export function orderMessage(o: StaffOrder): { subject: string; text: string } {
  const date = (locale: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: "Asia/Yerevan",
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(o.scheduledFor);

  const where =
    o.fulfilment === "pickup"
      ? `${L.pickup}: ${bothNames(o.shopName, "?")}`
      : `${L.delivery}: ${[
          `${o.address?.street ?? ""} ${o.address?.building ?? ""}`.trim(),
          o.address?.entrance ? `${L.entrance} ${o.address.entrance}` : "",
          o.address?.floor ? `${L.floor} ${o.address.floor}` : "",
          o.address?.apartment ? `${L.apartment} ${o.address.apartment}` : "",
        ]
          .filter(Boolean)
          .join(", ")} (${bothNames(o.districtName, o.districtKey ?? "?")})`;

  const lines = o.items.map((i) => {
    const extra = [
      i.options?.length ? i.options.join(", ") : "",
      i.contents?.length ? `${L.box}: ${i.contents.join(", ")}` : "",
      i.messages?.length ? `${L.text}: «${i.messages.join(" / ")}»` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    return `• ${i.quantity} × ${bothNames(i.names, i.name)}${extra ? ` (${extra})` : ""} = ${amd(i.lineTotalAmd)}`;
  });

  const text = [
    `⚠ ${L.callFirst}`,
    where,
    `${L.when}: ${date("hy-AM")} (${date("en-GB")}), ${o.slotLabel}`,
    `${L.name}: ${o.customerName}`,
    `${L.phone}: ${o.phone}`,
    o.history
      ? o.history.total === 0
        ? L.firstOrder
        : `${L.earlier}: ${o.history.total} (${o.history.done} ${L.done}, ${o.history.cancelled} ${L.cancelled})`
      : "",
    `${L.payment}: ${o.paymentMethod === "cash" ? L.cash : L.card}`,
    "",
    ...lines,
    o.deliveryFeeAmd ? `${L.deliveryFee}: ${amd(o.deliveryFeeAmd)}` : "",
    `${L.total}: ${amd(o.totalAmd)}`,
    o.comment ? `\n${L.comment}: ${o.comment}` : "",
    `\n${L.admin}: ${o.adminUrl}`,
  ]
    .filter((l) => l !== "")
    .join("\n");

  return { subject: `${L.newOrder} #${o.shortCode} · ${amd(o.totalAmd)}`, text };
}

export function contactMessage(m: { name: string; contact: string; message: string }) {
  return {
    subject: `${L.newMessage}: ${m.name}`,
    text: `${m.name} (${m.contact}) ${L.wrote}:\n\n${m.message}`,
  };
}
