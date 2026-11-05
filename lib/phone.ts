/*
 * Phone numbers from any country. Armenian numbers keep their own strict rule
 * (normalizeArmenianPhone); every other country is checked against Google's
 * libphonenumber data, so a number has the right length and prefixes for the
 * country picked. Everything is stored as E.164: +<country code><number>.
 */
import {
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";
import { normalizeArmenianPhone } from "./format";

export type { CountryCode };

/** Shown first in the country list: Armenia, then where most guests call from. */
export const TOP_COUNTRIES: CountryCode[] = ["AM", "RU", "GE", "US", "FR", "DE", "GB", "AE"];

export const dialCode = (c: CountryCode) => `+${getCountryCallingCode(c)}`;

/** Any written form of a number (with the country picked in the form) → E.164, or null. */
export function normalizePhone(input: string, country: CountryCode = "AM"): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const am = normalizeArmenianPhone(raw);
  if (am) return am;
  const parsed = parsePhoneNumberFromString(raw, country);
  if (!parsed?.isValid()) return null;
  // An Armenian number that failed the strict rule above stays rejected.
  if (parsed.country === "AM" || parsed.countryCallingCode === "374") return null;
  return parsed.number;
}

/** The country a full international number belongs to, e.g. "+33 6 12…" → "FR". */
export function countryOf(input: string): CountryCode | undefined {
  return parsePhoneNumberFromString(input.trim())?.country;
}

/** A flag emoji from the two letters of a country code. */
export function flag(c: CountryCode) {
  return String.fromCodePoint(...[...c].map((ch) => 0x1f1a5 + ch.charCodeAt(0)));
}
