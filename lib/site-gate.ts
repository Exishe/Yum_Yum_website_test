/*
 * Password screen in front of the public site while it is a private preview.
 * On when SITE_PASSWORD is set; the admin panel keeps its own sign-in.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const SITE_GATE_COOKIE = "yy_site";

export const sitePassword = () => process.env.SITE_PASSWORD ?? "";

/** The cookie value: proves the password was entered, without containing it. */
export function siteGateToken(password = sitePassword()) {
  const secret = process.env.APP_SECRET ?? "dev-only-secret-change-me";
  return createHmac("sha256", secret).update(`site-gate:${password}`).digest("hex");
}

export function passwordMatches(input: string) {
  const a = Buffer.from(siteGateToken(input));
  const b = Buffer.from(siteGateToken());
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Link-preview robots of messengers read only the page title and picture, so
 * a shared link still shows a card in Telegram or WhatsApp.
 */
export const PREVIEW_BOTS =
  /TelegramBot|WhatsApp|facebookexternalhit|Facebot|Twitterbot|Slackbot|Discordbot|LinkedInBot|Viber/i;

/** Only paths inside this site, so the form cannot send people elsewhere. */
export function safeNext(raw: unknown) {
  const s = typeof raw === "string" ? raw : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
}
