import { describe, expect, it } from "vitest";
import { buildSlots, shopStatus, yerevanParts, yerevanToUtc } from "@/lib/time";

const daily = Array.from({ length: 7 }, () => ({ open: "09:00", close: "22:00" }));

describe("Yerevan time", () => {
  it("is UTC+4", () => {
    const d = new Date("2026-10-23T06:30:00Z");
    expect(yerevanParts(d).minutes).toBe(10 * 60 + 30);
    expect(yerevanToUtc("2026-10-23", 9 * 60).toISOString()).toBe("2026-10-23T05:00:00.000Z");
  });

  it("knows when a shop is open", () => {
    expect(shopStatus(daily, new Date("2026-10-23T06:00:00Z"))).toEqual({
      state: "open",
      closesAt: "22:00",
    });
    expect(shopStatus(daily, new Date("2026-10-23T04:00:00Z"))).toEqual({
      state: "closed",
      opensAt: "09:00",
      opensToday: true,
    });
    expect(shopStatus(daily, new Date("2026-10-23T18:30:00Z"))).toEqual({
      state: "closed",
      opensAt: "09:00",
      opensToday: false,
    });
    expect(shopStatus(null)).toEqual({ state: "unknown" });
  });

  it("handles a later Sunday opening", () => {
    const hours = [{ open: "10:00", close: "22:00" }, ...daily.slice(1)];
    // Sunday 25 Oct 2026, 09:30 Yerevan
    expect(shopStatus(hours, new Date("2026-10-25T05:30:00Z"))).toEqual({
      state: "closed",
      opensAt: "10:00",
      opensToday: true,
    });
  });

  it("builds slots inside opening hours and skips the past", () => {
    const now = new Date("2026-10-23T08:10:00Z"); // 12:10 in Yerevan
    const slots = buildSlots({
      dateKey: "2026-10-23",
      open: "09:00",
      close: "22:00",
      slotMinutes: 30,
      leadMinutes: 45,
      now,
    });
    expect(slots[0]!.label).toBe("13:00–13:30");
    expect(slots.at(-1)!.label).toBe("21:30–22:00");
  });
});
