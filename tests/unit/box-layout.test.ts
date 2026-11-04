import { describe, expect, it } from "vitest";
import { boxColumns } from "@/lib/box-layout";

describe("gift box layout", () => {
  it("lays common box sizes out in full, wide rows", () => {
    expect(boxColumns(6)).toBe(3);
    expect(boxColumns(9)).toBe(3);
    expect(boxColumns(8)).toBe(4);
    expect(boxColumns(12)).toBe(4);
    expect(boxColumns(16)).toBe(4);
    expect(boxColumns(10)).toBe(5);
    expect(boxColumns(20)).toBe(5);
    expect(boxColumns(18)).toBe(6);
    expect(boxColumns(24)).toBe(6);
    expect(boxColumns(36)).toBe(6);
  });

  it("handles tiny and awkward sizes without more than 6 columns", () => {
    expect(boxColumns(1)).toBe(1);
    expect(boxColumns(2)).toBe(2);
    expect(boxColumns(4)).toBe(4);
    for (const n of [5, 7, 11, 13, 17, 23, 47, 48]) {
      const c = boxColumns(n);
      expect(c).toBeGreaterThanOrEqual(3);
      expect(c).toBeLessThanOrEqual(6);
    }
  });
});
