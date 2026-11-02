import { setRequestLocale } from "next-intl/server";
import { Catalog } from "@/components/catalog/Catalog";
import { DonutStage } from "@/components/home/DonutStage";
import { HowToOrder } from "@/components/home/HowToOrder";
import { GiftsSection } from "@/components/home/GiftsSection";
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
  const minIn = (pred: (p: (typeof all)[number]) => boolean) => {
    const prices = all.filter(pred).map((p) => p.priceAmd);
    return prices.length ? Math.min(...prices) : null;
  };

  // A box of n: the box itself plus the n cheapest donuts.
  const boxFrom = (n: number) => {
    const box = all.find((p) => p.boxSize === n);
    const donuts = (menu.find((c) => c.slug === "donuts")?.products ?? [])
      .map((p) => p.priceAmd)
      .sort((a, b) => a - b);
    return box && donuts.length ? box.priceAmd + n * donuts[0]! : null;
  };

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
      <PhotoStrip photos={strip} />
      <Perks />
      <HowToOrder />
      <section
        aria-labelledby="menu-title"
        className="mx-auto max-w-[1440px] px-4 pt-14 pb-6 sm:px-6 lg:px-8"
      >
        <Catalog categories={toClientCategories(menu)} mode="home" />
      </section>
      <DonutStage />
      <GiftsSection
        bouquet={imgOrThrow(`${T}/yumyum-26.jpg`)}
        box={imgOrThrow(`${T}/yumyum-19.jpg`)}
        prices={{
          bouquet: minIn((p) => p.slug.startsWith("bouquet")),
          composition: minIn((p) => p.slug.startsWith("composition")),
          box: boxFrom(6),
        }}
        phone={phone}
        phoneDisplay={phoneDisplay}
      />
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
