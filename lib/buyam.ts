import type { Locale } from "@/i18n/routing";

/** buy.am serves Armenian at the root and Russian/English under /ru and /en. */
export function buyamLink(url: string, locale: Locale): string {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  if (u.hostname !== "buy.am" || locale === "hy" || /^\/(ru|en)\//.test(u.pathname)) return url;
  u.pathname = `/${locale}${u.pathname}`;
  return u.toString();
}
