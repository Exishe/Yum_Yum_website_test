"use client";

import { ArrowRight, Plus } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { FreshDonutIcon } from "@/components/icons/brand";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { announceAdd, cart } from "@/lib/cart-store";
import type { ClientProduct } from "@/lib/client-types";
import { cn } from "@/lib/cn";
import { formatAmd } from "@/lib/format";
import type { ImageInfo } from "@/lib/images";
import { t as pick } from "@/lib/localized";

export type Craving = "glazed" | "cold" | "gift" | "cake";

export type HeroChoice = {
  key: Craving;
  image: ImageInfo;
  thumb: ImageInfo;
  product: ClientProduct | null;
  /** Category tab to pre-select in the catalogue below. */
  tab: string;
  href: { pathname: "/menu"; query: { category: string } } | "/gifts";
};

const SPRINKLES = [
  { c: "#de1281", top: "9%", left: "4%", r: "20deg", d: "0s" },
  { c: "#5ec8f2", top: "6%", left: "38%", r: "-10deg", d: "-3s" },
  { c: "#ff9a3d", top: "4%", left: "60%", r: "35deg", d: "-6s" },
  { c: "#6fd3a1", top: "30%", left: "26%", r: "-30deg", d: "-2s" },
  { c: "#ffe14d", top: "42%", left: "44%", r: "60deg", d: "-8s" },
  { c: "#de1281", top: "86%", left: "52%", r: "10deg", d: "-5s" },
  { c: "#5ec8f2", top: "60%", left: "95%", r: "-45deg", d: "-1s" },
];

