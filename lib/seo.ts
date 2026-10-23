import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { locales, type AppPathname, type Locale } from "@/i18n/routing";
import { env } from "./env";

type Href = Parameters<typeof getPathname>[0]["href"];

/** Canonical URL plus hreflang links for every language version of a page. */
export function alternates(locale: Locale, href: AppPathname | Href): Metadata["alternates"] {
  const url = (l: Locale) => env.siteUrl + getPathname({ locale: l, href: href as Href });
  return {
    canonical: url(locale),
    languages: {
      ...Object.fromEntries(
        locales.map((l) => [l === "hy" ? "hy-AM" : l === "ru" ? "ru-RU" : "en", url(l)]),
      ),
      "x-default": url("hy"),
    },
  };
}
