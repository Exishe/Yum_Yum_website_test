import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  // Preview links (pnpm share) are hidden from search engines entirely.
  if (process.env.PREVIEW_NOINDEX === "1") return { rules: [{ userAgent: "*", disallow: "/" }] };
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
