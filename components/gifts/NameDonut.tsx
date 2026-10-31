"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { AskPrice } from "@/components/AskPrice";
import type { Locale } from "@/i18n/routing";
import { announceAdd, cart } from "@/lib/cart-store";
import type { ClientProduct } from "@/lib/client-types";
import { formatAmd } from "@/lib/format";
import { t as pick } from "@/lib/localized";

/** Live preview of a name written in glaze. A drawing, not a photo: it says "roughly like this". */
export function NameDonut({ product }: { product: ClientProduct }) {
  const t = useTranslations("gifts.name");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const textOption = product.options.find((o) => o.kind === "text");
  const max = textOption?.maxLength ?? 12;
  const [text, setText] = useState("");
  const shown = text.trim() || t("placeholder");
  const arcId = useId().replace(/:/g, "");
  const fontSize = shown.length > 9 ? 26 : shown.length > 6 ? 32 : 38;

  return (
    <section
      aria-labelledby="name-title"
      className="grid grid-cols-1 items-center gap-8 rounded-[2rem] bg-magenta-soft p-5 sm:p-8 lg:grid-cols-[1fr_1fr]"
    >
      <div className="order-2 lg:order-1">
        <h2 id="name-title" className="text-[clamp(1.47rem,2.75vw,1.95rem)] leading-none">
          {t("title")}
        </h2>
        <p className="mt-2 text-muted">{t("lead")}</p>
        <label htmlFor="name-text" className="mt-6 block text-sm font-semibold">
          {t("label")}
        </label>
        <input
          id="name-text"
          value={text}
          maxLength={max}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("placeholder")}
          aria-describedby="name-hint"
          className="mt-2 h-14 w-full rounded-full border-2 border-white bg-white px-5 text-lg focus:border-plum focus:outline-none"
        />
        <p id="name-hint" className="mt-1 text-sm text-muted">
          {t("hint", { max })} {text.length}/{max}
        </p>
        {product.priceOnRequest ? (
          <div className="mt-5 max-w-lg">
            <p className="mb-3 text-sm">
              <strong>{tc("priceOnRequest")}.</strong> {tc("askNote")}
            </p>
            <AskPrice
              item={`${pick(product.name, locale)}${text.trim() ? ` «${text.trim()}»` : ""}`}
            />
          </div>
        ) : (
          <button
            type="button"
            disabled={!text.trim() || !product.isAvailable}
            onClick={(e) => {
              cart.add({
                productId: product.id,
                quantity: 1,
                optionIds: [],
                messages: [text.trim()],
                contents: [],
                name: product.name,
                unitPriceAmd: product.priceAmd,
                image: product.img?.src ?? null,
                leadTimeDays: product.leadTimeDays,
              });
              announceAdd(e.currentTarget);
              setText("");
            }}
            className="mt-5 h-13 w-full rounded-full bg-plum px-6 py-3.5 font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-45 sm:w-auto"
          >
            {t("add", { price: formatAmd(product.priceAmd, locale) })}
          </button>
        )}
        <p className="mt-3 text-sm text-muted">{pick(product.description, locale)}</p>
      </div>
      <div className="order-1 mx-auto w-full max-w-[340px] lg:order-2">
        <svg
          viewBox="0 0 300 300"
          role="img"
          aria-label={t("previewAlt", { text: shown })}
          className="w-full drop-shadow-xl"
        >
          <defs>
            <path id={arcId} d="M 62 150 A 88 88 0 0 1 238 150" />
          </defs>
          <circle cx="150" cy="150" r="138" fill="#e9b26a" />
          <circle cx="150" cy="150" r="138" fill="none" stroke="#c98c44" strokeWidth="6" />
          <path
            d="M24 140c4-62 58-112 126-112 70 0 124 50 128 114-8 12-20 6-26 18s2 26-12 32-20-8-34-2-12 22-28 22-16-16-30-18-20 12-32 4-6-22-20-28-22 4-28-8c-4-10 2-14-8-22-10-6-14-2-16-2Z"
            fill="#de1281"
          />
          <circle cx="150" cy="150" r="36" fill="#fff3f8" />
          <circle cx="150" cy="150" r="36" fill="none" stroke="#c98c44" strokeWidth="4" />
          {[
            [70, 90, "#ffe14d", 20],
            [220, 80, "#5ec8f2", -30],
            [240, 150, "#ffffff", 60],
            [60, 160, "#6fd3a1", -50],
            [110, 60, "#ffffff", 10],
          ].map(([x, y, c, r], i) => (
            <rect
              key={i}
              x={x as number}
              y={y as number}
              width="16"
              height="5"
              rx="2.5"
              fill={c as string}
              transform={`rotate(${r} ${x} ${y})`}
            />
          ))}
          <text
            fill="#ffffff"
            stroke="#ffffff"
            strokeWidth="0.6"
            style={{ fontFamily: "var(--font-hand)", fontSize, fontWeight: 700 }}
            textAnchor="middle"
          >
            <textPath href={`#${arcId}`} startOffset="50%">
              {shown}
            </textPath>
          </text>
        </svg>
      </div>
    </section>
  );
}
