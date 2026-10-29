/*
 * Admin panel language. The English text is the key; the Armenian
 * translation lives in lib/admin-hy.ts. Missing keys fall back to English,
 * and a unit test makes sure none are missing.
 * "{name}" placeholders are filled from params.
 */
import { hy } from "./admin-hy";

export type AdminLang = "hy" | "en";
export const ADMIN_LANG_COOKIE = "yy_admin_lang";
export const ADMIN_LANGS: AdminLang[] = ["hy", "en"];

export type Params = Record<string, string | number>;
export type T = ((text: string, params?: Params) => string) & { lang: AdminLang };

export function translate(lang: AdminLang, text: string, params?: Params): string {
  const s = lang === "hy" ? (hy[text] ?? text) : text;
  return params
    ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m))
    : s;
}

export function makeT(lang: AdminLang): T {
  return Object.assign((text: string, params?: Params) => translate(lang, text, params), { lang });
}

/** Locale for dates and numbers in the admin. */
export const adminLocale = (lang: AdminLang) => (lang === "hy" ? "hy-AM" : "en-GB");

/*
 * Flash messages travel in the URL as "text" or "text##{json params}",
 * so they can be translated when shown.
 */
export function encodeFlash(text: string, params?: Params) {
  return params ? `${text}##${JSON.stringify(params)}` : text;
}
export function decodeFlash(raw: string): [string, Params | undefined] {
  const i = raw.indexOf("##");
  if (i < 0) return [raw, undefined];
  try {
    return [raw.slice(0, i), JSON.parse(raw.slice(i + 2)) as Params];
  } catch {
    return [raw.slice(0, i), undefined];
  }
}
