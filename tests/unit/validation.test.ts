import { describe, expect, it } from "vitest";
import { formatAmd, formatPhone, normalizeArmenianPhone } from "@/lib/format";
import { checkoutSchema, clean } from "@/lib/validation";

describe("phones", () => {
  it("normalises the ways people write Armenian numbers", () => {
    for (const v of [
      "094 30 15 74",
      "+374 94 301574",
      "37494301574",
      "0037494301574",
      "(094) 30-15-74",
    ]) {
      expect(normalizeArmenianPhone(v)).toBe("+37494301574");
    }
    expect(normalizeArmenianPhone("12345")).toBeNull();
    expect(normalizeArmenianPhone("+7 912 345 67 89")).toBeNull();
    expect(formatPhone("+37433301574", "local")).toBe("033 30 15 74");
  });
});

describe("money", () => {
  it("formats dram the same way in every language", () => {
    expect(formatAmd(1500, "en")).toBe("1 500 ֏");
    expect(formatAmd(700, "hy")).toBe("700 ֏");
  });
});

describe("checkout schema", () => {
  const base = {
    items: [{ productId: 1, quantity: 1 }],
    fulfilment: "pickup",
    shopId: 1,
    name: "  Ani  ",
    phone: "094301574",
    date: "2026-10-23",
    slot: "2026-10-23T10:00",
    paymentMethod: "cash",
    consent: true,
    locale: "hy",
  };
  it("accepts a valid pickup order and cleans input", () => {
    const r = checkoutSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.name).toBe("Ani");
      expect(r.data.phone).toBe("+37494301574");
    }
  });
  it("requires consent, a district for delivery and a matching slot", () => {
    expect(checkoutSchema.safeParse({ ...base, consent: false }).success).toBe(false);
    expect(
      checkoutSchema.safeParse({ ...base, fulfilment: "delivery", shopId: undefined }).success,
    ).toBe(false);
    expect(checkoutSchema.safeParse({ ...base, slot: "2026-10-24T10:00" }).success).toBe(false);
  });
  it("rejects the honeypot and over-long text", () => {
    expect(checkoutSchema.safeParse({ ...base, website: "http://spam" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...base, comment: "x".repeat(501) }).success).toBe(false);
  });
  it("strips control and bidi characters", () => {
    expect(clean("A‮ni\u0000 ")).toBe("Ani");
  });
});
