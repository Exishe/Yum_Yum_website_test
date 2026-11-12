import "server-only";
import { and, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages, orders } from "@/db/schema";
import { env } from "./env";

/** Removes names, phones and addresses from orders older than the retention period. */
export async function anonymizeOldOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - env.retentionDays * 86400_000);
  const rows = await db
    .update(orders)
    .set({
      customerName: "—",
      phone: "—",
      address: null,
      comment: null,
      staffNote: null,
      ipHash: null,
      anonymizedAt: new Date(),
    })
    .where(and(lt(orders.createdAt, cutoff), isNull(orders.anonymizedAt)))
    .returning({ id: orders.id });
  // Typed query: the column converts the date itself. A raw sql`` parameter sent a JS Date,
  // which the Neon driver rejects ("must be of type string"), so the purge crashed on Vercel.
  await db.delete(contactMessages).where(lt(contactMessages.createdAt, cutoff));
  await db.execute(sql`DELETE FROM rate_limits WHERE reset_at < now()`);
  return rows.length;
}
