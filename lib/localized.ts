import type { Localized } from "@/db/schema";
import type { Locale } from "@/i18n/routing";

/** Picks the string for a locale, falling back to Armenian, then English. */
export function t(value: Localized | null | undefined, locale: Locale): string {
  if (!value) return "";
  return value[locale] || value.hy || value.en || "";
}

export const intlLocale: Record<Locale, string> = { hy: "hy-AM", ru: "ru-RU", en: "en-GB" };
