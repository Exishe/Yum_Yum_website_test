import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Catalog } from "@/components/catalog/Catalog";
import { DeliveryLinks } from "@/components/DeliveryLinks";
import { JsonLd, menuJsonLd } from "@/components/JsonLd";
import type { Locale } from "@/i18n/routing";
import { getMenu } from "@/lib/catalog";
import { toClientCategories } from "@/lib/client-products";
import { alternates } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ category?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("menuTitle"),
    description: t("menuDescription"),
    alternates: alternates(locale as Locale, "/menu"),
  };
}

export default async function MenuPage({ params, searchParams }: Props) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const { category } = await searchParams;
  const menu = await getMenu();
  return (
    <div className="dot-grid">
      <JsonLd data={menuJsonLd(menu, locale)} />
      <div className="mx-auto max-w-[1440px] px-4 pt-10 pb-20 sm:px-6 lg:px-8 lg:pt-14">
        <Catalog categories={toClientCategories(menu)} initialSlug={category} mode="full" />
        <DeliveryLinks />
      </div>
    </div>
  );
}