export function Hero({
  choices,
  phone,
  phoneDisplay,
  shopsCount,
}: {
  choices: HeroChoice[];
  phone: string;
  phoneDisplay: string;
  shopsCount: number;
}) {
  const t = useTranslations("hero");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const [active, setActive] = useState<Craving>("glazed");
  // Decorative motion starts after the page is interactive, so it never competes with loading.
  const [lively, setLively] = useState(false);
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    };
    const start = () => setLively(true);
    if (w.requestIdleCallback) w.requestIdleCallback(start, { timeout: 2500 });
    else window.setTimeout(start, 1500);
  }, []);
  // ...and pauses while the hero is scrolled out of view.
  const heroRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = heroRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setInView(!!e?.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const moving = lively && inView;
  const choice = choices.find((c) => c.key === active) ?? choices[0]!;
  const pickProduct = choice.product;
  const tagline = t("tagline");

  function choose(key: Craving) {
    setActive(key);
    const tab = choices.find((c) => c.key === key)?.tab;
    if (tab) window.dispatchEvent(new CustomEvent("yy:craving", { detail: { tab } }));
  }

  function addPick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!pickProduct) return;
    cart.add({
      productId: pickProduct.id,
      quantity: 1,
      optionIds: pickProduct.options.filter((o) => o.isDefault).map((o) => o.id),
      messages: [],
      contents: [],
      name: pickProduct.name,
      unitPriceAmd: pickProduct.priceAmd,
      image: pickProduct.img?.src ?? null,
      leadTimeDays: pickProduct.leadTimeDays,
    });
    announceAdd(e.currentTarget);
  }

  return (
    <section
      ref={heroRef}
      aria-labelledby="hero-title"
      className="dot-grid relative overflow-hidden bg-cream"
    >
      {/* Soft shapes that slowly change shape */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0",
          !moving && "[&_*]:[animation-play-state:paused]",
        )}
      >
        <div className="blob-shape absolute -top-24 -right-24 size-[min(70vw,640px)] animate-blob bg-magenta-soft/90 lg:top-0 lg:right-[-6%]" />
        <div className="blob-shape absolute top-[58%] -left-28 size-[min(48vw,360px)] animate-blob bg-sun-soft [animation-delay:-7s]" />
        {SPRINKLES.map((s, i) => (
          <span
            key={i}
            className="absolute block h-[6px] w-[18px] animate-drift rounded-full"
            style={{
              background: s.c,
              top: s.top,
              left: s.left,
              ["--r" as string]: s.r,
              animationDelay: s.d,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-4 pt-8 pb-10 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-6 lg:px-8 lg:pt-14 lg:pb-16">
        <div className="flex min-w-0 flex-col items-start lg:pt-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-white py-1.5 pr-4 pl-1.5 text-sm font-medium shadow-card">
            <span className="grid size-8 place-items-center rounded-full bg-sun-soft">
              <FreshDonutIcon size={22} />
            </span>
            {t("badge")}
          </p>
          <h1
            id="hero-title"
            className="hero-title mt-6 text-[clamp(3.4rem,10vw,7.5rem)] leading-[0.92]"
          >
            <span className="block">{t("titleA")}</span>
            <span className="block text-magenta">{t("titleB")}</span>
          </h1>
          {tagline ? (
            <p className="mt-3 font-hand text-2xl text-magenta-ink" lang={locale}>
              {tagline}
            </p>
          ) : null}
          <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-plum/85">{t("lead")}</p>

          <p className="mt-8 font-hand text-2xl text-magenta-ink" id="craving-label">
            {t("craving")}
          </p>
          <div
            role="radiogroup"
            aria-labelledby="craving-label"
            className="no-scrollbar snap-row -mx-4 mt-3 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:w-full sm:flex-wrap sm:px-0"
          >
            {choices.map((c) => {
              const selected = c.key === active;
              return (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(c.key)}
                  className={cn(
                    "inline-flex h-12 shrink-0 items-center gap-2 rounded-full border-2 py-1 pr-4 pl-1 text-sm font-semibold transition-all duration-300",
                    selected
                      ? "border-plum bg-plum text-white"
                      : "border-line bg-white text-plum hover:-translate-y-0.5 hover:border-plum/40",
                  )}
                >
                  <span className="relative size-9 overflow-hidden rounded-full">
                    <Image src={c.thumb.src} alt="" fill sizes="36px" className="object-cover" />
                  </span>
                  {t(`chips.${c.key}`)}
                </button>
              );
            })}
          </div>

          <div className="mt-7 flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href={choice.href}
              className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-plum px-7 font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              <span key={active} className="animate-rise">
                {t(`cta.${active}`)}
              </span>
              <ArrowRight
                aria-hidden
                size={18}
                weight="bold"
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <a
              href={`tel:${phone}`}
              className="text-center text-sm font-semibold underline decoration-2 underline-offset-4 hover:text-magenta-ink"
            >
              {tc("orCall", { phone: phoneDisplay })}
            </a>
          </div>
        </div>

        {/* Photo, rotating ring, badges */}
        <div className="relative mx-auto aspect-square w-full max-w-[600px] lg:mr-0">
          <svg
            aria-hidden
            viewBox="0 0 600 600"
            className={cn(
              "absolute inset-0 size-full motion-reduce:animate-none",
              lively && "animate-spin-slow",
              !moving && "[animation-play-state:paused]",
            )}
          >
            <defs>
              <path id="ring" d="M300,300 m-262,0 a262,262 0 1,1 524,0 a262,262 0 1,1 -524,0" />
            </defs>
            <text className="fill-plum font-sans text-[25px] font-semibold tracking-[0.42em]">
              <textPath href="#ring" textLength="1630" lengthAdjust="spacing">
                {t("ring") + t("ring")}
              </textPath>
            </text>
          </svg>
          <div className="absolute inset-[13%] overflow-hidden rounded-full bg-magenta-soft shadow-lift">
            {choices.map(
              (c, i) =>
                (i === 0 || lively || c.key === active) && (
                  <Image
                    key={c.key}
                    src={c.image.src}
                    alt={c.key === active ? t(`photoAlt.${c.key}`) : ""}
                    aria-hidden={c.key !== active}
                    fill
                    priority={i === 0}
                    sizes="(min-width: 1024px) 460px, 74vw"
                    placeholder={c.image.blur ? "blur" : "empty"}
                    blurDataURL={c.image.blur}
                    className={cn(
                      "object-cover transition-[opacity,transform] duration-700 ease-(--ease-out-soft)",
                      c.key === active ? "scale-100 opacity-100" : "scale-110 opacity-0",
                    )}
                  />
                ),
            )}
          </div>

          <p className="absolute top-[6%] right-[2%] grid size-[clamp(6rem,18vw,8.5rem)] rotate-6 place-items-center rounded-full bg-sun text-center shadow-card">
            <span>
              <span className="shops-badge block px-2 font-display text-[clamp(1.3rem,3.6vw,1.8rem)] leading-none">
                {t("shopsBadge", { count: shopsCount })}
              </span>
              <span className="text-xs font-medium">{t("shopsBadgeSub")}</span>
            </span>
          </p>

          {pickProduct ? (
            <div
              key={pickProduct.id}
              aria-live="polite"
              className="absolute bottom-[6%] left-0 flex max-w-[92%] animate-rise items-center gap-3 rounded-2xl bg-white p-2 pr-3 shadow-lift sm:left-[-4%]"
            >
              <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-magenta-soft">
                {pickProduct.img ? (
                  <Image
                    src={pickProduct.img.src}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block font-hand text-lg leading-none text-magenta-ink">
                  {t("todaysPick")}
                </span>
                <span className="block truncate font-semibold">
                  {pick(pickProduct.name, locale)} ·{" "}
                  {pickProduct.priceOnRequest
                    ? tc("onRequest")
                    : formatAmd(pickProduct.priceAmd, locale)}
                </span>
              </span>
              {pickProduct.isAvailable &&
              !pickProduct.priceOnRequest &&
              !pickProduct.boxSize &&
              !pickProduct.options.some((o) => o.kind === "text") ? (
                <button
                  type="button"
                  onClick={addPick}
                  aria-label={t("addPick", { name: pick(pickProduct.name, locale) })}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-sun transition-transform hover:rotate-90"
                >
                  <Plus size={18} weight="bold" />
                </button>
              ) : (
                <Link
                  href={choice.href}
                  aria-label={pick(pickProduct.name, locale)}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-sun"
                >
                  <ArrowRight size={18} weight="bold" />
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
