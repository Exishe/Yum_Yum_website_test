"use client";

import { Minus, Plus, X, CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { useState } from "react";
import { PhotoSoon } from "@/components/ui/PhotoSoon";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { announceAdd, cart } from "@/lib/cart-store";
export { addSimple, needsDetails } from "./actions";
import type { ClientProduct } from "@/lib/client-types";
import { cn } from "@/lib/cn";
import { formatAmd } from "@/lib/format";
import { t as pick } from "@/lib/localized";

function Body({ product, onDone }: { product: ClientProduct; onDone: () => void }) {
  const t = useTranslations("catalog");
  const tg = useTranslations("gifts");
  const locale = useLocale() as Locale;
  const sizes = product.options.filter((o) => o.kind === "size");
  const extras = product.options.filter(
    (o) => o.kind === "syrup" || o.kind === "extra" || o.kind === "filling",
  );
  const textOption = product.options.find((o) => o.kind === "text");
  const multiLine = (textOption?.maxLength ?? 0) > 20;
  const [size, setSize] = useState<number | null>(
    sizes.find((s) => s.isDefault)?.id ?? sizes[0]?.id ?? null,
  );
  const [chosen, setChosen] = useState<number[]>([]);
  const [qty, setQty] = useState(1);
  const [text, setText] = useState("");

  const selected = product.options.filter((o) => o.id === size || chosen.includes(o.id));
  const unit = product.priceAmd + selected.reduce((s, o) => s + o.priceDeltaAmd, 0);
  const messages = textOption
    ? (multiLine ? text.split("\n") : [text])
        .map((m) => m.trim())
        .filter(Boolean)
        .slice(0, 12)
    : [];
  const tooLong = !!textOption?.maxLength && messages.some((m) => m.length > textOption.maxLength!);
  const name = pick(product.name, locale);

  return (
    <div className="flex max-h-[88dvh] flex-col">
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-magenta-soft sm:aspect-[16/10]">
        {product.img ? (
          <Image
            src={product.img.src}
            alt={pick(product.imageAlt, locale) || name}
            fill
            sizes="(min-width: 640px) 480px, 100vw"
            placeholder={product.img.blur ? "blur" : "empty"}
            blurDataURL={product.img.blur}
            className="object-cover"
          />
        ) : (
          <PhotoSoon name={name} label={t("quick.title")} />
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <Dialog.Title className="font-display text-3xl leading-tight">{name}</Dialog.Title>
          <p className="shrink-0 font-display text-2xl text-magenta-ink">
            {formatAmd(product.priceAmd, locale)}
          </p>
        </div>
        {product.description ? (
          <p className="mt-1 text-muted">{pick(product.description, locale)}</p>
        ) : null}

        {sizes.length > 1 ? (
          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-semibold">{t("quick.size")}</legend>
            <div className="flex flex-wrap gap-2">
              {sizes.map((o) => (
                <label
                  key={o.id}
                  className={cn(
                    "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-4 text-sm font-semibold has-focus-visible:ring-3 has-focus-visible:ring-magenta",
                    size === o.id ? "border-plum bg-plum text-white" : "border-line bg-white",
                  )}
                >
                  <input
                    type="radio"
                    name="size"
                    className="sr-only"
                    checked={size === o.id}
                    onChange={() => setSize(o.id)}
                  />
                  {pick(o.name, locale)}
                  {o.priceDeltaAmd ? (
                    <span className="opacity-75">+{formatAmd(o.priceDeltaAmd, locale)}</span>
                  ) : null}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {extras.length ? (
          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-semibold">
              {extras[0]!.kind === "syrup" ? t("quick.syrup") : t("quick.extra")}
            </legend>
            <div className="flex flex-wrap gap-2">
              {extras.map((o) => {
                const on = chosen.includes(o.id);
                return (
                  <label
                    key={o.id}
                    className={cn(
                      "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-4 text-sm font-semibold has-focus-visible:ring-3 has-focus-visible:ring-magenta",
                      on ? "border-magenta bg-magenta-soft" : "border-line bg-white",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={() =>
                        setChosen((c) => (on ? c.filter((x) => x !== o.id) : [...c, o.id]))
                      }
                    />
                    {pick(o.name, locale)}{" "}
                    <span className="opacity-75">+{formatAmd(o.priceDeltaAmd, locale)}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {textOption ? (
          <div className="mt-5">
            <label htmlFor="qv-text" className="mb-2 block text-sm font-semibold">
              {multiLine ? t("quick.messages") : t("quick.message")}
            </label>
            {multiLine ? (
              <textarea
                id="qv-text"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("quick.messagePlaceholder")}
                aria-describedby="qv-hint"
                aria-invalid={tooLong}
                className="w-full rounded-2xl border-2 border-line bg-white px-4 py-3 focus:border-plum focus:outline-none"
              />
            ) : (
              <input
                id="qv-text"
                value={text}
                maxLength={textOption.maxLength ?? 30}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("quick.messagePlaceholder")}
                aria-describedby="qv-hint"
                className="h-12 w-full rounded-full border-2 border-line bg-white px-4 focus:border-plum focus:outline-none"
              />
            )}
            <p
              id="qv-hint"
              className={cn("mt-1 text-sm", tooLong ? "text-magenta-ink" : "text-muted")}
            >
              {multiLine
                ? t("quick.messagesHint", { max: textOption.maxLength ?? 60 })
                : t("quick.messageHint", { max: textOption.maxLength ?? 12 })}
            </p>
          </div>
        ) : null}

        {product.leadTimeDays > 0 ? (
          <p className="mt-5 flex items-center gap-2 rounded-2xl bg-sun-soft px-4 py-3 text-sm">
            <CalendarBlank size={20} aria-hidden /> {t("quick.leadTime")}
          </p>
        ) : null}
      </div>

      {product.boxSize ? (
        <div className="shrink-0 border-t border-line bg-white px-5 py-4">
          <Link
            href={{ pathname: "/gifts", hash: "box" }}
            onClick={onDone}
            className="flex h-12 items-center justify-center rounded-full bg-plum font-semibold text-white"
          >
            {tg("box.title")}
          </Link>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-3 border-t border-line bg-white px-5 py-4">
          <div className="flex items-center gap-1" role="group" aria-label={t("quick.quantity")}>
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label={t("quick.decrease")}
              className="grid size-11 place-items-center rounded-full border border-line"
            >
              <Minus size={16} weight="bold" />
            </button>
            <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(50, q + 1))}
              aria-label={t("quick.increase")}
              className="grid size-11 place-items-center rounded-full border border-line"
            >
              <Plus size={16} weight="bold" />
            </button>
          </div>
          <button
            type="button"
            disabled={!product.isAvailable || tooLong || (!!textOption && messages.length === 0)}
            onClick={(e) => {
              cart.add({
                productId: product.id,
                quantity: qty,
                optionIds: selected.map((o) => o.id),
                messages,
                contents: [],
                name: product.name,
                unitPriceAmd: unit,
                image: product.img?.src ?? null,
                detail: { options: selected.map((o) => o.name) },
                leadTimeDays: product.leadTimeDays,
              });
              announceAdd(e.currentTarget);
              onDone();
            }}
            className="h-12 flex-1 rounded-full bg-plum px-5 font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
          >
            {product.isAvailable
              ? t("quick.addToOrder", { price: formatAmd(unit * qty, locale) })
              : t("soldOut")}
          </button>
        </div>
      )}
    </div>
  );
}

export function QuickView({
  product,
  onClose,
}: {
  product: ClientProduct | null;
  onClose: () => void;
}) {
  const tc = useTranslations("common");
  return (
    <Dialog.Root open={!!product} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-plum/50 data-[state=open]:animate-fade" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-[61] overflow-hidden rounded-t-[2rem] bg-cream shadow-2xl outline-none data-[state=open]:animate-slide-up sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[min(92vw,32rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem] sm:data-[state=open]:animate-fade"
        >
          {product ? <Body key={product.id} product={product} onDone={onClose} /> : null}
          <Dialog.Close
            aria-label={tc("close")}
            className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-white/90 shadow-card"
          >
            <X size={20} weight="bold" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
