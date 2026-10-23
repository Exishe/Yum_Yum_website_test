import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { isLocale } from "@/i18n/routing";
import { sha256 } from "@/lib/security";

/** Confirms (double opt-in) or cancels a newsletter subscription from the emailed link. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const token = url.searchParams.get("token") ?? "";
  const action = url.searchParams.get("action");
  const localeParam = url.searchParams.get("locale");
  const locale = isLocale(localeParam) ? localeParam : "hy";
  let status: "confirmed" | "invalid" | "unsubscribed" = "invalid";

  if (token.length >= 20 && token.length <= 64) {
    const where = eq(newsletterSubscribers.tokenHash, sha256(token));
    if (action === "confirm") {
      const rows = await db
        .update(newsletterSubscribers)
        .set({ status: "confirmed", confirmedAt: new Date() })
        .where(and(where, eq(newsletterSubscribers.status, "pending")))
        .returning({ id: newsletterSubscribers.id });
      if (rows.length) status = "confirmed";
    } else if (action === "unsubscribe") {
      const rows = await db
        .update(newsletterSubscribers)
        .set({ status: "unsubscribed" })
        .where(where)
        .returning({ id: newsletterSubscribers.id });
      if (rows.length) status = "unsubscribed";
    }
  }
  return NextResponse.redirect(new URL(`/${locale}/newsletter?status=${status}`, url.origin), 303);
}
