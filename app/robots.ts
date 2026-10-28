import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { hiddenFromSearch } from "@/lib/demo-config";

export default function robots(): MetadataRoute.Robots {
  // The concept demo and preview links (pnpm share) are hidden from search engines entirely.
  if (hiddenFromSearch) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/*/checkout", "/*/patver", "/*/oformlenie", "/*/order/"],
      },
    ],
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
