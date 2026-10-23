"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

/** HY · RU · EN segmented control with a sliding highlight. Plain links, so it works without JS. */
export function LanguageSwitch({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const t = useTranslations("lang");
  const current = useLocale() as Locale;
  const pathname = usePathname();
  const params = useParams();
  const search = useSearchParams();
  const [selected, setSelected] = useState<Locale>(current);
  const index = locales.indexOf(selected);
  const query = Object.fromEntries(search.entries());

  return (
    <nav aria-label={t("label")}>
      <ul
        className={cn(
          "relative grid h-11 grid-cols-3 items-center rounded-full p-1 text-xs font-bold tracking-wide",
          tone === "dark" ? "bg-white/12" : "bg-plum/8",
        )}
      >
        <li
          aria-hidden
          className="absolute top-1 bottom-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-white shadow-sm transition-transform duration-300 ease-(--ease-bounce)"
          style={{ transform: `translateX(${index * 100}%)` }}
        />
        {locales.map((l) => (
          <li key={l} className="relative">
            <Link
              // Typed routes need the pathname template plus its params.
              href={{ pathname, params, query } as never}
              locale={l}
              lang={l}
              hrefLang={l}
              aria-current={l === current ? "true" : undefined}
              aria-label={t(`${l}Full`)}
              onClick={() => setSelected(l)}
              className={cn(
                "grid h-9 min-w-11 place-items-center rounded-full px-2 transition-colors duration-300",
                l === selected
                  ? "text-plum"
                  : tone === "dark"
                    ? "text-white/80 hover:text-white"
                    : "text-plum/70",
              )}
            >
              {t(l)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
