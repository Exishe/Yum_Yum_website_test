import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BoxBuilder } from "@/components/gifts/BoxBuilder";
import { GiftGrid } from "@/components/gifts/GiftGrid";
import { NameDonut } from "@/components/gifts/NameDonut";
import { Photo } from "@/components/ui/Photo";
import type { Locale } from "@/i18n/routing";
import { getMenu } from "@/lib/catalog";
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
  const menu = await getMenu();
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
            <p className="font-hand text-2xl text-magenta-ink">{t("eyebrow")}</p>
            <h1 className="text-[clamp(3rem,8vw,6rem)] leading-[0.92]">{t("title")}</h1>
            <p className="mt-5 max-w-xl text-lg">
              {t("pageLead")} <DemoNote />
            </p>
          </div>
          <figure className="mx-auto w-full max-w-[380px] rotate-2 rounded-[1.75rem] bg-white p-2.5 shadow-lift">
            <Photo
              image={imgOrThrow("/images/source/tomsarkgh/yumyum-26.jpg")}
              alt={t("bouquetAlt")}
              loading="eager"
              fetchPriority="high"
              sizes="380px"
              className="aspect-[4/5] w-full rounded-[1.3rem] object-cover"
            />
          </figure>
        </div>
      </section>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-12 px-4 py-14 sm:px-6 lg:px-8">
        {boxes.length && donuts.length ? <BoxBuilder boxes={boxes} donuts={donuts} /> : null}
        {nameDonut ? <NameDonut product={nameDonut} /> : null}
        {bouquets.length ? (
          <section aria-labelledby="bouquets-title">
            <h2 id="bouquets-title" className="mb-6 text-[clamp(2rem,4.5vw,3.2rem)]">
              {t("bouquetsTitle")}
            </h2>
            <GiftGrid products={bouquets} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
