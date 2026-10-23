import { desc } from "drizzle-orm";
import Link from "next/link";
import {
  Card,
  Flash,
  PageHeader,
  StatusBadge,
  btn,
  inputCls,
  sp,
  statusLabel,
  type SearchParams,
} from "@/components/admin/ui";
import { db } from "@/db";
import { orders, orderStatus, shops } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatPhone } from "@/lib/format";
import { orderFilters } from "@/lib/admin-orders";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const q = await searchParams;
  const [rows, shopList] = await Promise.all([
    db.select().from(orders).where(orderFilters(q)).orderBy(desc(orders.createdAt)).limit(200),
    db.select({ id: shops.id, name: shops.name }).from(shops),
  ]);
  const shopName = new Map(shopList.map((s) => [s.id, s.name.en]));
  const qs = new URLSearchParams(
    Object.entries(q).flatMap(([k, v]) => (typeof v === "string" && v ? [[k, v]] : [])),
  ).toString();
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Yerevan",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <PageHeader title="Orders">
        <a href={`/admin/export?${qs}`} className={btn.ghost}>
          Export CSV
        </a>
      </PageHeader>
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <Card className="mb-5">
        <form className="grid grid-cols-2 gap-3 md:grid-cols-6 md:items-end" method="get">
          <label className="col-span-2 text-sm font-semibold">
            Search
            <input
              name="q"
              defaultValue={sp(q.q)}
              placeholder="Name, phone or #code"
              className={inputCls}
            />
          </label>
          <label className="text-sm font-semibold">
            Status
            <select name="status" defaultValue={sp(q.status) ?? ""} className={inputCls}>
              <option value="">All</option>
              {orderStatus.enumValues.map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            For date from
            <input type="date" name="from" defaultValue={sp(q.from)} className={inputCls} />
          </label>
          <label className="text-sm font-semibold">
            to
            <input type="date" name="to" defaultValue={sp(q.to)} className={inputCls} />
          </label>
          <button className={btn.primary}>Filter</button>
        </form>
      </Card>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-blush text-left">
            <tr>
              {["#", "Placed", "For", "Customer", "Where", "Total", "Status"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-blush/60">
                <td className="px-4 py-3 font-semibold">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="underline-offset-2 hover:underline"
                  >
                    #{o.shortCode}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{fmt.format(o.createdAt)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {fmt.format(o.scheduledFor).split(",")[0]} · {o.slotLabel}
                </td>
                <td className="px-4 py-3">
                  {o.customerName}
                  <span className="block text-xs text-muted">
                    {o.phone.startsWith("+") ? formatPhone(o.phone) : o.phone}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {o.fulfilment === "pickup"
                    ? `Pickup · ${shopName.get(o.shopId ?? 0) ?? "?"}`
                    : `Delivery · ${o.district}`}
                </td>
                <td className="px-4 py-3 tabular-nums">{o.totalAmd.toLocaleString("ru-RU")} ֏</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No orders match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </>
  );
}
