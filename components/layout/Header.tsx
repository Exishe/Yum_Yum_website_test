"use client";

import { CaretDown, ArrowRight, Phone, Clock } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { DonutIcon, FlowerIcon, LogoIcon, PhoneIcon, PinIcon } from "@/components/icons/brand";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import type { ImageInfo } from "@/lib/images";
import { LanguageMenu } from "./LanguageMenu";
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
        "group relative h-11 items-center gap-2 overflow-hidden rounded-xl border border-white/25 pr-4 pl-1.5 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:border-magenta hover:bg-magenta",
        className,
      )}
    >
      <span className="relative grid size-8 place-items-center rounded-full bg-white">{icon}</span>
      <span className="relative">{children}</span>
    </Link>
  );
}

const SPRINKLE_COLOURS = ["#ffd84a", "#e5197b", "#5ec6e8", "#7ed957", "#ffffff", "#ff7a59"];

/**
 * A small hello when the menu opens: a handful of sprinkles bursts from the
 * donut on the button and falls away. Fixed pattern (no randomness, so server
 * and client agree), transform and opacity only, about 0.8 s; none with
 * reduced motion.
 */
const SPRINKLES = Array.from({ length: 16 }, (_, k) => {
  // Spread around the donut, more of them sideways and down where the menu opens.
  const angle = ((k / 16) * 360 + ((k * 47) % 23) - 11) * (Math.PI / 180);
  const dist = 34 + ((k * 37) % 26);
  return {
    x: Math.round(Math.cos(angle) * dist),
    y: Math.round(Math.sin(angle) * dist * 0.8 + 12), // a little gravity
    r0: (k * 67) % 180,
    r1: ((k * 67) % 180) + (k % 2 ? 160 : -160),
    delay: (k % 4) * 18,
    colour: SPRINKLE_COLOURS[k % SPRINKLE_COLOURS.length]!,
  };
});

