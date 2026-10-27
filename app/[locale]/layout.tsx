import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { preload } from "react-dom";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import "../globals.css";
import { Banner } from "@/components/layout/Banner";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { LazyCartDrawer } from "@/components/layout/LazyCartDrawer";
import { Footer } from "@/components/layout/Footer";
import { Header, type NavCategory } from "@/components/layout/Header";
import { StickyOrderBar } from "@/components/layout/StickyOrderBar";
import { routing, type Locale } from "@/i18n/routing";
import { getMenu, getShops, minPrice } from "@/lib/catalog";
import { env } from "@/lib/env";
import { fontVariables } from "@/lib/fonts";
import { formatAmd, formatPhone } from "@/lib/format";
import { img } from "@/lib/images";
import { t as pick } from "@/lib/localized";
import { alternates } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { SiteProvider } from "@/components/SiteContext";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: t("title"), template: `%s · ${t("siteName")}` },
    description: t("description"),
    applicationName: t("siteName"),
    alternates: alternates(locale as Locale, "/"),
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      locale: locale === "hy" ? "hy_AM" : locale === "ru" ? "ru_RU" : "en_GB",
      images: [{ url: "/images/brand/og.jpg", width: 1200, height: 630, alt: t("ogAlt") }],
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
    icons: { apple: "/images/brand/apple-touch-icon.png" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // Preload only the font files this language needs.
  const fontFiles: Record<string, string[]> = {
    hy: ["/fonts/noto-sans-armenian-v47.woff2"],
    ru: ["/fonts/rubik-cyrillic-v31.woff2", "/fonts/onest-cyrillic-v11.woff2"],
    en: [],
  };
  for (const href of fontFiles[locale] ?? []) {
    preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }

  const [menu, shops, settings, messages, h, tc] = await Promise.all([
    getMenu(),
    getShops(),
    getSettings(),
    getMessages(),
    headers(),
    getTranslations("common"),
  ]);
  const nonce = h.get("x-nonce") ?? undefined;

  const categories: NavCategory[] = menu
    .filter((c) => c.inMenu)
    .map((c) => {
      const from = minPrice(c);
      return {
        slug: c.slug,
        name: pick(c.name, locale),
        count: c.products.length,
        from: from != null ? formatAmd(from, locale) : null,
        image: img(c.image),
        imageAlt: pick(c.name, locale),
      };
    });
  const phone = settings.contact.phones[0] ?? "+37433301574";
  // Send the browser only the texts that client components use.
  const clientNamespaces = [
    "common",
    "nav",
    "lang",
    "banner",
    "hero",
    "catalog",
    "gifts",
    "cart",
    "checkout",
    "errors",
    "cookies",
    "footer",
    "contact",
    "shops",
    "reviews",
  ];
  const all = messages as Record<string, unknown>;
  const clientMessages = Object.fromEntries(clientNamespaces.map((k) => [k, all[k]]));

  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <body className="min-h-dvh">
        <NextIntlClientProvider messages={clientMessages as typeof messages}>
          <a
            href="#main"
            className="sr-only z-[100] rounded-full bg-sun px-5 py-3 font-semibold text-plum focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            {tc("skip")}
          </a>
          <SiteProvider
            value={{
              phone,
              phoneDisplay: formatPhone(phone, "local"),
              whatsapp: settings.contact.whatsapp,
              whatsappConfirmed: settings.contact.whatsappConfirmed,
              demoNotes: settings.demoNotes.enabled,
            }}
          >
            {settings.banner.enabled ? <Banner text={pick(settings.banner.text, locale)} /> : null}
            <Header
              categories={categories}
              phone={phone}
              phoneDisplay={formatPhone(phone, "local")}
            />
            <main id="main" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <Footer categories={menu.filter((c) => c.inMenu)} shops={shops} settings={settings} />
            <LazyCartDrawer />
            <StickyOrderBar shops={shops.map((s) => ({ id: s.id, name: pick(s.name, locale) }))} />
            <CookieConsent
              nonce={nonce}
              analyticsSrc={process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT}
              analyticsDomain={process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN}
            />
          </SiteProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
