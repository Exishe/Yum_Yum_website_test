import { describe, expect, it } from "vitest";
import type { MenuProduct, PublicZone } from "@/lib/catalog";
import { isPricingError, priceLine, quoteDelivery } from "@/lib/pricing";

const L = (s: string) => ({ hy: s, ru: s, en: s });
const p = (id: number, price: number, extra: Partial<MenuProduct> = {}): MenuProduct => ({
  id,
  categoryId: 1,
  slug: `p${id}`,
  name: L(`P${id}`),
  description: null,
  priceAmd: price,
  priceOnRequest: false,
  buyamUrl: null,
  image: null,
  imageAlt: null,
  tags: [],
  badges: [],
  isAvailable: true,
  isFeatured: false,
  leadTimeDays: 0,
  boxSize: null,
  options: [],
  ...extra,
});

const latte = p(1, 700, {
  options: [
    {
      id: 10,
      kind: "size",
      name: L("Regular"),
      priceDeltaAmd: 0,
      isDefault: true,
      maxLength: null,
    },
    { id: 11, kind: "size", name: L("XL"), priceDeltaAmd: 200, isDefault: false, maxLength: null },
    {
      id: 12,
      kind: "syrup",
      name: L("Caramel"),
      priceDeltaAmd: 200,
      isDefault: false,
      maxLength: null,
    },
  ],
});
const donut = p(2, 700);
const soldOut = p(3, 550, { isAvailable: false });
const box = p(4, 200, { boxSize: 2 });
const named = p(5, 900, {
  options: [
    { id: 50, kind: "text", name: L("Text"), priceDeltaAmd: 0, isDefault: false, maxLength: 5 },
  ],
});
const askUs = p(6, 900, { priceOnRequest: true });
const askUsBox = p(7, 400, { boxSize: 2, priceOnRequest: true });
const all = new Map([latte, donut, soldOut, box, named, askUs, askUsBox].map((x) => [x.id, x]));
const boxable = new Set([2, 3, 6]);

describe("priceLine", () => {
  it("adds option prices", () => {
    const r = priceLine({ productId: 1, quantity: 2, optionIds: [11, 12] }, all, boxable);
    expect(isPricingError(r)).toBe(false);
    if (!isPricingError(r)) expect(r.lineTotalAmd).toBe(2 * (700 + 200 + 200));
  });
  it("rejects two sizes and foreign options", () => {
    expect(
      priceLine({ productId: 1, quantity: 1, optionIds: [10, 11] }, all, boxable),
    ).toMatchObject({ code: "badOption" });
    expect(priceLine({ productId: 2, quantity: 1, optionIds: [12] }, all, boxable)).toMatchObject({
      code: "badOption",
    });
  });
  it("rejects sold-out and unknown products", () => {
    expect(priceLine({ productId: 3, quantity: 1 }, all, boxable)).toMatchObject({
      code: "unavailable",
    });
    expect(priceLine({ productId: 99, quantity: 1 }, all, boxable)).toMatchObject({
      code: "unavailable",
    });
  });
  it("refuses items whose price is on request, alone or in a box", () => {
    expect(priceLine({ productId: 6, quantity: 1 }, all, boxable)).toMatchObject({
      code: "onRequest",
    });
    expect(priceLine({ productId: 7, quantity: 1, contents: [2, 2] }, all, boxable)).toMatchObject({
      code: "onRequest",
    });
    expect(priceLine({ productId: 4, quantity: 1, contents: [2, 6] }, all, boxable)).toMatchObject({
      code: "badBox",
    });
  });
  it("prices a full box and refuses a half-empty one", () => {
    const r = priceLine({ productId: 4, quantity: 1, contents: [2, 2] }, all, boxable);
    if (isPricingError(r)) throw new Error(r.code);
    expect(r.unitPriceAmd).toBe(200 + 700 + 700);
    expect(priceLine({ productId: 4, quantity: 1, contents: [2] }, all, boxable)).toMatchObject({
      code: "badBox",
    });
    expect(priceLine({ productId: 4, quantity: 1, contents: [2, 3] }, all, boxable)).toMatchObject({
      code: "badBox",
    });
  });
  it("checks text length for name donuts", () => {
    expect(
      isPricingError(priceLine({ productId: 5, quantity: 1, messages: ["Ani"] }, all, boxable)),
    ).toBe(false);
    expect(
      priceLine({ productId: 5, quantity: 1, messages: ["Anahit!"] }, all, boxable),
    ).toMatchObject({ code: "badMessage" });
    expect(priceLine({ productId: 2, quantity: 1, messages: ["x"] }, all, boxable)).toMatchObject({
      code: "badMessage",
    });
  });
});

describe("quoteDelivery", () => {
  const zones: PublicZone[] = [
    {
      id: 1,
      name: L("Centre"),
      districts: ["kentron"],
      feeAmd: 700,
      minOrderAmd: 3000,
      freeFromAmd: 15000,
      etaMinutes: 45,
    },
  ];
  it("applies fee, minimum and free threshold", () => {
    expect(quoteDelivery("kentron", 5000, zones)).toMatchObject({ ok: true, feeAmd: 700 });
    expect(quoteDelivery("kentron", 2000, zones)).toMatchObject({
      ok: false,
      reason: "belowMinimum",
    });
    expect(quoteDelivery("kentron", 15000, zones)).toMatchObject({ ok: true, feeAmd: 0 });
    expect(quoteDelivery("avan", 5000, zones)).toMatchObject({ ok: false, reason: "noZone" });
  });
});
