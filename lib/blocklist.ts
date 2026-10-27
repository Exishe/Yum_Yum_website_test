import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { blockedPhones, orders } from "@/db/schema";

/** True when this (normalised) number may not order online. */
export async function isPhoneBlocked(phone: string): Promise<boolean> {
  const rows = await db
    .select({ phone: blockedPhones.phone })
    .from(blockedPhones)
    .where(eq(blockedPhones.phone, phone))
    .limit(1);
  return rows.length > 0;
}

export type CustomerHistory = { total: number; done: number; cancelled: number };

/** Earlier orders from the same number, so staff can tell a regular from a stranger. */
export async function customerHistory(phone: string, exceptOrderId?: string) {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      done: sql<number>`count(*) filter (where ${orders.status} = 'done')::int`,
      cancelled: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')::int`,
    })
    .from(orders)
    .where(
      exceptOrderId
        ? and(eq(orders.phone, phone), ne(orders.id, exceptOrderId))
        : eq(orders.phone, phone),
    );
  return (row ?? { total: 0, done: 0, cancelled: 0 }) as CustomerHistory;
}
