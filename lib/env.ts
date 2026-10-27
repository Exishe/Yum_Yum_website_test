import "server-only";

/** Server-side configuration. Optional services are switched off when their variables are empty. */
export const env = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  isProd: process.env.NODE_ENV === "production",
  /** Random string used to hash IPs and sign tokens. Required in production. */
  secret: process.env.APP_SECRET ?? "dev-only-secret-change-me",
  turnstileSecret: process.env.TURNSTILE_SECRET_KEY ?? "",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
  telegramToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  /** Only for tests against a local stand-in for Telegram. */
  telegramApi: (process.env.TELEGRAM_API ?? "https://api.telegram.org").replace(/\/$/, ""),
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  resendKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "YUM-YUM Donuts <orders@example.com>",
  orderEmailTo: process.env.ORDER_EMAIL_TO ?? "",
  notifyChannels: (process.env.NOTIFY_CHANNELS ?? "telegram,email")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "product-images",
  retentionDays: Number(process.env.DATA_RETENTION_DAYS ?? 90),
  cronSecret: process.env.CRON_SECRET ?? "",
};

if (
  env.isProd &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  env.secret === "dev-only-secret-change-me"
) {
  console.warn("[security] APP_SECRET is not set. Set a long random value in production.");
}
