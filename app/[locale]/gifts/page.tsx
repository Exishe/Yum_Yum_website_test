import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BoxBuilder } from "@/components/gifts/BoxBuilder";
import { GiftGrid } from "@/components/gifts/GiftGrid";
import { NameDonut } from "@/components/gifts/NameDonut";
import { Photo } from "@/components/ui/Photo";
import type { Locale } from "@/i18n/routing";
import Image from "next/image";
import { getMenu, getReviews } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { toClientProduct } from "@/lib/client-products";
import { imgOrThrow } from "@/lib/images";
import { alternates } from "@/lib/seo";
import { DemoNote } from "@/components/AskPrice";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("giftsTitle"),
    description: t("giftsDescription"),
    alternates: alternates(locale as Locale, "/gifts"),
  };
}

export default async function GiftsPage({ params }: Props) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const t = await getTranslations("gifts");
  const [menu, reviews, settings] = await Promise.all([getMenu(), getReviews(), getSettings()]);
  const tr = await getTranslations("reviews");
  const phone = settings.contact.phones[0];
  const gifts = (menu.find((c) => c.slug === "gifts")?.products ?? []).map(toClientProduct);
  const donuts = (menu.find((c) => c.slug === "donuts")?.products ?? []).map(toClientProduct);
  const boxes = gifts.filter((p) => p.boxSize);
  const nameDonut = gifts.find((p) => p.slug === "name-donut");
  const bouquets = gifts.filter((p) => !p.boxSize && p.slug !== "name-donut");

  return (
    <div className="bg-cream">
      <section className="bg-sun">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16">
          <div>
            <p className="font-hand text-xl text-magenta-ink">{t("eyebrow")}</p>
            <h1 className="text-[clamp(1.5rem,2.4vw,2rem)] leading-[1.05]">{t("title")}</h1>
            <p className="mt-4 max-w-xl leading-relaxed">
              {t("pageLead")} <DemoNote />
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#box"
                className="k-key k-key--magenta inline-flex h-12 items-center rounded-xl bg-magenta px-5 font-bold text-white no-underline transition-[background-color,translate,box-shadow] duration-150 ease-out hover:bg-[#c40f72]"
              >
                {t("box.title")}
              </a>
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="k-key k-key--light inline-flex h-12 items-center rounded-xl bg-white px-5 font-bold text-plum no-underline transition-[background-color,translate,box-shadow] duration-150 ease-out hover:bg-blush"
                >
                  {t("callToOrder", {
                    phone: phone.replace(/^\+374(\d{2})(\d{3})(\d{3})$/, "0$1 $2 $3"),
                  })}
                </a>
              ) : null}
            </div>
            {/* Real guest words only, quoted exactly, with name and source. */}
            {reviews.length ? (
              <ul className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
                {reviews.slice(0, 2).map((r) => (
                  <li key={r.id} className="rounded-xl bg-white/70 px-4 py-3">
                    <blockquote
                      lang={r.quoteLocale}
                      className="text-[15px] leading-snug font-semibold"
                    >
                      «{r.quote}»
                    </blockquote>
                    <p className="mt-1 text-xs text-muted">
                      {tr("on", { author: r.author, platform: r.platform })}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="relative mx-auto w-full max-w-[460px] pb-16 sm:pb-20">
            <figure className="ml-auto w-[78%] rotate-2 rounded-[1.75rem] bg-white p-2.5 shadow-lift">
              <Photo
                zoom
                image={imgOrThrow("/images/source/tomsarkgh/yumyum-26.jpg")}
                alt={t("bouquetAlt")}
                loading="eager"
                fetchPriority="high"
                sizes="360px"
                className="aspect-[4/5] w-full rounded-[1.3rem] object-cover"
              />
            </figure>
            {/* The shop's own gift box (client artwork). */}
            <a
              href="#box"
              className="k-giftbox absolute bottom-0 left-0 block w-[62%]"
              aria-label={t("box.title")}
            >
              <Image
                src="/images/box/box-open-donuts.webp"
                alt={t("boxTitle")}
                width={1005}
                height={1100}
                sizes="(min-width: 1024px) 280px, 60vw"
                className="h-auto w-full drop-shadow-[0_16px_18px_rgb(43_10_36/0.35)]"
              />
            </a>
          </div>
        </div>
      </section>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-12 px-4 py-14 sm:px-6 lg:px-8">
        {boxes.length && donuts.length ? <BoxBuilder boxes={boxes} donuts={donuts} /> : null}
        {nameDonut ? <NameDonut product={nameDonut} /> : null}
        {bouquets.length ? (
          <section aria-labelledby="bouquets-title">
            <h2 id="bouquets-title" className="mb-6 text-[clamp(1.2rem,1.8vw,1.5rem)]">
              {t("bouquetsTitle")}
            </h2>
            <GiftGrid products={bouquets} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
