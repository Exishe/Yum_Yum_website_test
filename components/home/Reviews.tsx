"use client";

import { CaretLeft, CaretRight, Star } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { PublicReview } from "@/lib/catalog";
import type { Ratings } from "@/lib/settings";

/** Real reviews only, quoted exactly, with name and platform. */
export function Reviews({ reviews, ratings }: { reviews: PublicReview[]; ratings: Ratings }) {
  const t = useTranslations("reviews");
  const [i, setI] = useState(0);
  if (!reviews.length) return null;
  const r = reviews[i % reviews.length]!;
  const many = reviews.length > 1;
  const go = (d: number) => setI((n) => (n + d + reviews.length) % reviews.length);

  return (
    <section
      aria-labelledby="reviews-title"
      className="mx-auto max-w-[1100px] px-4 py-16 text-center sm:px-6"
    >
      <h2 id="reviews-title" className="sr-only">
        {t("label")}
      </h2>
      <figure key={r.id} className="animate-rise" aria-live="polite">
        {r.rating ? (
          <p
            role="img"
            className="flex justify-center gap-1 text-magenta"
            aria-label={t("stars", { rating: r.rating })}
          >
            {Array.from({ length: r.rating }, (_, k) => (
              <Star key={k} size={20} weight="fill" aria-hidden />
            ))}
          </p>
        ) : null}
        <blockquote
          lang={r.quoteLocale}
          className="mt-4 font-display text-[clamp(2rem,5vw,3.6rem)] leading-tight"
        >
          “{r.quote}”
        </blockquote>
        <figcaption className="mt-3 text-sm text-muted">
          {r.url ? (
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:underline"
            >
              {t("on", { author: r.author, platform: r.platform })}
            </a>
          ) : (
            t("on", { author: r.author, platform: r.platform })
          )}
        </figcaption>
      </figure>
      {many ? (
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t("prev")}
            className="grid size-12 place-items-center rounded-full border-2 border-plum"
          >
            <CaretLeft size={18} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t("next")}
            className="grid size-12 place-items-center rounded-full bg-plum text-white"
          >
            <CaretRight size={18} weight="bold" />
          </button>
        </div>
      ) : null}
      <ul
        aria-label={t("ratingsTitle")}
        className="mt-10 flex flex-wrap justify-center gap-3 text-sm"
      >
        {ratings.google ? (
          <li className="rounded-full bg-white px-4 py-2 shadow-card">
            <strong className="mr-1 font-display text-lg">
              {ratings.google.rating.toFixed(1)}
            </strong>
            {t("google", { count: ratings.google.count })}
          </li>
        ) : null}
        {ratings.yandex ? (
          <li className="rounded-full bg-white px-4 py-2 shadow-card">
            <strong className="mr-1 font-display text-lg">
              {ratings.yandex.rating.toFixed(1)}
            </strong>
            {t("yandex", { label: ratings.yandex.label ?? "" })}
          </li>
        ) : null}
        {ratings.buyam ? (
          <li className="rounded-full bg-white px-4 py-2 shadow-card">
            <strong className="mr-1 font-display text-lg">{ratings.buyam.rating.toFixed(1)}</strong>
            {t("buyam")}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
