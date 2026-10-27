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
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setOpen(p)}
                className="group block w-full overflow-hidden rounded-[var(--radius-card)] bg-white text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="relative block aspect-square overflow-hidden bg-magenta-soft">
                  {p.img ? (
                    <Image
                      src={p.img.src}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <PhotoSoon name={name} label={tc("photoSoon")} />
                  )}
                  <span className="absolute right-3 bottom-3 grid size-11 place-items-center rounded-full bg-sun shadow-card transition-transform group-hover:rotate-90">
                    <Plus size={18} weight="bold" aria-hidden />
                  </span>
                </span>
                <span className="block p-4">
                  <span className="block font-semibold">{name}</span>
                  <span className="block text-sm text-muted">
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
