import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BoxBuilder } from "@/components/gifts/BoxBuilder";
import { Link } from "@/i18n/navigation";
import { Catalog } from "@/components/catalog/Catalog";
import { BuildDonut } from "@/components/home/BuildDonut";
import { HowToOrder } from "@/components/home/HowToOrder";
import { Hero, type HeroChoice } from "@/components/home/Hero";
import { Perks } from "@/components/home/Perks";
import { PhotoStrip } from "@/components/home/PhotoStrip";
import { Reviews } from "@/components/home/Reviews";
import { Spotted } from "@/components/home/Spotted";
import { StorySection } from "@/components/home/StorySection";
import { Ticker } from "@/components/home/Ticker";
import { ShopPicker } from "@/components/shops/ShopPicker";
import { JsonLd, organizationJsonLd } from "@/components/JsonLd";
import type { Locale } from "@/i18n/routing";
import { getMenu, getReviews, getShops } from "@/lib/catalog";
import { toClientCategories, toClientProduct } from "@/lib/client-products";
import { formatPhone } from "@/lib/format";
import { img, imgOrThrow } from "@/lib/images";
import { getSettings } from "@/lib/settings";

const T = "/images/source/tomsarkgh";
const Y = "/images/source/yandex";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const [menu, shops, reviews, settings] = await Promise.all([
    getMenu(),
    getShops(),
    getReviews(),
    getSettings(),
  ]);

  const all = menu.flatMap((c) => c.products);
  const bySlug = (slug: string) => {
    const p = all.find((x) => x.slug === slug);
    return p ? toClientProduct(p) : null;
  };

  // The gift box builder: boxes from the gifts category, donuts to fill them.
  const giftBoxes = (menu.find((c) => c.slug === "gifts")?.products ?? [])
    .filter((p) => p.boxSize)
    .map(toClientProduct);
  const boxDonuts = (menu.find((c) => c.slug === "donuts")?.products ?? []).map(toClientProduct);
  const [tg, tn, te] = await Promise.all([
    getTranslations("gifts"),
    getTranslations("nav"),
    getTranslations("events"),
  ]);

  const choices: HeroChoice[] = [
    {
      key: "glazed",
      image: imgOrThrow(`${T}/yumyum-19.jpg`),
      thumb: imgOrThrow(`${T}/yumyum-19.jpg`),
      product: bySlug("donut-chocolate-rainbow"),
      tab: "donuts",
      href: { pathname: "/menu", query: { category: "donuts" } },
    },
    {
      key: "cold",
      image: imgOrThrow(`${T}/yumyum-18.jpg`),
      thumb: imgOrThrow(`${T}/yumyum-24.jpg`),
      product: bySlug("iced-latte"),
      tab: "iced",
      href: { pathname: "/menu", query: { category: "iced" } },
    },
    {
      key: "gift",
      image: imgOrThrow(`${T}/yumyum-26.jpg`),
      thumb: imgOrThrow(`${T}/yumyum-26.jpg`),
      product: bySlug("bouquet-n2"),
      tab: "gifts",
      href: "/gifts",
    },
    {
      key: "cake",
      image: imgOrThrow(`${T}/yumyum-15.jpg`),
      thumb: imgOrThrow(`${T}/yumyum-15.jpg`),
      product: bySlug("cappuccino"),
      tab: "bakes",
      href: { pathname: "/menu", query: { category: "bakes" } },
    },
  ];

  // The rating labels name a shop in English ("Mashtots 35"); show the shop's own name.
  const ratingsIn = (l: Locale) => {
    const local = (label?: string) => shops.find((sh) => sh.name.en === label)?.name[l] ?? label;
    const r = settings.ratings;
    return {
      ...r,
      yandex: r.yandex && { ...r.yandex, label: local(r.yandex.label) },
      google: r.google && { ...r.google, label: local(r.google.label) },
    };
  };

  const phone = settings.contact.phones[0] ?? "+37433301574";
  const phoneDisplay = formatPhone(phone, "local");
  const strip = [
    `${T}/yumyum-19.jpg`,
    `${T}/yumyum-18.jpg`,
    `${T}/yumyum-26.jpg`,
    `${T}/yumyum-14.jpg`,
    `${T}/yumyum-25.jpg`,
    `${T}/yumyum-13.jpg`,
    `${Y}/showcase/showcase-02.jpg`,
    `${T}/yumyum-15.jpg`,
    `${Y}/interior/interior-03.jpg`,
    `${T}/yumyum-20.jpg`,
  ].map(imgOrThrow);

  return (
    <>
      <JsonLd data={organizationJsonLd(shops, settings, locale)} />
      <Hero choices={choices} phone={phone} phoneDisplay={phoneDisplay} />
      <BuildDonut
        products={Object.fromEntries(
          [
            "donut-chocolate",
            "donut-chocolate-rainbow",
            "donut-caramel",
            "donut-white-chocolate",
            "donut-strawberry-rainbow",
            "donut-peach-rainbow",
            "donut-blue-bali-rainbow",
            "donut-lemon",
            "donut-pistachio-king",
          ].map((slug) => [slug, bySlug(slug)]),
        )}
      />
      <PhotoStrip photos={strip} />
      <Perks />
      <HowToOrder />
      <section
        aria-labelledby="menu-title"
        className="mx-auto max-w-[1440px] px-4 pt-14 pb-6 sm:px-6 lg:px-8"
      >
        <Catalog categories={toClientCategories(menu)} mode="home" />
      </section>
      {/* Gifts: pack your own box, with the YUM-YUM donut keeping you company. */}
      <section aria-label={tg("title")} className="bg-sun">
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          {giftBoxes.length && boxDonuts.length ? (
            <BoxBuilder boxes={giftBoxes} donuts={boxDonuts} />
          ) : null}
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/gifts"
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold underline decoration-2 underline-offset-4 hover:text-magenta-ink"
            >
              {tn("bouquets")} <ArrowRight size={16} weight="bold" aria-hidden />
            </Link>
            <Link
              href="/events"
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold underline decoration-2 underline-offset-4 hover:text-magenta-ink"
            >
              {te("cta")} <ArrowRight size={16} weight="bold" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
      <StorySection
        photos={{
          interior: imgOrThrow(`${T}/yumyum-13.jpg`),
          counter: imgOrThrow(`${T}/yumyum-14.jpg`),
          muffins: imgOrThrow(`${T}/yumyum-15.jpg`),
          cake: imgOrThrow(`${T}/yumyum-18.jpg`),
        }}
      />
      <Ticker />
      <Spotted
        instagram={settings.contact.instagram}
        photos={[
          { key: "wall", image: imgOrThrow(`${T}/yumyum-17.jpg`) },
          { key: "shake", image: imgOrThrow(`${T}/yumyum-20.jpg`) },
          { key: "neon", image: imgOrThrow(`${T}/yumyum-23.jpg`) },
          { key: "mall", image: imgOrThrow(`${T}/yumyum-25.jpg`) },
          { key: "togo", image: imgOrThrow(`${T}/yumyum-24.jpg`) },
        ]}
      />
      <Reviews
        // Reviews written in the page's language come first.
        reviews={[...reviews].sort(
          (a, b) => Number(b.quoteLocale === locale) - Number(a.quoteLocale === locale),
        )}
        ratings={ratingsIn(locale)}
      />
      <div className="mx-auto max-w-[1440px] px-4 pb-20 sm:px-6 lg:px-8">
        <ShopPicker shops={shops.map((s) => ({ ...s, img: img(s.image) }))} />
      </div>
    </>
  );
}
