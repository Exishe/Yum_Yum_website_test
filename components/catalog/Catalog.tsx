"use client";

import { ArrowRight, MagnifyingGlass, Plus, X } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { PhotoSoon } from "@/components/ui/PhotoSoon";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { ClientCategory, ClientProduct } from "@/lib/client-types";
import { cn } from "@/lib/cn";
import { formatAmd } from "@/lib/format";
import { t as pick } from "@/lib/localized";
import dynamic from "next/dynamic";
import { addSimple, needsDetails } from "./actions";

const QuickView = dynamic(() => import("./QuickView").then((m) => m.QuickView), { ssr: false });

const FILTERS = [
  "glazed",
  "chocolate",
  "fruity",
  "filled",
  "kids",
  "iced",
  "hot",
  "savoury",
] as const;
const HOME_LIMIT = 7;

function featuredOf(c: ClientCategory | undefined): ClientProduct | undefined {
  if (!c) return undefined;
  return (
    c.products.find((p) => p.isFeatured && p.img) ?? c.products.find((p) => p.img) ?? c.products[0]
  );
}

function Row({
  p,
  locale,
  showThumb,
  onOpen,
  onPreview,
}: {
  p: ClientProduct;
  locale: Locale;
  showThumb: boolean;
  onOpen: (p: ClientProduct) => void;
  /** Shows this item in the big photo next to the list (home page). */
  onPreview?: (p: ClientProduct) => void;
}) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const name = pick(p.name, locale);
  return (
    <li
      onMouseEnter={onPreview ? () => onPreview(p) : undefined}
      onFocus={onPreview ? () => onPreview(p) : undefined}
      className="flex items-center gap-3 border-b border-dashed border-line py-3 last:border-0 sm:gap-4"
    >
      {showThumb ? (
        <span className="relative hidden size-14 shrink-0 overflow-hidden rounded-xl bg-magenta-soft sm:block">
          {p.img ? (
            <Image src={p.img.src} alt="" fill sizes="56px" className="object-cover" />
          ) : null}
        </span>
      ) : null}
      <button type="button" onClick={() => onOpen(p)} className="group min-w-0 flex-1 text-left">
        <span className="flex items-baseline gap-2">
          <span className="font-semibold group-hover:text-magenta-ink">{name}</span>
          {p.badges.map((b) => (
            <span
              key={b}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase",
                b === "new" ? "bg-sun text-plum" : "bg-magenta-soft text-magenta-ink",
              )}
            >
              {t(`badge.${b}` as "badge.new")}
            </span>
          ))}
          <span aria-hidden className="leader hidden h-3 flex-1 self-end sm:block" />
          <span
            className={cn(
              "ml-auto shrink-0 tabular-nums",
              p.priceOnRequest ? "text-sm font-semibold text-magenta-ink" : "font-bold",
            )}
          >
            {p.priceOnRequest ? tc("onRequest") : formatAmd(p.priceAmd, locale)}
          </span>
        </span>
        {p.description || !p.isAvailable ? (
          <span className="mt-0.5 block text-sm text-muted">
            {!p.isAvailable ? t("soldOut") : pick(p.description, locale)}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        disabled={!p.isAvailable}
        onClick={(e) => (needsDetails(p) ? onOpen(p) : addSimple(p, e.currentTarget))}
        aria-label={t("addNamed", { name })}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-sun transition-transform duration-300 hover:rotate-90 active:scale-90 disabled:opacity-40"
      >
        <Plus size={18} weight="bold" />
      </button>
    </li>
  );
}

