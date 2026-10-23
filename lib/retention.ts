import "server-only";
import { and, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
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
  await db.execute(sql`DELETE FROM contact_messages WHERE created_at < ${cutoff}`);
  await db.execute(sql`DELETE FROM rate_limits WHERE reset_at < now()`);
  return rows.length;
}
