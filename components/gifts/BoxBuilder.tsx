"use client";

import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { AskPrice } from "@/components/AskPrice";
import type { Locale } from "@/i18n/routing";
import { announceAdd, cart } from "@/lib/cart-store";
import type { ClientProduct } from "@/lib/client-types";
import { cn } from "@/lib/cn";
import { formatAmd } from "@/lib/format";
import { t as pick } from "@/lib/localized";

/** "Pack your box": pick 6 or 12 donuts and watch them fill the box. */
export function BoxBuilder({ boxes, donuts }: { boxes: ClientProduct[]; donuts: ClientProduct[] }) {
  const t = useTranslations("gifts.box");
  const locale = useLocale() as Locale;
  const sorted = [...boxes].sort((a, b) => (a.boxSize ?? 0) - (b.boxSize ?? 0));
  const [boxId, setBoxId] = useState(sorted[0]?.id);
  const [packed, setPacked] = useState<ClientProduct[]>([]);
  const box = sorted.find((b) => b.id === boxId) ?? sorted[0];
  if (!box?.boxSize) return null;
  const size = box.boxSize;
  const left = size - packed.length;
  const donutsTotal = packed.reduce((s, p) => s + p.priceAmd, 0);
  const total = box.priceAmd + donutsTotal;
  const available = donuts.filter((d) => d.isAvailable && !d.priceOnRequest);

  function chooseBox(id: number) {
    const next = sorted.find((b) => b.id === id);
    setBoxId(id);
    setPacked((p) => p.slice(0, next?.boxSize ?? p.length));
  }

  return (
    <section
      id="box"
      aria-labelledby="box-title"
      className="scroll-mt-28 rounded-[2rem] bg-white p-5 shadow-card sm:p-8"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="box-title" className="text-[clamp(1.76rem,3.6vw,2.52rem)] leading-none">
            {t("title")}
          </h2>
          <p className="mt-2 max-w-lg text-muted">{t("lead")}</p>
        </div>
        <div role="radiogroup" aria-label={t("size")} className="flex gap-2">
          {sorted.map((b) => (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={b.id === box.id}
              onClick={() => chooseBox(b.id)}
              className={cn(
                "h-12 rounded-full border-2 px-5 text-sm font-semibold",
                b.id === box.id
                  ? "border-plum bg-plum text-white"
                  : "border-line bg-white hover:border-plum/40",
              )}
            >
              {b.boxSize === 6 ? t("six") : t("twelve")}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* The box */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[1.5rem] bg-magenta p-3 shadow-lift sm:p-4">
            <ol
              className={cn(
                "grid gap-2 rounded-2xl bg-magenta-soft p-3",
                size === 6 ? "grid-cols-3" : "grid-cols-4",
              )}
              aria-label={t("left", { count: left })}
            >
              {Array.from({ length: size }, (_, i) => {
                const p = packed[i];
                return (
                  <li key={i} className="aspect-square">
                    {p ? (
                      <button
                        type="button"
                        onClick={() => setPacked((list) => list.filter((_, k) => k !== i))}
                        aria-label={t("remove", { name: pick(p.name, locale) })}
                        className="relative block size-full animate-pop overflow-hidden rounded-full bg-white ring-2 ring-white transition-transform hover:scale-95"
                      >
                        {p.img ? (
                          <Image
                            src={p.img.src}
                            alt=""
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : null}
                      </button>
                    ) : (
                      <span
                        className="grid size-full place-items-center rounded-full border-2 border-dashed border-magenta/40 text-xs text-magenta-ink"
                        aria-label={t("slot", { n: i + 1 })}
                      >
                        {i + 1}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold" aria-live="polite">
              {t("left", { count: left })}
            </p>
            <div className="flex items-center gap-2">
              {packed.length ? (
                <button
                  type="button"
                  onClick={() => setPacked([])}
                  className="inline-flex h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold text-muted hover:text-plum"
                >
                  <ArrowCounterClockwise size={16} aria-hidden /> {t("clear")}
                </button>
              ) : null}
              {box.priceOnRequest ? null : (
                <button
                  type="button"
                  disabled={left !== 0}
                  onClick={(e) => {
                    cart.add({
                      productId: box.id,
                      quantity: 1,
                      optionIds: [],
                      messages: [],
                      contents: packed.map((p) => p.id),
                      name: box.name,
                      unitPriceAmd: total,
                      image: packed[0]?.img?.src ?? box.img?.src ?? null,
                      detail: { contents: packed.map((p) => p.name) },
                      leadTimeDays: Math.max(
                        box.leadTimeDays,
                        ...packed.map((p) => p.leadTimeDays),
                      ),
                    });
                    announceAdd(e.currentTarget);
                    setPacked([]);
                  }}
                  className="h-12 rounded-full bg-plum px-6 font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-45"
                >
                  {t("add", { price: formatAmd(total, locale) })}
                </button>
              )}
            </div>
          </div>
          {box.priceOnRequest ? (
            <>
              <p className="mt-1 text-sm text-muted">
                {t("boxFeeOnRequest", { price: formatAmd(donutsTotal, locale) })}
              </p>
              <AskPrice
                className="mt-4"
                item={`${pick(box.name, locale)}${
                  packed.length ? `: ${packed.map((p) => pick(p.name, locale)).join(", ")}` : ""
                }`}
              />
            </>
          ) : (
            <p className="mt-1 text-sm text-muted">
              {t("boxFee", { price: formatAmd(box.priceAmd, locale) })}
            </p>
          )}
        </div>

        {/* The donuts to choose from */}
        <div>
          <p className="mb-3 font-hand text-xl text-magenta-ink">{t("pick")}</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-4">
            {available.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  disabled={left === 0}
                  onClick={() => setPacked((list) => (list.length < size ? [...list, d] : list))}
                  className="group flex w-full flex-col items-center gap-1 rounded-2xl p-1 text-center disabled:opacity-50"
                >
                  <span className="relative block aspect-square w-full overflow-hidden rounded-full bg-magenta-soft transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-6 group-active:scale-90">
                    {d.img ? (
                      <Image src={d.img.src} alt="" fill sizes="96px" className="object-cover" />
                    ) : null}
                  </span>
                  <span className="text-xs leading-tight font-semibold">
                    {pick(d.name, locale)}
                  </span>
                  <span className="text-xs text-muted">{formatAmd(d.priceAmd, locale)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
