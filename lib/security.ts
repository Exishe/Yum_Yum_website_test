import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { env } from "./env";

export async function clientIp(): Promise<string> {
  const h = await headers();
  // Vercel sets x-forwarded-for; the first entry is the client.
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || h.get("x-real-ip") || "0.0.0.0";
}

/** One-way hash so abuse checks work without storing raw IP addresses. */
export function hashValue(value: string): string {
  return createHmac("sha256", env.secret).update(value).digest("hex").slice(0, 32);
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Fixed-window rate limiter stored in Postgres. Returns true while the caller
 * is under the limit. One atomic upsert per call, no extra service needed.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const id = hashValue(key);
  const rows = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, count, reset_at)
    VALUES (${id}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.reset_at < now() THEN 1 ELSE rate_limits.count + 1 END,
      reset_at = CASE WHEN rate_limits.reset_at < now()
        THEN now() + make_interval(secs => ${windowSeconds}) ELSE rate_limits.reset_at END
    RETURNING count
  `);
  const count = Number(rows[0]?.count ?? 0);
  return count <= limit;
}

/** Verifies a Cloudflare Turnstile token. Skipped when no secret is configured (local dev). */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  if (!env.turnstileSecret) return !env.isProd || process.env.ALLOW_NO_TURNSTILE === "1";
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: env.turnstileSecret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
