import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Flash, PageHeader, StatusBadge, SubmitButton, inputCls, sp, statusLabel, type SearchParams } from "@/components/admin/ui";
import { db } from "@/db";
import { orderItems, orders, orderStatus, orderStatusHistory, shops, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { districts } from "@/lib/districts";
import { formatPhone } from "@/lib/format";
import { PrintButton } from "./PrintButton";
import { updateOrderNoteAction, updateOrderStatusAction } from "../../../actions";

export const metadata = { title: "Order" };

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  await requireUser();
  const { id } = await params;
  const q = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) notFound();
  const [items, history, shop] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(asc(orderItems.id)),
    db
      .select({ h: orderStatusHistory, by: users.name })
      .from(orderStatusHistory)
      .leftJoin(users, eq(users.id, orderStatusHistory.userId))
      .where(eq(orderStatusHistory.orderId, id))
      .orderBy(asc(orderStatusHistory.createdAt)),
    order.shopId ? db.select().from(shops).where(eq(shops.id, order.shopId)).then((r) => r[0]) : null,
  ]);
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Yerevan", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const district = districts.find((d) => d.key === order.district);
  const a = order.address;

  return (
    <>
      <PageHeader title={`Order #${order.shortCode}`}>
        <StatusBadge status={order.status} />
        <PrintButton />
        <Link href={`/${order.locale}/order/${order.publicId}`} target="_blank" className="inline-flex h-11 items-center rounded-full border-2 border-plum/15 bg-white px-5 text-sm font-semibold">
          Customer view ↗
        </Link>
      </PageHeader>
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-5">
          <Card>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Customer</dt>
                <dd className="text-lg font-semibold">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-muted">Phone</dt>
                <dd className="text-lg font-semibold">
                  {order.phone.startsWith("+") ? <a href={`tel:${order.phone}`}>{formatPhone(order.phone)}</a> : order.phone}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{order.fulfilment === "pickup" ? "Pickup at" : "Deliver to"}</dt>
                <dd className="font-semibold">
                  {order.fulfilment === "pickup"
                    ? shop?.name.en ?? "—"
                    : a
                      ? `${a.street} ${a.building}${a.entrance ? `, entrance ${a.entrance}` : ""}${a.floor ? `, floor ${a.floor}` : ""}${a.apartment ? `, apt ${a.apartment}` : ""} · ${district?.name.en ?? order.district}`
                      : "— (anonymised)"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">When</dt>
                <dd className="font-semibold">
                  {fmt.format(order.scheduledFor).split(",").slice(0, 1)} · {order.slotLabel}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Payment</dt>
                <dd className="font-semibold">{order.paymentMethod === "cash" ? "Cash" : "Card on delivery / pickup"}</dd>
              </div>
              <div>
                <dt className="text-muted">Placed</dt>
                <dd>
                  {fmt.format(order.createdAt)} · site language {order.locale.toUpperCase()}
                </dd>
              </div>
              {order.comment ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted">Customer comment</dt>
                  <dd className="rounded-xl bg-sun-soft p-3">{order.comment}</dd>
                </div>
              ) : null}
            </dl>
          </Card>
          <Card>
            <h2 className="mb-2 text-xl">Items</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-line">
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2 pr-3 align-top font-semibold whitespace-nowrap">{i.quantity} ×</td>
                    <td className="py-2">
                      {i.name}
                      {i.details?.options?.length ? <span className="block text-muted">{i.details.options.map((o) => o.name).join(", ")}</span> : null}
                      {i.details?.messages?.length ? (
                        <span className="block font-semibold text-magenta-ink">Write: «{i.details.messages.join(" / ")}»</span>
                      ) : null}
                      {i.details?.contents?.length ? (
                        <span className="block text-muted">Box: {i.details.contents.map((c) => c.name).join(", ")}</span>
                      ) : null}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap tabular-nums">{i.lineTotalAmd.toLocaleString("ru-RU")} ֏</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{order.subtotalAmd.toLocaleString("ru-RU")} ֏</dd>
              </div>
              {order.fulfilment === "delivery" ? (
                <div className="flex justify-between">
                  <dt>Delivery</dt>
                  <dd>{order.deliveryFeeAmd.toLocaleString("ru-RU")} ֏</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-lg font-bold">
                <dt>Total</dt>
                <dd>{order.totalAmd.toLocaleString("ru-RU")} ֏</dd>
              </div>
            </dl>
          </Card>
        </div>
        <div className="flex flex-col gap-5 print:hidden">
          <Card>
            <h2 className="mb-3 text-xl">Change status</h2>
            <form action={updateOrderStatusAction} className="flex flex-col gap-3">
              <input type="hidden" name="orderId" value={order.id} />
              <div className="flex flex-wrap gap-2">
                {orderStatus.enumValues
                  .filter((s) => !(order.fulfilment === "pickup" && s === "on_the_way") && !(order.fulfilment === "delivery" && s === "ready_for_pickup"))
                  .map((s) => (
                    <label key={s} className="has-checked:ring-plum flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-line px-3 text-sm has-checked:border-plum">
                      <input type="radio" name="status" value={s} defaultChecked={s === order.status} className="accent-magenta" />
                      {statusLabel[s]}
                    </label>
                  ))}
              </div>
              <input name="note" placeholder="Note for the history (optional)" className={inputCls} maxLength={300} />
              <SubmitButton>Update status</SubmitButton>
            </form>
            <ol className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              {history.map(({ h, by }) => (
                <li key={h.id} className="flex flex-wrap justify-between gap-2">
                  <span>
                    <StatusBadge status={h.toStatus} /> {h.note ? <span className="text-muted">· {h.note}</span> : null}
                  </span>
                  <span className="text-muted">
                    {fmt.format(h.createdAt)} · {by ?? "website"}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
          <Card>
            <h2 className="mb-3 text-xl">Staff note</h2>
            <form action={updateOrderNoteAction} className="flex flex-col gap-3">
              <input type="hidden" name="orderId" value={order.id} />
              <textarea name="staffNote" defaultValue={order.staffNote ?? ""} rows={3} maxLength={1000} className={`${inputCls} h-auto py-2`} />
              <SubmitButton>Save note</SubmitButton>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
