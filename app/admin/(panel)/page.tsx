import { desc, eq, gte, sql } from "drizzle-orm";
import Link from "next/link";
import {
  Card,
  Flash,
  PageHeader,
  SubmitButton,
  StatusBadge,
  sp,
  type SearchParams,
} from "@/components/admin/ui";
import { db } from "@/db";
import { contactMessages, notificationLog, orders, products } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { yerevanParts, yerevanToUtc } from "@/lib/time";
import { runRetentionAction } from "../actions";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const q = await searchParams;
  const startOfDay = yerevanToUtc(yerevanParts(new Date()).dateKey, 0);
  const count = sql<number>`count(*)::int`;
  const [[newOrders], [today], [sample], [unread], latest, notes] = await Promise.all([
    db.select({ n: count }).from(orders).where(eq(orders.status, "new")),
    db
      .select({ n: count, sum: sql<number>`coalesce(sum(total_amd),0)::int` })
      .from(orders)
      .where(gte(orders.createdAt, startOfDay)),
    db.select({ n: count }).from(products).where(eq(products.priceIsSample, true)),
    db.select({ n: count }).from(contactMessages).where(eq(contactMessages.isHandled, false)),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8),
    db.select().from(notificationLog).orderBy(desc(notificationLog.id)).limit(6),
  ]);
  const stats = [
    { label: "New orders waiting", value: newOrders?.n ?? 0, href: "/admin/orders?status=new" },
    { label: "Orders today", value: today?.n ?? 0, href: "/admin/orders" },
    {
      label: "Sales today, ֏",
      value: (today?.sum ?? 0).toLocaleString("ru-RU"),
      href: "/admin/orders",
    },
    { label: "Unconfirmed sample prices", value: sample?.n ?? 0, href: "/admin/products?sample=1" },
    { label: "Unread messages", value: unread?.n ?? 0, href: "/admin/messages" },
  ];
  return (
    <>
      <PageHeader title={`Hello, ${user.name}`} />
      <Flash
        ok={sp(q.ok)}
        error={sp(q.error) ?? (sp(q.denied) ? "Your role cannot open that page." : undefined)}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl bg-white p-4 shadow-card hover:shadow-lift"
          >
            <p className="font-display text-3xl">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <h2 className="mb-3 text-xl">Latest orders</h2>
          <ul className="divide-y divide-line">
            {latest.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-magenta-ink"
                >
                  <span className="font-semibold">#{o.shortCode}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {o.customerName} · {o.fulfilment} · {o.slotLabel}
                  </span>
                  <span className="tabular-nums">{o.totalAmd.toLocaleString("ru-RU")} ֏</span>
                  <StatusBadge status={o.status} />
                </Link>
              </li>
            ))}
            {latest.length === 0 ? (
              <li className="py-4 text-sm text-muted">No orders yet.</li>
            ) : null}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 text-xl">Notifications sent</h2>
          <ul className="space-y-2 text-sm">
            {notes.map((n) => (
              <li key={n.id} className="flex justify-between gap-3">
                <span className="truncate">{n.subject}</span>
                <span className={n.ok ? "text-[#14532d]" : "text-magenta-ink"}>
                  {n.channel} {n.ok ? "✓" : "✗"}
                </span>
              </li>
            ))}
            {notes.length === 0 ? <li className="text-muted">Nothing sent yet.</li> : null}
          </ul>
          {user.role === "admin" ? (
            <form action={runRetentionAction} className="mt-6 border-t border-line pt-4">
              <p className="mb-2 text-sm text-muted">
                Privacy clean-up runs every night. It removes names, phones and addresses from old
                orders.
              </p>
              <SubmitButton variant="secondary">Run privacy clean-up now</SubmitButton>
            </form>
          ) : null}
        </Card>
      </div>
    </>
  );
}
