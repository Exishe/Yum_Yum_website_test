"use client";

import { Minus, Plus, Trash, X, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { useEffect, useState } from "react";
import { BagIcon } from "@/components/icons/brand";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cart, cartCount, cartSubtotal, useCart } from "@/lib/cart-store";
import { formatAmd } from "@/lib/format";
import { t as pick } from "@/lib/localized";

export function CartDrawer() {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const state = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("yy:cart-open", onOpen);
    return () => window.removeEventListener("yy:cart-open", onOpen);
  }, []);

  const count = cartCount(state);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-plum/50 backdrop-blur-[2px] data-[state=open]:animate-fade" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col bg-cream shadow-2xl outline-none data-[state=open]:animate-slide-in"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <Dialog.Title className="flex items-center gap-2 font-display text-2xl">
              <BagIcon size={28} /> {t("title")}
            </Dialog.Title>
            <Dialog.Close
              className="grid size-11 place-items-center rounded-full hover:bg-plum/5"
              aria-label={tc("close")}
            >
              <X size={22} weight="bold" />
            </Dialog.Close>
          </div>

          {count === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
              <span className="grid size-24 place-items-center rounded-full bg-sun-soft">
                <BagIcon size={52} />
              </span>
              <p className="text-lg">{t("empty")}</p>
              <Dialog.Close asChild>
                <Link
                  href="/menu"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-plum px-6 font-semibold text-white"
                >
                  {t("browse")} <ArrowRight size={18} weight="bold" aria-hidden />
                </Link>
              </Dialog.Close>
            </div>
          ) : (
            <>
              <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
                {state.lines.map((line) => {
                  const name = pick(line.name, locale);
                  return (
                    <li key={line.key} className="flex gap-4 py-4">
                      <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-magenta-soft">
                        {line.image ? (
                          <Image src={line.image} alt="" fill sizes="64px" className="object-cover" />
                        ) : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold leading-snug">{name}</p>
                          <p className="shrink-0 font-semibold tabular-nums">
                            {formatAmd(line.unitPriceAmd * line.quantity, locale)}
                          </p>
                        </div>
                        {line.detail?.options?.length ? (
                          <p className="text-sm text-muted">{line.detail.options.map((o) => pick(o, locale)).join(", ")}</p>
                        ) : null}
                        {line.detail?.contents?.length ? (
                          <p className="text-sm text-muted">
                            {t("inBox", { list: line.detail.contents.map((o) => pick(o, locale)).join(", ") })}
                          </p>
                        ) : null}
                        {line.messages.length ? (
                          <p className="text-sm text-muted">{t("text", { text: line.messages.join(" · ") })}</p>
                        ) : null}
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => cart.setQuantity(line.key, line.quantity - 1)}
                            aria-label={t("decrease", { name })}
                            className="grid size-11 place-items-center rounded-full border border-line bg-white hover:border-plum/40"
                          >
                            <Minus size={16} weight="bold" />
                          </button>
                          <span className="w-6 text-center font-semibold tabular-nums" aria-live="polite">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => cart.setQuantity(line.key, line.quantity + 1)}
                            aria-label={t("increase", { name })}
                            className="grid size-11 place-items-center rounded-full border border-line bg-white hover:border-plum/40"
                          >
                            <Plus size={16} weight="bold" />
                          </button>
                          <button
                            type="button"
                            onClick={() => cart.remove(line.key)}
                            aria-label={t("remove", { name })}
                            className="ml-auto grid size-11 place-items-center rounded-full text-muted hover:bg-magenta-soft hover:text-magenta-ink"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-line bg-white px-5 py-5">
                <div className="mb-4 flex items-center justify-between text-lg">
                  <span>{t("subtotal")}</span>
                  <span className="font-display text-2xl tabular-nums">{formatAmd(cartSubtotal(state), locale)}</span>
                </div>
                <Dialog.Close asChild>
                  <Link
                    href="/checkout"
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-plum text-lg font-semibold text-white transition-transform hover:-translate-y-0.5"
                  >
                    {t("checkout")} <ArrowRight size={20} weight="bold" aria-hidden />
                  </Link>
                </Dialog.Close>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
