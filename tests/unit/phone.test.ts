import { describe, expect, it } from "vitest";
import { countryOf, normalizePhone } from "@/lib/phone";
import { phoneSchema } from "@/lib/validation";

describe("phone numbers from any country", () => {
  it("keeps every Armenian form working", () => {
    expect(normalizePhone("094 30 15 74")).toBe("+37494301574");
    expect(normalizePhone("+374 94 30 15 74")).toBe("+37494301574");
    expect(normalizePhone("94301574")).toBe("+37494301574");
  });

  it("accepts valid numbers of other countries as E.164", () => {
    expect(normalizePhone("+7 912 345-67-89")).toBe("+79123456789");
    expect(normalizePhone("+33 6 12 34 56 78")).toBe("+33612345678");
    expect(normalizePhone("+1 (213) 373-4253")).toBe("+12133734253");
    expect(normalizePhone("555 12 34 56", "GE")).toBe("+995555123456");
    expect(normalizePhone("06 12 34 56 78", "FR")).toBe("+33612345678");
  });

  it("rejects numbers with the wrong length or no digits", () => {
    expect(normalizePhone("+7 912 345")).toBeNull();
    expect(normalizePhone("+374 94 30 15")).toBeNull();
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone("hello")).toBeNull();
    expect(normalizePhone("")).toBeNull();
  });

  it("finds the country of a pasted international number", () => {
    expect(countryOf("+33 6 12 34 56 78")).toBe("FR");
    expect(countryOf("+374 94 30 15 74")).toBe("AM");
  });

  it("is what the checkout and event forms validate with", () => {
    expect(phoneSchema.safeParse("+49 1512 3456789").data).toBe("+4915123456789");
    expect(phoneSchema.safeParse("+49 15").success).toBe(false);
  });
});
