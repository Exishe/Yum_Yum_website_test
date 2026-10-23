import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createIntlMiddleware(routing);

const analyticsHost = (() => {
  try {
    const src = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT;
    return src ? new URL(src).origin : "";
  } catch {
    return "";
  }
})();

function buildCsp(nonce: string) {
  const isDev = process.env.NODE_ENV === "development";
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline style attributes are needed by the animation library. Style
    // injection cannot run code, so this is an accepted trade-off.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: ${supabase}`.trim(),
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
    isDev ? "" : "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");
}

export default function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);
  const { pathname } = request.nextUrl;

  // The admin panel is not localised and does its own auth checks.
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", csp);
  request.headers.set("x-pathname", pathname);

  const response = isAdmin
    ? NextResponse.next({ request: { headers: request.headers } })
    : intl(request);

  response.headers.set("Content-Security-Policy", csp);
  // Preview links (pnpm share) must never end up in search results.
  if (process.env.PREVIEW_NOINDEX === "1")
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (isAdmin) {
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
