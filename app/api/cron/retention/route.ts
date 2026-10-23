import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { anonymizeOldOrders } from "@/lib/retention";
import { safeEqual } from "@/lib/security";

/** Daily privacy clean-up, called by Vercel Cron with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!env.cronSecret || !safeEqual(auth, `Bearer ${env.cronSecret}`)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const anonymized = await anonymizeOldOrders();
  return NextResponse.json({ anonymized });
}
