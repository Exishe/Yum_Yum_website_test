import { Check, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AutoRefresh } from "@/components/AutoRefresh";
import { DonutIcon } from "@/components/icons/brand";
import type { OrderStatus } from "@/db/schema";
import type { Locale } from "@/i18n/routing";
import { getShops } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatAmd, formatDate, formatPhone } from "@/lib/format";
import { t as pick } from "@/lib/localized";
import { getPublicOrder } from "@/lib/order-view";
import { getSettings } from "@/lib/settings";
import { robotsFor } from "@/lib/demo-config";

type Props = {
  params: Promise<{ locale: string; publicId: string }>;
  searchParams: Promise<{ new?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("orderTitle"), robots: robotsFor({ index: false, follow: false }) };
}

export default async function OrderPage({ params, searchParams }: Props) {
  const { locale, publicId } = (await params) as { locale: Locale; publicId: string };
  setRequestLocale(locale);
  const { new: isNew } = await searchParams;
  const t = await getTranslations("order");
  const [data, shops, settings] = await Promise.all([
    getPublicOrder(publicId),
    getShops(),
    getSettings(),
  ]);
  const phone = settings.contact.phones[0] ?? "+37433301574";

  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <DonutIcon size={88} className="mx-auto" />
        <p className="mt-6 text-xl">{t("notFound")}</p>
        <a
          href={`tel:${phone}`}
          className="mt-6 inline-flex h-12 items-center rounded-full bg-plum px-6 font-semibold text-white"
        >
          {formatPhone(phone)}
        </a>
      </div>
    );
  }

  const { order, items } = data;
  const shop = shops.find((s) => s.id === order.shopId);
  const steps: OrderStatus[] =
    order.fulfilment === "pickup"
      ? ["new", "confirmed", "preparing", "ready_for_pickup", "done"]
      : ["new", "confirmed", "preparing", "on_the_way", "done"];
  const currentIndex = steps.indexOf(order.status);
  const finished = order.status === "done" || order.status === "cancelled";
  const code = `#${order.shortCode}`;
  const method = t(`methods.${order.paymentMethod}`);

  const waText = [
    t("whatsappText", { code }),
    ...items.map((i) => `${i.quantity} × ${i.name}`),
    `${formatAmd(order.totalAmd, locale)}`,
  ].join("\n");
  const wa = settings.contact.whatsapp
    ? `https://wa.me/${settings.contact.whatsapp}?text=${encodeURIComponent(waText)}`
    : null;

  return (
    <div className="dot-grid">
      {!finished ? <AutoRefresh /> : null}
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {isNew ? (
          <p className="font-hand text-3xl text-magenta-ink">
            {t("thanks", { name: order.anonymizedAt ? "" : order.customerName })}
          </p>
        ) : null}
        <h1 className="text-[clamp(1.91rem,4.28vw,2.69rem)] leading-none">
          {t("number", { code })}
        </h1>
        {isNew ? <p className="mt-3">{t("received")}</p> : null}
        <p className="mt-1 text-sm text-muted">{t("track")}</p>

        <section
          aria-labelledby="status-title"
          className="mt-8 rounded-[var(--radius-xl2)] bg-white p-5 shadow-card sm:p-7"
        >
          <h2
            id="status-title"
            className="font-sans text-sm font-bold tracking-[0.18em] text-magenta-ink uppercase"
          >
            {t("status")}
          </h2>
          {order.status === "cancelled" ? (
            <p className="mt-3 font-display text-3xl">{t("statuses.cancelled")}</p>
          ) : (
            <ol className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-2">
              {steps.map((s, i) => {
                const done = i <= currentIndex;
                return (
                  <li
                    key={s}
                    aria-current={i === currentIndex ? "step" : undefined}
                    className={cn(
                      "flex flex-1 items-center gap-3 sm:flex-col sm:items-start",
                      !done && "text-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full border-2",
                        i === currentIndex
                          ? "border-magenta bg-magenta text-white"
                          : done
                            ? "border-plum bg-plum text-white"
                            : "border-line",
                      )}
                    >
                      {done ? <Check size={16} weight="bold" aria-hidden /> : i + 1}
                    </span>
                    <span className={cn("text-sm", i === currentIndex && "font-bold text-plum")}>
                      {t(`statuses.${s}`)}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="mt-5 rounded-[var(--radius-xl2)] bg-white p-5 shadow-card sm:p-7">
          <p className="font-semibold">
            {order.fulfilment === "pickup"
              ? t("pickupAt", {
                  shop: shop ? `${pick(shop.name, locale)} (${pick(shop.address, locale)})` : "—",
                })
              : t("deliveryTo", {
                  address: order.address
                    ? `${order.address.street} ${order.address.building}`
                    : "—",
                })}
          </p>
          <p className="text-muted">
            {t("when", {
              date: formatDate(order.scheduledFor, locale, { weekday: "long" }),
              slot: order.slotLabel,
            })}
          </p>
          <p className="text-muted">
            {order.fulfilment === "pickup"
              ? t("payOnPickup", { method })
              : t("payOnDelivery", { method })}
          </p>
          <h2 className="mt-6 font-sans text-sm font-bold tracking-[0.18em] text-magenta-ink uppercase">
            {t("items")}
          </h2>
          <ul className="mt-2 divide-y divide-line">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-2 text-sm">
                <span>
                  {i.quantity} × {i.name}
                  {i.details?.options?.length ? (
                    <span className="text-muted">
                      {" "}
                      · {i.details.options.map((o) => o.name).join(", ")}
                    </span>
                  ) : null}
                  {i.details?.messages?.length ? (
                    <span className="text-muted"> · «{i.details.messages.join(" / ")}»</span>
                  ) : null}
                  {i.details?.contents?.length ? (
                    <span className="block text-muted">
                      {i.details.contents.map((c) => c.name).join(", ")}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 tabular-nums">{formatAmd(i.lineTotalAmd, locale)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between border-t border-line pt-3 text-lg font-bold">
            <span>Σ</span>
            <span className="font-display text-2xl tabular-nums">
              {formatAmd(order.totalAmd, locale)}
            </span>
          </p>
        </section>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1f8f4e] px-6 font-semibold whitespace-nowrap text-white"
            >
              <WhatsappLogo size={20} aria-hidden /> {t("whatsapp")}
            </a>
          ) : null}
          <a
            href={`tel:${phone}`}
            className="inline-flex h-12 items-center justify-center rounded-full border-2 border-plum px-6 font-semibold whitespace-nowrap"
          >
            {t("call", { phone: formatPhone(phone) })}
          </a>
        </div>
      </div>
    </div>
  );
}
