import type { Locale } from "@/i18n/routing";
import { intlLocale } from "./localized";

/** "1 500 ֏". Dram has no minor units on menus. */
export function formatAmd(amount: number, locale: Locale): string {
  const n = new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: 0 })
    .format(amount)
    // Use a thin non-breaking space as the group separator in every locale.
    .replace(/[\s,.  ]/g, " ");
  return `${n} ֏`;
}

/** Normalises any Armenian number to +374XXXXXXXX, or returns null. */
export function normalizeArmenianPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  let local: string | null = null;
  if (/^\+374\d{8}$/.test(digits)) local = digits.slice(4);
  else if (/^00374\d{8}$/.test(digits)) local = digits.slice(5);
  else if (/^374\d{8}$/.test(digits)) local = digits.slice(3);
  else if (/^0\d{8}$/.test(digits)) local = digits.slice(1);
  else if (/^\d{8}$/.test(digits)) local = digits;
  if (!local) return null;
  // Mobile (33, 4x, 55, 77, 9x …) and Yerevan landlines (10, 11, 60) start with 1–9.
  if (!/^[1-9]\d{7}$/.test(local)) return null;
  return `+374${local}`;
}

/** "+374 94 30 15 74" for display; local "094 30 15 74" style is also common. */
export function formatPhone(e164: string, style: "intl" | "local" = "intl"): string {
  const m = /^\+374(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(e164);
  if (!m) return e164;
  const [, a, b, c, d] = m;
  return style === "local" ? `0${a} ${b} ${c} ${d}` : `+374 ${a} ${b} ${c} ${d}`;
}

export function formatDate(date: Date, locale: Locale, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    timeZone: "Asia/Yerevan",
    day: "numeric",
    month: "long",
    ...opts,
  }).format(date);
}
