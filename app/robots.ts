import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { hiddenFromSearch } from "@/lib/demo-config";

export default function robots(): MetadataRoute.Robots {
  // The concept demo and preview links (pnpm share) are hidden from search engines.
  // Messenger bots may still read pages and the preview image, so a shared link
  // shows a proper card in Telegram and WhatsApp.
  if (hiddenFromSearch)
    return {
      rules: [
        {
          userAgent: ["TelegramBot", "WhatsApp", "facebookexternalhit", "Facebot", "Twitterbot"],
          allow: "/",
        },
        { userAgent: "*", allow: "/images/brand/", disallow: "/" },
      ],
    };
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
