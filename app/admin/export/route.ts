import { desc, inArray } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { orderItems, orders, shops } from "@/db/schema";
import { orderFilters } from "@/lib/admin-orders";
import { audit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

/** CSV export of the filtered order list. Staff only. */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/admin/login", req.url));
  const q = Object.fromEntries(req.nextUrl.searchParams.entries());
  const rows = await db.select().from(orders).where(orderFilters(q)).orderBy(desc(orders.createdAt)).limit(5000);
  const items = rows.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, rows.map((r) => r.id))) : [];
  const shopList = await db.select({ id: shops.id, name: shops.name }).from(shops);
  const shopName = new Map(shopList.map((s) => [s.id, s.name.en]));
  const byOrder = new Map<string, string[]>();
  for (const i of items) byOrder.set(i.orderId, [...(byOrder.get(i.orderId) ?? []), `${i.quantity}x ${i.name}`]);

  // Neutralise spreadsheet formulas (CSV injection) and quote every cell.
  const cell = (v: unknown) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Yerevan", dateStyle: "short", timeStyle: "short" });
  const header = ["code", "status", "placed", "for", "slot", "type", "shop/district", "name", "phone", "items", "subtotal", "delivery", "total", "payment", "comment"];
  const lines = rows.map((o) =>
    [
      o.shortCode,
      o.status,
      fmt.format(o.createdAt),
      fmt.format(o.scheduledFor),
      o.slotLabel,
      o.fulfilment,
      o.fulfilment === "pickup" ? shopName.get(o.shopId ?? 0) : o.district,
      o.customerName,
      o.phone,
      (byOrder.get(o.id) ?? []).join("; "),
      o.subtotalAmd,
      o.deliveryFeeAmd,
      o.totalAmd,
      o.paymentMethod,
      o.comment,
    ]
      .map(cell)
      .join(","),
  );
  await audit(user, "export", "orders", null, { count: rows.length });
  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="yumyum-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
