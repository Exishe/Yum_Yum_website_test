"use client";

import { Plus } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import dynamic from "next/dynamic";
import { PhotoSoon } from "@/components/ui/PhotoSoon";
import type { Locale } from "@/i18n/routing";
import type { ClientProduct } from "@/lib/client-types";
import { formatAmd } from "@/lib/format";
import { t as pick } from "@/lib/localized";
import { BOUQUET_PARTS } from "@/lib/bouquets";

const QuickView = dynamic(() => import("@/components/catalog/QuickView").then((m) => m.QuickView), {
  ssr: false,
});

export function GiftGrid({ products }: { products: ClientProduct[] }) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState<ClientProduct | null>(null);
  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => {
          const name = pick(p.name, locale);
          const parts = BOUQUET_PARTS[p.slug];
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setOpen(p)}
                className="group block w-full overflow-hidden rounded-[var(--radius-card)] bg-white text-left shadow-card transition-transform duration-150 ease-out active:scale-[0.98]"
              >
                <span className="relative block aspect-square overflow-hidden bg-magenta-soft">
                  {p.img ? (
                    <Image
                      src={p.img.src}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="zoom-photo object-cover"
                    />
                  ) : (
                    <PhotoSoon name={name} label={tc("photoSoon")} />
                  )}
                  <span className="absolute right-3 bottom-3 grid size-11 place-items-center rounded-full bg-white text-plum shadow-card transition-transform duration-150 ease-out group-hover:scale-110 group-active:scale-95">
                    <Plus size={18} weight="bold" aria-hidden />
                  </span>
                </span>
                <span className="block p-4">
                  <span className="block font-semibold">{name}</span>
                  {parts ? (
                    <span className="mt-1.5 block space-y-0.5 text-[0.8125rem] leading-snug text-plum/80">
                      {parts.map((part, i) => (
                        <span key={i} className="flex gap-1.5">
                          <span
                            aria-hidden
                            className="mt-[0.45em] size-1 shrink-0 rounded-full bg-magenta"
                          />
                          {pick(part, locale)}
                        </span>
                      ))}
                    </span>
                  ) : null}
                  <span className="mt-2 block text-sm font-semibold">
                    {p.priceOnRequest ? tc("priceOnRequest") : formatAmd(p.priceAmd, locale)}
                  </span>
                  <span className="sr-only">{t("addNamed", { name })}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {open ? <QuickView product={open} onClose={() => setOpen(null)} /> : null}
    </>
  );
}
