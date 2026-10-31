"use client";

import { CaretDown, ArrowRight, Phone, Clock } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  DonutIcon,
  FlowerIcon,
  HeartDonutIcon,
  PhoneIcon,
  PinIcon,
} from "@/components/icons/brand";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import type { ImageInfo } from "@/lib/images";
import { LanguageSwitch } from "./LanguageSwitch";
import { OrderButton } from "./OrderButton";

export type NavCategory = {
  slug: string;
  name: string;
  count: number;
  from: string | null;
  image: ImageInfo | null;
  imageAlt: string;
};

type Props = {
  categories: NavCategory[];
  phone: string;
  phoneDisplay: string;
};

function NavPill({
  children,
  icon,
  className,
  ...rest
}: React.ComponentProps<typeof Link> & { icon: React.ReactNode }) {
  return (
    <Link
      {...rest}
      className={cn(
        "group relative h-11 items-center gap-2 overflow-hidden rounded-full border border-white/25 pr-4 pl-1.5 text-sm font-semibold text-white transition-colors",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 translate-y-full rounded-full bg-magenta transition-transform duration-300 ease-(--ease-out-soft) group-hover:translate-y-0"
      />
      <span className="relative grid size-8 place-items-center rounded-full bg-white transition-transform duration-300 group-hover:-rotate-12">
        {icon}
      </span>
      <span className="relative">{children}</span>
    </Link>
  );
}

export function Header({ categories, phone, phoneDisplay }: Props) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // Close on route change (adjusting state during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    // Lock page scroll on phones while the full-screen panel is open.
    const isPhone = window.matchMedia("(max-width: 1023px)").matches;
    if (isPhone) document.documentElement.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
      document.documentElement.style.overflow = "";
    };
  }, [open, close]);

  const current = categories[active] ?? categories[0];

  return (
    <header className="on-dark sticky top-0 z-50 bg-black text-white">
      <div className="relative mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:h-[76px] lg:px-8">
        <nav aria-label={t("mainNav")} className="flex items-center gap-2">
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-full border pr-3 pl-1.5 text-sm font-semibold transition-colors duration-300 sm:pr-4",
              open ? "border-magenta bg-magenta" : "border-white/25 hover:border-white/50",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute inset-0 rounded-full bg-magenta transition-transform duration-300 ease-(--ease-out-soft)",
                open ? "translate-y-0" : "translate-y-full group-hover:translate-y-0",
              )}
            />
            <span
              className={cn(
                "relative grid size-8 place-items-center rounded-full bg-magenta-soft transition-transform duration-500 ease-(--ease-bounce)",
                open && "rotate-180",
              )}
            >
              <DonutIcon size={22} />
            </span>
            <span className="relative">{t("menu")}</span>
            <CaretDown
              aria-hidden
              size={14}
              weight="bold"
              className={cn(
                "relative hidden transition-transform duration-300 sm:block",
                open && "rotate-180",
              )}
            />
          </button>
          <NavPill href="/gifts" icon={<FlowerIcon size={22} />} className="hidden lg:inline-flex">
            {t("bouquets")}
          </NavPill>
          <NavPill
            href="/story"
            icon={<HeartDonutIcon size={22} />}
            className="hidden lg:inline-flex"
          >
            {t("story")}
          </NavPill>
        </nav>

        <Link
          href="/"
          aria-label={t("home")}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/90 transition-transform duration-300 hover:scale-105 hover:-rotate-6"
        >
          <Image
            src="/images/brand/logo-240.png"
            alt=""
            width={60}
            height={60}
            priority
            className="size-[52px] rounded-full lg:size-[60px]"
          />
        </Link>

        <div className="flex items-center gap-2">
          <NavPill href="/shops" icon={<PinIcon size={22} />} className="hidden lg:inline-flex">
            {t("findShop")}
          </NavPill>
          <div className="hidden lg:block">
            <LanguageSwitch />
          </div>
          <OrderButton />
        </div>
      </div>

      {open ? (
        <div
          id={panelId}
          ref={panelRef}
          role="region"
          aria-label={t("menuPanel")}
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-68px)] origin-top animate-panel overflow-y-auto bg-plum-2 shadow-2xl lg:max-h-none lg:overflow-visible"
        >
          {/* Desktop mega-menu */}
          <div className="mx-auto hidden max-w-[1440px] grid-cols-[1.1fr_1fr] gap-10 px-8 py-10 lg:grid">
            <div className="flex flex-col">
              <ul className="flex flex-col">
                {categories.map((c, i) => (
                  <li key={c.slug}>
                    <Link
                      href={{ pathname: "/menu", query: { category: c.slug } }}
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      className={cn(
                        "group flex items-baseline justify-between gap-6 border-b border-white/10 py-3 transition-colors",
                        i === active ? "text-sun" : "text-white hover:text-sun",
                      )}
                    >
                      <span className="font-display text-[clamp(1.6rem,2.45vw,2.34rem)] leading-none">
                        {c.name}
                        <sup className="ml-2 align-super font-sans text-sm font-semibold text-white/60">
                          {t("items", { count: c.count })}
                        </sup>
                      </span>
                      {c.from ? (
                        <span className="shrink-0 text-sm font-medium text-white/80">
                          {t("from", { price: c.from })}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/85">
                <Link
                  href="/gifts"
                  className="inline-flex items-center gap-2 font-semibold text-white hover:text-sun"
                >
                  <FlowerIcon size={20} /> {t("bouquets")}
                </Link>
                <a href={`tel:${phone}`} className="inline-flex items-center gap-2 hover:text-sun">
                  <Phone aria-hidden size={18} /> {phoneDisplay}
                </a>
                <span className="inline-flex items-center gap-2">
                  <Clock aria-hidden size={18} /> {tc("hoursDaily")}
                </span>
                <Link
                  href="/menu"
                  className="ml-auto inline-flex items-center gap-1 font-semibold text-sun hover:underline"
                >
                  {t("fullMenu")} <ArrowRight aria-hidden size={16} weight="bold" />
                </Link>
              </div>
            </div>
            <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] bg-plum-3">
              {categories.map((c, i) =>
                c.image ? (
                  <Image
                    key={c.slug}
                    src={c.image.src}
                    alt={i === active ? c.imageAlt : ""}
                    fill
                    sizes="(min-width: 1024px) 40vw, 1px"
                    placeholder={c.image.blur ? "blur" : "empty"}
                    blurDataURL={c.image.blur}
                    className={cn(
                      "object-cover transition-[opacity,transform] duration-500",
                      i === active ? "scale-100 opacity-100" : "scale-105 opacity-0",
                    )}
                  />
                ) : null,
              )}
              {current ? (
                <span className="absolute bottom-4 left-4 rounded-full bg-white px-4 py-2 font-hand text-xl text-plum">
                  {current.name}
                </span>
              ) : null}
            </div>
          </div>

          {/* Phone menu */}
          <div className="flex flex-col gap-6 px-4 pt-5 pb-8 sm:px-6 lg:hidden">
            <ul className="flex flex-col gap-1">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={{ pathname: "/menu", query: { category: c.slug } }}
                    className="flex min-h-14 items-center gap-3 rounded-2xl px-2 py-2 hover:bg-white/5"
                  >
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-plum-3">
                      {c.image ? (
                        <Image
                          src={c.image.src}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="flex-1 font-display text-2xl leading-tight">{c.name}</span>
                    {c.from ? (
                      <span className="text-xs text-white/75">{t("from", { price: c.from })}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
            <nav aria-label={t("quick")} className="grid grid-cols-2 gap-3">
              {[
                { href: "/gifts" as const, label: t("bouquets"), icon: <FlowerIcon size={26} /> },
                { href: "/shops" as const, label: t("findShop"), icon: <PinIcon size={26} /> },
                { href: "/story" as const, label: t("story"), icon: <HeartDonutIcon size={26} /> },
              ].map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="flex min-h-16 items-center gap-3 rounded-2xl bg-white/8 px-4 py-3 font-semibold hover:bg-white/12"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-white">
                    {q.icon}
                  </span>
                  {q.label}
                </Link>
              ))}
              <a
                href={`tel:${phone}`}
                className="flex min-h-16 items-center gap-3 rounded-2xl bg-white/8 px-4 py-3 font-semibold hover:bg-white/12"
              >
                <span className="grid size-10 place-items-center rounded-full bg-white">
                  <PhoneIcon size={26} />
                </span>
                {t("callUs")}
              </a>
            </nav>
            <div className="flex items-center justify-between gap-4">
              <LanguageSwitch />
              <span className="text-sm text-white/75">{tc("hoursDaily")}</span>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
