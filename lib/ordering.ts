/*
 * Which days and time slots a customer may choose. Pure, so the checkout form
 * and the server use exactly the same rules.
 */
import type { WeekHours } from "@/db/schema";
import { buildSlots, selectableDates, windowFor, type Slot } from "./time";

export type OrderingRules = {
  deliveryHours: { open: string; close: string };
  pickupSlotMinutes: number;
  deliverySlotMinutes: number;
  minLeadMinutes: number;
  maxDaysAhead: number;
};

export type DayOption = { dateKey: string; slots: Slot[] };

export function availableDays(opts: {
  fulfilment: "pickup" | "delivery";
  shopHours?: WeekHours | null;
  rules: OrderingRules;
  /** 0 = today is fine; 1 = made-to-order items, tomorrow at the earliest. */
  leadDays: number;
  now?: Date;
}): DayOption[] {
  const { rules, fulfilment } = opts;
  const dates = selectableDates({
    minDaysAhead: opts.leadDays,
    maxDaysAhead: Math.max(rules.maxDaysAhead, opts.leadDays),
    now: opts.now,
  });
  return dates
    .map((dateKey) => {
      const window =
        fulfilment === "delivery"
          ? rules.deliveryHours
          : windowFor(opts.shopHours ?? null, dateKey);
      if (!window) return { dateKey, slots: [] };
      const slots = buildSlots({
        dateKey,
        open: window.open,
        close: window.close,
        slotMinutes:
          fulfilment === "delivery" ? rules.deliverySlotMinutes : rules.pickupSlotMinutes,
        leadMinutes: rules.minLeadMinutes,
        now: opts.now,
      });
      return { dateKey, slots };
    })
    .filter((d) => d.slots.length > 0);
}

export function findSlot(days: DayOption[], value: string): Slot | undefined {
  for (const d of days) {
    const s = d.slots.find((x) => x.value === value);
    if (s) return s;
  }
  return undefined;
}
