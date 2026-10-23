import { headers } from "next/headers";
import type { Locale } from "@/i18n/routing";
import type { MenuCategory, PublicShop } from "@/lib/catalog";
import { env } from "@/lib/env";
import { t } from "@/lib/localized";
import type { SiteSettings } from "@/lib/settings";

/** Renders structured data. `<` is escaped so the JSON can never close the script tag. */
export async function JsonLd({ data }: { data: object }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function organizationJsonLd(shops: PublicShop[], settings: SiteSettings, locale: Locale) {
  const url = `${env.siteUrl}/${locale}`;
  const sameAs = [
    settings.contact.facebook && `https://www.facebook.com/${settings.contact.facebook}/`,
    settings.contact.instagram && `https://www.instagram.com/${settings.contact.instagram}/`,
  ].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${env.siteUrl}/#org`,
        name: "YUM-YUM Donuts",
        url,
        logo: `${env.siteUrl}/images/brand/logo-512.png`,
        foundingDate: String(settings.foundedYear),
        telephone: settings.contact.phones[0],
        sameAs,
      },
      ...shops.map((s) => ({
        "@type": ["Bakery", "CafeOrCoffeeShop"],
        "@id": `${env.siteUrl}/#shop-${s.slug}`,
        name: `YUM-YUM Donuts, ${t(s.name, "en")}`,
        parentOrganization: { "@id": `${env.siteUrl}/#org` },
        url,
        image: s.image ? `${env.siteUrl}${s.image}` : undefined,
        telephone: s.phone ?? settings.contact.phones[0],
        priceRange: "֏",
        servesCuisine: ["Donuts", "Coffee", "Desserts"],
        paymentAccepted: "Cash, Visa, MasterCard, ArCa",
        currenciesAccepted: "AMD",
        hasMenu: `${env.siteUrl}/${locale}/menu`,
        address: {
          "@type": "PostalAddress",
          streetAddress: t(s.address, locale),
          addressLocality: "Yerevan",
          addressCountry: "AM",
        },
        geo: s.lat && s.lng ? { "@type": "GeoCoordinates", latitude: s.lat, longitude: s.lng } : undefined,
        openingHoursSpecification: s.hours
          ? s.hours.flatMap((h, i) =>
              h ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: DAYS[i], opens: h.open, closes: h.close }] : [],
            )
          : undefined,
      })),
    ],
  };
}

export function menuJsonLd(menu: MenuCategory[], locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "YUM-YUM Donuts",
    inLanguage: locale,
    hasMenuSection: menu.map((c) => ({
      "@type": "MenuSection",
      name: t(c.name, locale),
      hasMenuItem: c.products.map((p) => ({
        "@type": "MenuItem",
        name: t(p.name, locale),
        description: p.description ? t(p.description, locale) : undefined,
        image: p.image ? `${env.siteUrl}${p.image}` : undefined,
        offers: {
          "@type": "Offer",
          price: p.priceAmd,
          priceCurrency: "AMD",
          availability: p.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
      })),
    })),
  };
}
