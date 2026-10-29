import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  Flash,
  PageHeader,
  StatusBadge,
  SubmitButton,
  inputCls,
  sp,
  statusLabel,
  type SearchParams,
} from "@/components/admin/ui";
import { db } from "@/db";
import {
  blockedPhones,
  orderItems,
  orders,
  orderStatus,
  orderStatusHistory,
  shops,
  users,
} from "@/db/schema";
import { adminLocale } from "@/lib/admin-i18n";
import { adminT } from "@/lib/admin-lang";
import { requireUser } from "@/lib/auth";
import { customerHistory } from "@/lib/blocklist";
import { districts } from "@/lib/districts";
import { formatPhone } from "@/lib/format";
import { PrintButton } from "./PrintButton";
import {
  blockPhoneAction,
  callOutcomeAction,
  unblockPhoneAction,
  updateOrderNoteAction,
  updateOrderStatusAction,
} from "../../../actions";

export async function generateMetadata() {
  return { title: (await adminT())("Order") };
}

export default async function OrderDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  await requireUser();
  const { id } = await params;
  const q = await searchParams;
  const t = await adminT();
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) notFound();
  const [items, history, shop, past, [blocked]] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(asc(orderItems.id)),
    db
      .select({ h: orderStatusHistory, by: users.name })
      .from(orderStatusHistory)
      .leftJoin(users, eq(users.id, orderStatusHistory.userId))
      .where(eq(orderStatusHistory.orderId, id))
      .orderBy(asc(orderStatusHistory.createdAt)),
    order.shopId
      ? db
          .select()
          .from(shops)
          .where(eq(shops.id, order.shopId))
          .then((r) => r[0])
      : null,
    customerHistory(order.phone, order.id),
    db.select().from(blockedPhones).where(eq(blockedPhones.phone, order.phone)).limit(1),
  ]);
  const fmt = new Intl.DateTimeFormat(adminLocale(t.lang), {
    timeZone: "Asia/Yerevan",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const district = districts.find((d) => d.key === order.district);
  const a = order.address;

  return (
    <>
      <PageHeader title={t("Order #{code}", { code: order.shortCode })}>
        <StatusBadge status={order.status} />
        <PrintButton />
        <Link
          href={`/${order.locale}/order/${order.publicId}`}
          target="_blank"
          className="inline-flex h-11 items-center rounded-full border-2 border-plum/15 bg-white px-5 text-sm font-semibold"
        >
          {t("Customer view ↗")}
        </Link>
      </PageHeader>
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-5">
          <Card>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">{t("Customer")}</dt>
                <dd className="text-lg font-semibold">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-muted">{t("Phone")}</dt>
                <dd className="text-lg font-semibold">
                  {order.phone.startsWith("+") ? (
                    <a href={`tel:${order.phone}`}>{formatPhone(order.phone)}</a>
                  ) : (
                    order.phone
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted">
                  {order.fulfilment === "pickup" ? t("Pickup at") : t("Deliver to")}
                </dt>
                <dd className="font-semibold">
                  {order.fulfilment === "pickup"
                    ? ((shop?.name[t.lang] || shop?.name.en) ?? "—")
                    : a
                      ? `${a.street} ${a.building}${a.entrance ? `, ${t("entrance")} ${a.entrance}` : ""}${a.floor ? `, ${t("floor")} ${a.floor}` : ""}${a.apartment ? `, ${t("apt")} ${a.apartment}` : ""} · ${(district?.name[t.lang] || district?.name.en) ?? order.district}`
                      : t("— (anonymised)")}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{t("When")}</dt>
                <dd className="font-semibold">
                  {fmt.format(order.scheduledFor).split(",").slice(0, 1)} · {order.slotLabel}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{t("Payment")}</dt>
                <dd className="font-semibold">
                  {order.paymentMethod === "cash" ? t("Cash") : t("Card on delivery / pickup")}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{t("Placed")}</dt>
                <dd>
                  {fmt.format(order.createdAt)} · {t("site language")} {order.locale.toUpperCase()}
                </dd>
              </div>
              {order.comment ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted">{t("Customer comment")}</dt>
                  <dd className="rounded-xl bg-sun-soft p-3">{order.comment}</dd>
                </div>
              ) : null}
            </dl>
          </Card>
          <Card>
            <h2 className="mb-2 text-xl">{t("Items")}</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-line">
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2 pr-3 align-top font-semibold whitespace-nowrap">
                      {i.quantity} ×
                    </td>
                    <td className="py-2">
                      {i.name}
                      {i.details?.options?.length ? (
                        <span className="block text-muted">
                          {i.details.options.map((o) => o.name).join(", ")}
                        </span>
                      ) : null}
                      {i.details?.messages?.length ? (
                        <span className="block font-semibold text-magenta-ink">
                          {t("Write")}: «{i.details.messages.join(" / ")}»
                        </span>
                      ) : null}
                      {i.details?.contents?.length ? (
                        <span className="block text-muted">
                          {t("Box")}: {i.details.contents.map((c) => c.name).join(", ")}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap tabular-nums">
                      {i.lineTotalAmd.toLocaleString("ru-RU")} ֏
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt>{t("Subtotal")}</dt>
                <dd>{order.subtotalAmd.toLocaleString("ru-RU")} ֏</dd>
              </div>
              {order.fulfilment === "delivery" ? (
                <div className="flex justify-between">
                  <dt>{t("Delivery")}</dt>
                  <dd>{order.deliveryFeeAmd.toLocaleString("ru-RU")} ֏</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-lg font-bold">
                <dt>{t("Total")}</dt>
                <dd>{order.totalAmd.toLocaleString("ru-RU")} ֏</dd>
              </div>
            </dl>
          </Card>
        </div>
        <div className="flex flex-col gap-5 print:hidden">
          {order.status === "new" ? (
            <Card className="border-2 border-magenta">
              <h2 className="text-xl">{t("Call the customer before preparing")}</h2>
              <p className="mt-1 text-sm text-muted">
                {t("Cash on delivery means anyone can place an order. Confirm it by phone first.")}
              </p>
              <a
                href={`tel:${order.phone}`}
                className="mt-4 inline-flex h-12 items-center rounded-full bg-plum px-6 text-lg font-semibold text-white"
              >
                {t("Call {phone}", { phone: formatPhone(order.phone) })}
              </a>
              <p className="mt-3 text-sm">
                {past.total === 0 ? (
                  <strong>{t("First order from this number.")}</strong>
                ) : (
                  <>
                    {t("Earlier orders from this number:")} <strong>{past.total}</strong> (
                    {t("{done} done, {cancelled} cancelled", {
                      done: past.done,
                      cancelled: past.cancelled,
                    })}
                    ).
                  </>
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={callOutcomeAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="outcome" value="confirmed" />
                  <SubmitButton>{t("Confirmed by phone")}</SubmitButton>
                </form>
                <form action={callOutcomeAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="outcome" value="no_answer" />
                  <SubmitButton variant="secondary">{t("No answer")}</SubmitButton>
                </form>
              </div>
              <form
                action={callOutcomeAction}
                className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4"
              >
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="outcome" value="fake" />
                <SubmitButton variant="danger" confirm={t("Cancel this order as fake?")}>
                  {t("Fake order: cancel")}
                </SubmitButton>
                <span className="text-xs text-muted">
                  {t("The number is not blocked. To block it, use “Number” below.")}
                </span>
              </form>
            </Card>
          ) : null}
          <Card>
            <h2 className="mb-3 text-xl">{t("Change status")}</h2>
            <form action={updateOrderStatusAction} className="flex flex-col gap-3">
              <input type="hidden" name="orderId" value={order.id} />
              <div className="flex flex-wrap gap-2">
                {orderStatus.enumValues
                  .filter(
                    (s) =>
                      !(order.fulfilment === "pickup" && s === "on_the_way") &&
                      !(order.fulfilment === "delivery" && s === "ready_for_pickup"),
                  )
                  .map((s) => (
                    <label
                      key={s}
                      className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-line px-3 text-sm has-checked:border-plum has-checked:ring-plum"
                    >
                      <input
                        type="radio"
                        name="status"
                        value={s}
                        defaultChecked={s === order.status}
                        className="accent-magenta"
                      />
                      {t(statusLabel[s] ?? s)}
                    </label>
                  ))}
              </div>
              <input
                name="note"
                placeholder={t("Note for the history (optional)")}
                className={inputCls}
                maxLength={300}
              />
              <SubmitButton>{t("Update status")}</SubmitButton>
            </form>
            <ol className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              {history.map(({ h, by }) => (
                <li key={h.id} className="flex flex-wrap justify-between gap-2">
                  <span>
                    <StatusBadge status={h.toStatus} />{" "}
                    {h.note ? <span className="text-muted">· {h.note}</span> : null}
                  </span>
                  <span className="text-muted">
                    {fmt.format(h.createdAt)} · {by ?? t("website")}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
          <Card>
            <h2 className="mb-3 text-xl">{t("Number")}</h2>
            {blocked ? (
              <form action={unblockPhoneAction} className="flex flex-col gap-3">
                <input type="hidden" name="phone" value={order.phone} />
                <input type="hidden" name="returnTo" value={`/admin/orders/${order.id}`} />
                <p className="text-sm">
                  <strong className="text-magenta-ink">{t("Blocked")}</strong>{" "}
                  {t("since {date}", { date: fmt.format(blocked.createdAt) })}
                  {blocked.reason ? ` · ${blocked.reason}` : ""}.{" "}
                  {t("This number cannot order online.")}
                </p>
                <SubmitButton variant="secondary">{t("Unblock")}</SubmitButton>
              </form>
            ) : (
              <form action={blockPhoneAction} className="flex flex-col gap-3">
                <input type="hidden" name="phone" value={order.phone} />
                <input type="hidden" name="returnTo" value={`/admin/orders/${order.id}`} />
                <input
                  name="reason"
                  placeholder={t("Reason (optional), e.g. prank order")}
                  className={inputCls}
                  maxLength={200}
                />
                <SubmitButton
                  variant="secondary"
                  confirm={t("Block this number? It will no longer be able to order online.")}
                >
                  {t("Block this number")}
                </SubmitButton>
              </form>
            )}
          </Card>
          <Card>
            <h2 className="mb-3 text-xl">{t("Staff note")}</h2>
            <form action={updateOrderNoteAction} className="flex flex-col gap-3">
              <input type="hidden" name="orderId" value={order.id} />
              <textarea
                name="staffNote"
                defaultValue={order.staffNote ?? ""}
                rows={3}
                maxLength={1000}
                className={`${inputCls} h-auto py-2`}
              />
              <SubmitButton>{t("Save note")}</SubmitButton>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
