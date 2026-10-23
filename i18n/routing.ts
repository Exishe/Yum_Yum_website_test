import { defineRouting } from "next-intl/routing";

export const locales = ["hy", "ru", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "hy";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeCookie: { name: "NEXT_LOCALE", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" },
  pathnames: {
    "/": "/",
    "/menu": "/menu",
    "/gifts": { en: "/gifts", ru: "/podarki", hy: "/nverner" },
    "/story": { en: "/our-story", ru: "/o-nas", hy: "/mer-masin" },
    "/shops": { en: "/shops", ru: "/adresa", hy: "/khanutner" },
    "/checkout": { en: "/checkout", ru: "/oformlenie", hy: "/patver" },
    "/order/[publicId]": "/order/[publicId]",
    "/contact": { en: "/contact", ru: "/kontakty", hy: "/kap" },
    "/privacy": { en: "/privacy", ru: "/konfidencialnost", hy: "/gaghtniutyun" },
    "/terms": { en: "/terms", ru: "/usloviya", hy: "/paymanner" },
    "/newsletter": "/newsletter",
  },
});

export type AppPathname = keyof typeof routing.pathnames;

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
