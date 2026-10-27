"use client";

import { ArrowUpRight, Phone } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/routing";
import { cart } from "@/lib/cart-store";
import type { PublicShop } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatPhone } from "@/lib/format";
import type { ImageInfo } from "@/lib/images";
import { t as pick } from "@/lib/localized";
import { shopStatus, type ShopStatus } from "@/lib/time";
import { DemoNote } from "@/components/AskPrice";

export type PickerShop = PublicShop & { img: ImageInfo | null };

function hoursText(s: PublicShop, mall: string) {
  if (!s.hours) return mall;
  // Weekday hours; the live status line covers exceptions such as a later Sunday opening.
  const weekday = s.hours[1];
  return weekday ? `${weekday.open}–${weekday.close}` : "—";
}

export function useShopStatus(shop: PublicShop | undefined) {
  const [status, setStatus] = useState<ShopStatus | null>(null);
  useEffect(() => {
    if (!shop) return;
    const update = () => setStatus(shopStatus(shop.hours));
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [shop]);
  return status;
}

export function StatusLabel({
  status,
  className,
}: {
  status: ShopStatus | null;
  className?: string;
}) {
  const t = useTranslations("shops");
  if (!status || status.state === "unknown") return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        aria-hidden
        className={cn("size-2 rounded-full", status.state === "open" ? "bg-mint" : "bg-orange")}
      />
      {status.state === "open"
        ? t("openNow", { time: status.closesAt })
        : status.opensToday
          ? t("closedNow", { time: status.opensAt })
          : t("closedTomorrow", { time: status.opensAt })}
    </span>
  );
}

export function ShopPicker({
  shops,
  heading = "h2",
}: {
  shops: PickerShop[];
  heading?: "h1" | "h2";
}) {
  const t = useTranslations("shops");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const [selected, setSelected] = useState(0);
  // Only photos someone has looked at are loaded.
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  const shop = shops[selected] ?? shops[0];
  const status = useShopStatus(shop);
  const H = heading;
  if (!shop) return null;
  const name = pick(shop.name, locale);

  return (
    <section
      aria-labelledby="shops-title"
      className="on-dark rounded-[2rem] bg-magenta p-5 text-white sm:p-8 lg:p-10"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <H id="shops-title" className="text-[clamp(2.6rem,6vw,4.4rem)] leading-[0.95]">
            {t("title")}
          </H>
          <p className="mt-3">
            {t("lead")} <DemoNote />
          </p>
          <ul className="mt-6 flex flex-col gap-2" aria-label={t("list")}>
            {shops.map((s, i) => (
              <li key={s.slug}>
                <button
                  type="button"
                  aria-pressed={i === selected}
                  onClick={() => {
                    setSelected(i);
                    setSeen((prev) => new Set(prev).add(i));
                    if (s.pickupEnabled) cart.setShop(s.id);
                  }}
                  className={cn(
                    "flex min-h-12 w-full items-center justify-between gap-4 rounded-xl border-2 px-4 text-left text-sm font-semibold transition-colors",
                    i === selected
                      ? "border-white bg-white text-plum"
                      : "border-white/45 hover:border-white hover:bg-white/10",
                  )}
                >
                  <span>{pick(s.name, locale)}</span>
                  <span
                    className={cn(
                      "shrink-0 font-medium",
                      i === selected ? "text-muted" : "text-white",
                    )}
                  >
                    {hoursText(s, t("mallHours"))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative min-h-[360px] overflow-hidden rounded-[1.5rem] bg-plum-2">
          {shops.map((s, i) =>
            s.img && seen.has(i) ? (
              <Image
                key={s.slug}
                src={s.img.src}
                alt={i === selected ? t("photoAlt", { name }) : ""}
                aria-hidden={i !== selected}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority={heading === "h1" && i === 0}
                className={cn(
                  "object-cover transition-opacity duration-500",
                  i === selected ? "opacity-100" : "opacity-0",
                )}
              />
            ) : null,
          )}
          <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white p-4 text-plum shadow-lift sm:inset-x-4 sm:bottom-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-bold">YUM YUM · {name}</p>
                <p className="text-sm text-muted">{pick(shop.address, locale)}</p>
                <p className="text-sm text-muted">
                  {shop.hours ? (
                    <StatusLabel status={status} />
                  ) : (
                    pick(shop.hoursNote, locale) || tc("mallHours")
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {shop.phone ? (
                  <a
                    href={`tel:${shop.phone}`}
                    aria-label={`${t("call")}: ${formatPhone(shop.phone)}`}
                    className="grid size-11 place-items-center rounded-full border-2 border-plum/15 hover:border-plum"
                  >
                    <Phone size={18} />
                  </a>
                ) : null}
                {shop.googleMapsUrl ? (
                  <a
                    href={shop.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-1 rounded-full bg-sun px-5 text-sm font-bold"
                  >
                    {t("directions")} <ArrowUpRight size={14} weight="bold" aria-hidden />
                    <span className="sr-only">({tc("newTab")})</span>
                  </a>
                ) : null}
              </div>
            </div>
            {shop.yandexMapsUrl || shop.twoGisUrl ? (
              <p className="mt-2 flex gap-4 text-xs font-semibold">
                {shop.yandexMapsUrl ? (
                  <a
                    href={shop.yandexMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-6 items-center underline-offset-2 hover:underline"
                  >
                    {t("yandexMaps")}
                  </a>
                ) : null}
                {shop.twoGisUrl ? (
                  <a
                    href={shop.twoGisUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-6 items-center underline-offset-2 hover:underline"
                  >
                    {t("twoGis")}
                  </a>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