export function Catalog({
  categories,
  initialSlug,
  mode,
}: {
  categories: ClientCategory[];
  initialSlug?: string;
  mode: "home" | "full";
}) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const visible = categories.filter((c) => c.inMenu && c.products.length > 0);
  const [slug, setSlug] = useState(
    visible.some((c) => c.slug === initialSlug) ? initialSlug! : (visible[0]?.slug ?? ""),
  );
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [open, setOpen] = useState<ClientProduct | null>(null);
  const [preview, setPreview] = useState<ClientProduct | null>(null);

  // The hero's "What are you craving?" chips pre-select a tab here.
  useEffect(() => {
    const onCraving = (e: Event) => {
      const tab = (e as CustomEvent<{ tab: string }>).detail?.tab;
      if (tab && visible.some((c) => c.slug === tab)) {
        setSlug(tab);
        setFilter("all");
      }
    };
    window.addEventListener("yy:craving", onCraving);
    return () => window.removeEventListener("yy:craving", onCraving);
  }, [visible]);

  const current = visible.find((c) => c.slug === slug) ?? visible[0];
  const q = deferredQuery.trim().toLowerCase();

  const items = useMemo(() => {
    if (q) {
      return visible
        .flatMap((c) => c.products)
        .filter((p) =>
          [p.name.hy, p.name.ru, p.name.en, p.description?.[locale] ?? ""].some((s) =>
            s.toLowerCase().includes(q),
          ),
        );
    }
    const list = current?.products ?? [];
    return filter === "all" ? list : list.filter((p) => p.tags.includes(filter));
  }, [q, visible, current, filter, locale]);

  const availableFilters = FILTERS.filter((f) => current?.products.some((p) => p.tags.includes(f)));
  const featured = featuredOf(current);
  // The category photo is a real shop photo; product shots are small catalogue images.
  const featuredPhoto = current?.img ?? featured?.img ?? null;
  const shown =
    mode === "home" ? items.filter((p) => p.id !== featured?.id).slice(0, HOME_LIMIT) : items;

  // The item under the cursor takes over the big photo while it has one.
  const spot = preview && shown.includes(preview) ? preview : featured;
  // Product shots are small cut-outs on white: shown whole, at their own size.
  const spotShot = preview && spot === preview ? preview.img : null;

  function selectTab(next: string) {
    setPreview(null);
    setSlug(next);
    setFilter("all");
    setQuery("");
    if (mode === "full") {
      const url = new URL(window.location.href);
      url.searchParams.set("category", next);
      window.history.replaceState(null, "", url);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-hand text-2xl text-magenta-ink">{t("eyebrow")}</p>
          {mode === "home" ? (
            <h2 id="menu-title" className="text-[clamp(2.6rem,6vw,4.5rem)] leading-none">
              {t("title")}
            </h2>
          ) : (
            <h1 id="menu-title" className="text-[clamp(2.8rem,7vw,5rem)] leading-none">
              {t("title")}
            </h1>
          )}
        </div>
        <ScrollRow
          role="tablist"
          aria-label={t("tabs")}
          watch={current?.slug}
          className="-mx-4 sm:mx-0 lg:max-w-[min(62%,56rem)]"
          rowClassName="snap-row gap-2 scroll-px-4 px-4 pb-1 sm:scroll-px-0 sm:px-0"
        >
          {visible.map((c) => {
            const selected = c.slug === current?.slug && !q;
            return (
              <button
                key={c.slug}
                type="button"
                role="tab"
                id={`tab-${c.slug}`}
                aria-selected={selected}
                aria-controls="menu-panel"
                onClick={() => selectTab(c.slug)}
                className={cn(
                  "h-12 shrink-0 rounded-full border-2 px-5 text-sm font-semibold transition-colors",
                  selected
                    ? "border-plum bg-plum text-white"
                    : "border-plum/80 bg-white hover:bg-plum/5",
                )}
              >
                {pick(c.name, locale)}
              </button>
            );
          })}
        </ScrollRow>
      </div>

      {mode === "full" ? (
        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center">
          <label className="relative block lg:w-80">
            <span className="sr-only">{t("search")}</span>
            <MagnifyingGlass
              size={20}
              aria-hidden
              className="absolute top-1/2 left-4 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-12 w-full rounded-full border-2 border-line bg-white pr-11 pl-11 focus:border-plum focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t("clearSearch")}
                className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-full"
              >
                <X size={16} weight="bold" />
              </button>
            ) : null}
          </label>
          {!q && availableFilters.length > 1 ? (
            <ScrollRow
              role="group"
              aria-label={t("filters")}
              watch={filter}
              className="-mx-4 sm:mx-0"
              rowClassName="snap-row gap-2 scroll-px-4 px-4 sm:scroll-px-0 sm:px-0"
            >
              {["all", ...availableFilters].map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors",
                    filter === f
                      ? "bg-magenta text-white"
                      : "bg-magenta-soft/70 text-plum hover:bg-magenta-soft",
                  )}
                >
                  {t(`filter.${f}` as "filter.all")}
                </button>
              ))}
            </ScrollRow>
          ) : null}
          <p className="text-sm text-muted lg:ml-auto" aria-live="polite">
            {t("results", { count: items.length })}
          </p>
        </div>
      ) : null}

      <div
        id="menu-panel"
        role="tabpanel"
        aria-labelledby={q ? undefined : `tab-${current?.slug}`}
        aria-label={q ? t("search") : undefined}
        className={cn("mt-8 grid grid-cols-1 gap-5", mode === "home" && "lg:grid-cols-[0.8fr_1fr]")}
      >
        {mode === "home" && featured && spot ? (
          <article className="relative min-h-[320px] overflow-hidden rounded-[var(--radius-xl2)] bg-magenta-soft shadow-card lg:min-h-0">
            {spotShot ? (
              <div className="absolute inset-0 grid place-items-center bg-white px-8 pt-6 pb-24">
                <Image
                  key={spotShot.src}
                  src={spotShot.src}
                  alt={pick(spot.name, locale)}
                  width={spotShot.w}
                  height={spotShot.h}
                  sizes="400px"
                  className="h-auto w-full max-w-[400px] animate-fade"
                />
              </div>
            ) : featuredPhoto ? (
              <Image
                key={featuredPhoto.src}
                src={featuredPhoto.src}
                alt={pick(current?.name, locale)}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                placeholder={featuredPhoto.blur ? "blur" : "empty"}
                blurDataURL={featuredPhoto.blur}
                className="animate-fade object-cover"
              />
            ) : (
              <PhotoSoon name={pick(featured.name, locale)} label={tc("photoSoon")} />
            )}
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-2xl bg-white p-3 pl-4 shadow-card">
              <div className="min-w-0">
                {spot === featured ? (
                  <p className="font-hand text-lg leading-tight text-magenta-ink">
                    {t("featured")}
                  </p>
                ) : null}
                <h3 className="mt-0.5 line-clamp-2 font-sans text-lg leading-snug font-bold">
                  {pick(spot.name, locale)}
                </h3>
              </div>
              <button
                type="button"
                disabled={!spot.isAvailable}
                onClick={(e) =>
                  needsDetails(spot) ? setOpen(spot) : addSimple(spot, e.currentTarget)
                }
                className="inline-flex h-11 shrink-0 items-center gap-1 rounded-full bg-magenta px-4 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {t("addPrice", { price: formatAmd(spot.priceAmd, locale) })}
              </button>
            </div>
          </article>
        ) : null}

        <div className="rounded-[var(--radius-xl2)] bg-white p-4 shadow-card sm:p-6">
          {shown.length ? (
            <ul
              onMouseLeave={() => setPreview(null)}
              className={cn(mode === "full" && "lg:columns-2 lg:gap-10 [&>li]:break-inside-avoid")}
            >
              {shown.map((p) => (
                <Row
                  key={p.id}
                  p={p}
                  locale={locale}
                  showThumb={mode === "full"}
                  onOpen={setOpen}
                  onPreview={mode === "home" ? setPreview : undefined}
                />
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-muted">{t("noResults", { query })}</p>
          )}
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>{t("priceNote")}</p>
            {mode === "home" ? (
              <Link
                href={{ pathname: "/menu", query: { category: current?.slug ?? "" } }}
                className="inline-flex min-h-11 shrink-0 items-center gap-1 font-semibold text-plum underline decoration-2 underline-offset-4 hover:text-magenta-ink"
              >
                {t("seeAll")} <ArrowRight size={16} weight="bold" aria-hidden />
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {open ? <QuickView product={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}
