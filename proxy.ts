import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { hiddenFromSearch } from "@/lib/demo-config";
import { PREVIEW_BOTS, SITE_GATE_COOKIE, siteGateToken, sitePassword } from "@/lib/site-gate";

const intl = createIntlMiddleware(routing);

const analyticsHost = (() => {
  try {
    const src = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT;
    return src ? new URL(src).origin : "";
  } catch {
    return "";
  }
})();

function buildCsp(nonce: string, https: boolean) {
  const isDev = process.env.NODE_ENV === "development";
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline style attributes are needed by the animation library. Style
    // injection cannot run code, so this is an accepted trade-off.
    `style-src 'self' 'unsafe-inline'`,
    // Vercel Blob holds photos uploaded in the admin.
    `img-src 'self' data: blob: https://*.public.blob.vercel-storage.com`,
    `font-src 'self'`,
    `connect-src 'self' ${analyticsHost} https://challenges.cloudflare.com`
      .replace(/\s+/g, " ")
      .trim(),
    `frame-src https://challenges.cloudflare.com https://www.openstreetmap.org`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `manifest-src 'self'`,
    `worker-src 'self' blob:`,
    // Only over https. Safari also applies it to http://localhost, where it
    // turns every stylesheet, script and image into a failing https request.
    https && !isDev ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export default function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const https =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
  const csp = buildCsp(nonce, https);
  const { pathname } = request.nextUrl;

  // The admin panel is not localised and does its own auth checks.
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isUnlock = pathname === "/unlock";

  // Private preview: everything but the admin asks for the site password first.
  if (
    sitePassword() &&
    !isAdmin &&
    !isUnlock &&
    request.cookies.get(SITE_GATE_COOKIE)?.value !== siteGateToken() &&
    !PREVIEW_BOTS.test(request.headers.get("user-agent") ?? "")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/unlock";
    url.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
    const res = NextResponse.redirect(url);
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", csp);
  request.headers.set("x-pathname", pathname);

  const response =
    isAdmin || isUnlock
      ? NextResponse.next({ request: { headers: request.headers } })
      : intl(request);

  response.headers.set("Content-Security-Policy", csp);
  // The concept demo and preview links (pnpm share) must never end up in search results.
  if (hiddenFromSearch) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (isAdmin || isUnlock) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "no-store");
  }
  return response;
}

export const config = {
  // Locale rewrites need every page request, prefetches included.
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|images|uploads|fonts|icon.png|apple-icon.png|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|txt|xml|webmanifest)$).*)",
    },
  ],
};
