import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, orderStatusHistory } from "@/db/schema";

/** What the customer may see about their own order, looked up by the random public ID. */
export async function getPublicOrder(publicId: string) {
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(publicId)) return null;
  const order = await db.query.orders.findFirst({ where: eq(orders.publicId, publicId) });
  if (!order) return null;
  const [items, history] = await Promise.all([
    db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .orderBy(asc(orderItems.id)),
    db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(asc(orderStatusHistory.createdAt)),
  ]);
  return { order, items, history };
}
