"use client";

import { CaretDown, Check, Globe } from "@phosphor-icons/react/dist/ssr";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

/**
 * Phone header: a small "🌐 ՀԱՅ" button that opens the three languages by
 * their own names, so a Russian or English speaker finds it at a glance.
 */
export function LanguageMenu() {
  const t = useTranslations("lang");
  const current = useLocale() as Locale;
  const pathname = usePathname();
  const params = useParams();
  const query = Object.fromEntries(useSearchParams().entries());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${t("label")}: ${t(`${current}Full`)}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-11 items-center gap-0.5 rounded-full border px-1.5 text-xs font-bold transition-colors sm:gap-1 sm:px-2.5",
          open
            ? "border-white bg-white text-plum"
            : "border-white/30 text-white hover:border-white/60",
        )}
      >
        <Globe size={16} weight="bold" aria-hidden />
        {t(current)}
        <CaretDown
          size={11}
          weight="bold"
          aria-hidden
          className={cn("hidden transition-transform sm:block", open && "rotate-180")}
        />
      </button>
      {open ? (
        <ul
          id={id}
          className="absolute top-full right-0 z-10 mt-2 w-44 animate-panel overflow-hidden rounded-2xl bg-white p-1.5 text-plum shadow-lift"
        >
          {locales.map((l) => (
            <li key={l}>
              <Link
                href={{ pathname, params, query } as never}
                locale={l}
                lang={l}
                hrefLang={l}
                aria-current={l === current ? "true" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex min-h-11 items-center justify-between rounded-xl px-3 font-semibold",
                  l === current ? "bg-sun-soft" : "hover:bg-blush",
                )}
              >
                {t(`${l}Full`)}
                {l === current ? <Check size={16} weight="bold" aria-hidden /> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
