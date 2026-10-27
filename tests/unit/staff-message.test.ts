import { describe, expect, it } from "vitest";
import { bothNames, contactMessage, orderMessage, type StaffOrder } from "@/lib/staff-message";

const base: StaffOrder = {
  shortCode: "5885",
  fulfilment: "pickup",
  shopName: { hy: "Աբովյան 25", ru: "Абовяна 25", en: "Abovyan 25" },
  scheduledFor: new Date("2026-10-27T06:00:00Z"),
  slotLabel: "10:00–10:30",
  customerName: "Ani",
  phone: "+374 94 10 32 47",
  paymentMethod: "cash",
  deliveryFeeAmd: 0,
  totalAmd: 2100,
  adminUrl: "http://localhost:3000/admin/orders/x",
  items: [
    {
      quantity: 1,
      // The customer ordered in Russian; the staff still get Armenian.
      name: "Шоколадный донат",
      names: { hy: "Շոկոլադե դոնաթ", ru: "Шоколадный донат", en: "Chocolate glazed" },
      lineTotalAmd: 700,
    },
    {
      quantity: 1,
      name: "Коробка на 6",
      names: { hy: "Տուփ 6 դոնաթի համար", ru: "Коробка на 6", en: "Box of 6" },
      lineTotalAmd: 1400,
      contents: ["Լիմոն (Lemon)"],
      messages: ["Աննա"],
    },
  ],
};

describe("orderMessage", () => {
  it("writes the order in Armenian with English next to it", () => {
    const { subject, text } = orderMessage(base);
    expect(subject).toBe("Նոր պատվեր / New order #5885 · 2 100 ֏");
    expect(text).toContain("ԻՆՔՆԱՌԱՔՈՒՄ / PICKUP: Աբովյան 25 (Abovyan 25)");
    expect(text).toContain("• 1 × Շոկոլադե դոնաթ (Chocolate glazed) = 700 ֏");
    expect(text).toContain("տուփ / box: Լիմոն (Lemon)");
    expect(text).toContain("գրություն / text: «Աննա»");
    expect(text).toContain("Վճարում / Payment: կանխիկ / cash");
    expect(text).toContain("ԸՆԴԱՄԵՆԸ / TOTAL: 2 100 ֏");
    expect(text).not.toMatch(/Шоколад|Коробка/);
    expect(text.split("\n")[0]).toContain("Call the customer to confirm");
  });

  it("tells staff whether the number is new or has a record", () => {
    expect(orderMessage({ ...base, history: { total: 0, done: 0, cancelled: 0 } }).text).toContain(
      "Առաջին պատվերն այս համարից / First order from this number",
    );
    expect(orderMessage({ ...base, history: { total: 3, done: 1, cancelled: 2 } }).text).toContain(
      "Նախկին պատվերներ / Earlier orders: 3 (1 կատարված / done, 2 չեղարկված / cancelled)",
    );
    expect(orderMessage(base).text).not.toContain("Earlier orders");
  });

  it("describes a delivery address and fee", () => {
    const { text } = orderMessage({
      ...base,
      fulfilment: "delivery",
      shopName: null,
      address: { street: "Tumanyan", building: "5", floor: "3", apartment: "12" },
      districtName: { hy: "Կենտրոն", ru: "Кентрон", en: "Kentron" },
      deliveryFeeAmd: 700,
      paymentMethod: "card_on_delivery",
      comment: "Զանգել մուտքի մոտ",
    });
    expect(text).toContain("ԱՌԱՔՈՒՄ / DELIVERY: Tumanyan 5, հարկ 3, բն. 12 (Կենտրոն (Kentron))");
    expect(text).toContain("Առաքում / Delivery: 700 ֏");
    expect(text).toContain("քարտով / card");
    expect(text).toContain("Մեկնաբանություն / Comment: Զանգել մուտքի մոտ");
  });

  it("falls back to the stored name when the product is gone", () => {
    const { text } = orderMessage({
      ...base,
      items: [{ quantity: 2, name: "Old donut", names: null, lineTotalAmd: 1000 }],
    });
    expect(text).toContain("• 2 × Old donut = 1 000 ֏");
  });
});

describe("bothNames and contactMessage", () => {
  it("does not repeat identical names", () => {
    expect(bothNames({ hy: "XL", ru: "XL", en: "XL" }, "?")).toBe("XL");
  });
  it("labels website messages in Armenian", () => {
    expect(contactMessage({ name: "Aram", contact: "+374…", message: "Բարև" })).toEqual({
      subject: "Նոր հաղորդագրություն կայքից / Website message: Aram",
      text: "Aram (+374…) գրել է / wrote:\n\nԲարև",
    });
  });
});
