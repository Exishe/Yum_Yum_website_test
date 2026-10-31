import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { DeliveryLinks } from "@/components/DeliveryLinks";
import { getShops, getZones } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { robotsFor } from "@/lib/demo-config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("checkoutTitle"), robots: robotsFor({ index: false }) };
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  const [shops, zones, settings] = await Promise.all([getShops(), getZones(), getSettings()]);
  return (
    <div className="dot-grid">
      <div className="mx-auto max-w-[1280px] px-4 pt-10 pb-20 sm:px-6 lg:px-8">
        <h1 className="text-[clamp(2.08rem,4.32vw,3.02rem)] leading-none">{t("title")}</h1>
        <p className="mt-3 max-w-xl text-lg text-plum/85">{t("lead")}</p>
        <div className="mt-8">
          <CheckoutForm shops={shops} zones={zones} rules={settings.ordering} />
        </div>
        <DeliveryLinks />
      </div>
    </div>
  );
}
