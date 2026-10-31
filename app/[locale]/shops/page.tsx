import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { ShopPicker } from "@/components/shops/ShopPicker";
import { JsonLd, organizationJsonLd } from "@/components/JsonLd";
import type { Locale } from "@/i18n/routing";
import { getShops, type PublicShop } from "@/lib/catalog";
import { img } from "@/lib/images";
import { t as pick } from "@/lib/localized";
import { alternates } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("shopsTitle"),
    description: t("shopsDescription"),
    alternates: alternates(locale as Locale, "/shops"),
  };
}

async function HoursTable({ shop }: { shop: PublicShop }) {
  const t = await getTranslations("shops");
  const locale = (await getLocale()) as Locale;
  const days = t.raw("weekdays") as string[];
  if (!shop.hours) return <p className="text-sm text-muted">{pick(shop.hoursNote, locale)}</p>;
  // Monday first, as people read a week in Armenia.
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{t("hours")}</caption>
      <tbody>
        {order.map((d) => {
          const h = shop.hours![d];
          return (
            <tr key={d} className="border-b border-line last:border-0">
              <th scope="row" className="py-1.5 text-left font-medium">
                {days[d]}
              </th>
              <td className="py-1.5 text-right tabular-nums">{h ? `${h.open}–${h.close}` : "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default async function ShopsPage({ params }: Props) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const t = await getTranslations("shops");
  const [shops, settings] = await Promise.all([getShops(), getSettings()]);
  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-8 pb-20 sm:px-6 lg:px-8 lg:pt-12">
      <JsonLd data={organizationJsonLd(shops, settings, locale)} />
      <ShopPicker heading="h1" shops={shops.map((s) => ({ ...s, img: img(s.image) }))} />
      <p className="mt-10 max-w-2xl">{t("pageLead")}</p>
      <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shops.map((s) => (
          <li key={s.slug} className="rounded-[var(--radius-card)] bg-white p-5 shadow-card">
            <h2 className="text-2xl">{pick(s.name, locale)}</h2>
            <p className="mt-1 text-sm text-muted">{pick(s.address, locale)}</p>
            <div className="mt-4">
              <HoursTable shop={s} />
            </div>
            <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
              {s.googleMapsUrl ? (
                <a
                  href={s.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center underline-offset-2 hover:underline"
                >
                  {t("googleMaps")}
                </a>
              ) : null}
              {s.yandexMapsUrl ? (
                <a
                  href={s.yandexMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center underline-offset-2 hover:underline"
                >
                  {t("yandexMaps")}
                </a>
              ) : null}
              {s.twoGisUrl ? (
                <a
                  href={s.twoGisUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center underline-offset-2 hover:underline"
                >
                  {t("twoGis")}
                </a>
              ) : null}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
