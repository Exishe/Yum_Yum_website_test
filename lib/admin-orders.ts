import "server-only";
import { and, eq, gte, ilike, lt, or, type SQL } from "drizzle-orm";
import { orders, orderStatus } from "@/db/schema";
import { addDays, yerevanToUtc } from "./time";

const sp = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Builds the WHERE clause for the order list and the CSV export from query params. */
export function orderFilters(q: Record<string, string | string[] | undefined>) {
  const where: SQL[] = [];
  const status = sp(q.status);
  if (status && (orderStatus.enumValues as readonly string[]).includes(status))
    where.push(eq(orders.status, status as never));
  const from = sp(q.from);
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from))
    where.push(gte(orders.scheduledFor, yerevanToUtc(from, 0)));
  const to = sp(q.to);
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to))
    where.push(lt(orders.scheduledFor, yerevanToUtc(addDays(to, 1), 0)));
  const search = sp(q.q)?.trim().slice(0, 60);
  if (search) {
    const like = `%${search.replace(/[%_]/g, "")}%`;
    where.push(
      or(
        ilike(orders.customerName, like),
        ilike(orders.phone, like),
        ilike(orders.shortCode, like),
      )!,
    );
  }
  const shop = Number(sp(q.shop));
  if (shop) where.push(eq(orders.shopId, shop));
  return where.length ? and(...where) : undefined;
}
