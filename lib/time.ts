import type { WeekHours } from "@/db/schema";

/** All shop times are local Yerevan time. Armenia has no daylight saving (UTC+4). */
export const SHOP_TZ = "Asia/Yerevan";

export type YerevanParts = {
  year: number;
  month: number;
  day: number;
  /** 0 = Sunday. */
  weekday: number;
  /** Minutes since local midnight. */
  minutes: number;
  dateKey: string;
};

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SHOP_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function yerevanParts(date: Date): YerevanParts {
  const p = Object.fromEntries(partsFormatter.formatToParts(date).map((x) => [x.type, x.value]));
  const year = Number(p.year);
  const month = Number(p.month);
  const day = Number(p.day);
  const hour = Number(p.hour) % 24;
  return {
    year,
    month,
    day,
    weekday: WEEKDAYS.indexOf(p.weekday ?? "Sun"),
    minutes: hour * 60 + Number(p.minute),
    dateKey: `${p.year}-${p.month}-${p.day}`,
  };
}

/** "09:30" → 570. "00:00" as a closing time means midnight at the end of the day (1440). */
export function toMinutes(hhmm: string, isClosing = false): number {
  const [h, m] = hhmm.split(":").map(Number);
  const value = (h ?? 0) * 60 + (m ?? 0);
  return isClosing && value === 0 ? 24 * 60 : value;
}

export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Converts a Yerevan wall-clock time to a UTC Date. */
export function yerevanToUtc(dateKey: string, minutes: number): Date {
  const [y, mo, d] = dateKey.split("-").map(Number);
  const guess = Date.UTC(y!, mo! - 1, d!, 0, minutes);
  // Find the zone offset at that moment (always +4h today, but do not hard-code it).
  const p = yerevanParts(new Date(guess));
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, 0, p.minutes);
  return new Date(guess - (asUtc - guess));
}

export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days));
  return dt.toISOString().slice(0, 10);
}

export function weekdayOf(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
}

export type ShopStatus =
  | { state: "open"; closesAt: string }
  | { state: "closed"; opensAt: string; opensToday: boolean }
  | { state: "unknown" };

/** Live open/closed state for a shop. Mall shops (hours = null) return "unknown". */
export function shopStatus(
  hours: WeekHours | null | undefined,
  now: Date = new Date(),
): ShopStatus {
  if (!hours || hours.length !== 7) return { state: "unknown" };
  const p = yerevanParts(now);
  const today = hours[p.weekday];
  if (today) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close, true);
    if (p.minutes >= open && p.minutes < close) return { state: "open", closesAt: today.close };
    if (p.minutes < open) return { state: "closed", opensAt: today.open, opensToday: true };
  }
  for (let i = 1; i <= 7; i++) {
    const next = hours[(p.weekday + i) % 7];
    if (next) return { state: "closed", opensAt: next.open, opensToday: false };
  }
  return { state: "unknown" };
}

export type Slot = { start: Date; label: string; value: string };

/**
 * Time slots for one day inside an opening window, skipping anything that
 * starts sooner than `leadMinutes` from now.
 */
export function buildSlots(opts: {
  dateKey: string;
  open: string;
  close: string;
  slotMinutes: number;
  leadMinutes: number;
  now?: Date;
}): Slot[] {
  const now = opts.now ?? new Date();
  const earliest = now.getTime() + opts.leadMinutes * 60_000;
  const open = toMinutes(opts.open);
  const close = toMinutes(opts.close, true);
  const slots: Slot[] = [];
  for (let m = open; m + opts.slotMinutes <= close; m += opts.slotMinutes) {
    const start = yerevanToUtc(opts.dateKey, m);
    if (start.getTime() < earliest) continue;
    const label = `${fromMinutes(m)}–${fromMinutes(m + opts.slotMinutes)}`;
    slots.push({ start, label, value: `${opts.dateKey}T${fromMinutes(m)}` });
  }
  return slots;
}

/** Opening window for a shop on a given day; mall shops use 10:00–22:00 for pickup. */
export function windowFor(hours: WeekHours | null | undefined, dateKey: string) {
  if (!hours) return { open: "10:00", close: "22:00" };
  return hours[weekdayOf(dateKey)] ?? null;
}

/** Dates customers may choose, starting `minDaysAhead` from today in Yerevan. */
export function selectableDates(opts: { minDaysAhead: number; maxDaysAhead: number; now?: Date }) {
  const today = yerevanParts(opts.now ?? new Date()).dateKey;
  const out: string[] = [];
  for (let i = opts.minDaysAhead; i <= opts.maxDaysAhead; i++) out.push(addDays(today, i));
  return out;
}
