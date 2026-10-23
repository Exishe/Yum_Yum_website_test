import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { locales, type AppPathname } from "@/i18n/routing";
import { env } from "@/lib/env";

const pages: AppPathname[] = [
  "/",
  "/menu",
  "/gifts",
  "/story",
  "/shops",
  "/contact",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.flatMap((href) =>
    locales.map((locale) => ({
      url: env.siteUrl + getPathname({ locale, href: href as never }),
      changeFrequency: href === "/menu" ? ("daily" as const) : ("weekly" as const),
      priority: href === "/" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, env.siteUrl + getPathname({ locale: l, href: href as never })]),
        ),
      },
    })),
  );
}