function Salute() {
  return (
    <span aria-hidden className="salute pointer-events-none absolute top-1/2 left-[22px] z-20">
      {SPRINKLES.map((b, k) => (
        <span
          key={k}
          className="salute-bit"
          style={
            {
              "--x": `${b.x}px`,
              "--y": `${b.y}px`,
              "--r0": `${b.r0}deg`,
              "--r1": `${b.r1}deg`,
              animationDelay: `${b.delay}ms`,
              background: b.colour,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

export function Header({ categories, phone, phoneDisplay }: Props) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const tl = useTranslations("lang");
  const pathname = usePathname();
  // "closing" keeps the panel on screen while it animates away.
  const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");
  const open = phase === "open";
  const setOpen = useCallback((next: boolean | ((was: boolean) => boolean)) => {
    setPhase((p) => {
      const want = typeof next === "function" ? next(p === "open") : next;
      if (want) return "open";
      return p === "closed" ? "closed" : "closing";
    });
  }, []);
  useEffect(() => {
    if (phase !== "closing") return;
    const id = window.setTimeout(() => setPhase("closed"), 190);
    return () => window.clearTimeout(id);
  }, [phase]);
  const [active, setActive] = useState(0);
  const [salute, setSalute] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = useCallback(
    (returnFocus = true) => {
      setOpen(false);
      if (returnFocus) buttonRef.current?.focus();
    },
    [setOpen],
  );

  // Close on route change (adjusting state during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setPhase("closed");
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
        <nav aria-label={t("mainNav")} className="relative flex items-center gap-2">
          {salute ? <Salute key={salute} /> : null}
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => {
              if (!open) setSalute((n) => n + 1);
              setOpen((v) => !v);
            }}
            className={cn(
              "group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-xl border pr-3 pl-1.5 text-sm font-semibold transition-[color,background-color,border-color,scale] duration-150 ease-out active:scale-[0.97] sm:pr-4",
              open
                ? "border-magenta bg-magenta"
                : "border-white/25 hover:border-magenta hover:bg-magenta",
            )}
          >
            <span
              className={cn(
                "relative grid size-8 place-items-center rounded-full bg-magenta-soft transition-transform duration-250 ease-(--ease-out)",
                open && "rotate-180",
              )}
            >
              <DonutIcon size={22} />
            </span>
            <span className="relative max-[359px]:sr-only">{t("menu")}</span>
            <CaretDown
              aria-hidden
              size={14}
              weight="bold"
              className={cn(
                "relative hidden transition-transform duration-200 ease-(--ease-out) sm:block",
                open && "rotate-180",
              )}
            />
          </button>
          <NavPill href="/gifts" icon={<FlowerIcon size={22} />} className="hidden lg:inline-flex">
            {t("bouquets")}
          </NavPill>
          <NavPill href="/story" icon={<LogoIcon size={22} />} className="hidden lg:inline-flex">
            {t("story")}
          </NavPill>
        </nav>

        <Link
          href="/"
          aria-label={t("home")}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/90"
        >
          <Image
            src="/images/brand/logo-240.png"
            alt=""
            width={60}
            height={60}
            priority
            className="size-11 rounded-full sm:size-[52px] lg:size-[60px]"
          />
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <NavPill href="/shops" icon={<PinIcon size={22} />} className="hidden lg:inline-flex">
            {t("findShop")}
          </NavPill>
          <div className="hidden lg:block">
            <LanguageSwitch />
          </div>
          {/* Phones: the language is one tap away next to the basket (in the menu on the smallest screens). */}
          <div className="hidden min-[360px]:block lg:hidden">
            <LanguageMenu />
          </div>
          <OrderButton />
        </div>
      </div>

      {phase !== "closed" ? (
        <div
          aria-hidden
          data-state={phase}
          className="menu-scrim fixed inset-x-0 top-[68px] bottom-0 -z-10 bg-black/45 lg:top-[76px]"
        />
      ) : null}
      {phase !== "closed" ? (
        <div
          id={panelId}
          ref={panelRef}
          role="region"
          aria-label={t("menuPanel")}
          data-state={phase}
          className="menu-panel absolute inset-x-0 top-full max-h-[calc(100dvh-68px)] overflow-y-auto bg-plum-2 shadow-2xl lg:max-h-none lg:overflow-visible"
        >
          {/* Desktop mega-menu */}
          <div className="mx-auto hidden max-w-[1440px] grid-cols-[1.1fr_1fr] gap-10 px-8 py-10 lg:grid">
            <div className="flex flex-col">
              <ul className="flex flex-col">
                {categories.map((c, i) => (
                  <li
                    key={c.slug}
                    className="menu-item"
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    <Link
                      href={{ pathname: "/menu", query: { category: c.slug } }}
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      className={cn(
                        "group flex items-baseline justify-between gap-6 border-b border-white/10 py-3 transition-colors",
                        i === active ? "text-sun" : "text-white hover:text-sun",
                      )}
                    >
                      <span className="font-display text-[clamp(1.2rem,1.8vw,1.5rem)] leading-none">
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
              <div
                className="menu-item mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/85"
                style={{ "--i": categories.length } as React.CSSProperties}
              >
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
            <div
              className="menu-item relative aspect-[5/4] overflow-hidden rounded-[2rem] bg-plum-3"
              style={{ "--i": 1 } as React.CSSProperties}
            >
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
                      "menu-photo object-cover transition-opacity duration-300 ease-out",
                      i === active ? "opacity-100" : "opacity-0",
                    )}
                  />
                ) : null,
              )}
              {current ? (
                <span className="absolute bottom-4 left-4 rounded-xl bg-white px-4 py-2 font-hand text-xl text-plum">
                  {current.name}
                </span>
              ) : null}
            </div>
          </div>

          {/* Phone menu */}
          <div className="flex flex-col gap-6 px-4 pt-5 pb-8 sm:px-6 lg:hidden">
            <div className="menu-item flex items-center justify-between gap-4 rounded-2xl bg-white/8 py-2 pr-2 pl-4">
              <span className="text-sm font-semibold text-white/85">{tl("label")}</span>
              <LanguageSwitch />
            </div>
            <ul className="flex flex-col gap-1">
              {categories.map((c, i) => (
                <li
                  key={c.slug}
                  className="menu-item"
                  style={{ "--i": i + 1 } as React.CSSProperties}
                >
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
            <nav
              aria-label={t("quick")}
              className="menu-item grid grid-cols-2 gap-3"
              style={{ "--i": categories.length + 1 } as React.CSSProperties}
            >
              {[
                { href: "/gifts" as const, label: t("bouquets"), icon: <FlowerIcon size={26} /> },
                { href: "/shops" as const, label: t("findShop"), icon: <PinIcon size={26} /> },
                { href: "/story" as const, label: t("story"), icon: <LogoIcon size={26} /> },
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
            <p
              className="menu-item text-sm text-white/75"
              style={{ "--i": categories.length + 2 } as React.CSSProperties}
            >
              {tc("hoursDaily")}
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
}
