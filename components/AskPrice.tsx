"use client";

import { ArrowUpRight, Phone, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { useLocale, useTranslations } from "next-intl";
import { useSite } from "@/components/SiteContext";
import type { Locale } from "@/i18n/routing";
import { buyamLink } from "@/lib/buyam";
import { cn } from "@/lib/cn";

/** Call / WhatsApp buttons for an item whose price is on request. `item` pre-fills the message. */
export function AskPrice({ item, className }: { item: string; className?: string }) {
  const t = useTranslations("common");
  const { phone, whatsapp } = useSite();
  const wa = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(t("askText", { item }))}`
    : null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {phone ? (
        <a
          href={`tel:${phone}`}
          className="inline-flex h-12 flex-1 basis-40 items-center justify-center gap-2 rounded-xl bg-plum px-5 font-semibold whitespace-nowrap text-white transition-transform"
        >
          <Phone size={18} weight="bold" aria-hidden /> {t("askCall")}
        </a>
      ) : null}
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 flex-1 basis-52 items-center justify-center gap-2 rounded-xl border-2 border-plum px-5 font-semibold whitespace-nowrap transition-colors hover:bg-plum hover:text-white"
        >
          <WhatsappLogo size={18} weight="bold" aria-hidden /> {t("askWhatsapp")}
          <span className="sr-only">({t("newTab")})</span>
        </a>
      ) : null}
    </div>
  );
}

/** "Order on buy.am" for a product that is also sold there. */
export function BuyamButton({ url, className }: { url: string; className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  return (
    <a
      href={buyamLink(url, locale)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-plum underline decoration-2 underline-offset-4 hover:text-magenta-ink",
        className,
      )}
    >
      {t("buyam")} <ArrowUpRight size={14} weight="bold" aria-hidden />
      <span className="sr-only">({t("newTab")})</span>
    </a>
  );
}
