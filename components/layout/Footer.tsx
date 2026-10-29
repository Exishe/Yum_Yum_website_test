import {
  ArrowUpRight,
  FacebookLogo,
  InstagramLogo,
  TiktokLogo,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { MenuCategory, PublicShop } from "@/lib/catalog";
import { formatPhone } from "@/lib/format";
import { t as pick } from "@/lib/localized";
import type { SiteSettings } from "@/lib/settings";
import { CookieSettingsButton } from "./CookieConsent";
import { LanguageSwitch } from "./LanguageSwitch";
import { NewsletterForm } from "./NewsletterForm";

function hoursLabel(shop: PublicShop, mall: string, daily: string) {
  if (!shop.hours) return mall;
  const first = shop.hours[1];
  const same = shop.hours.every(
    (h) => h && first && h.open === first.open && h.close === first.close,
  );
  return same && first ? `${first.open}–${first.close}` : daily;
}

function PayBadge({ children }: { children: React.ReactNode }) {
  return (
    <li className="grid h-8 min-w-14 place-items-center rounded-md bg-white px-2.5 text-[11px] font-extrabold tracking-wide text-plum">
      {children}
    </li>
  );
}

export async function Footer({
  categories,
  shops,
  settings,
}: {
  categories: MenuCategory[];
  shops: PublicShop[];
  settings: SiteSettings;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const tc = await getTranslations("common");
  const ts = await getTranslations("shops");
  const { contact, legal } = settings;
  const year = new Date().getFullYear();
  const legalDetails = [legal.companyName, legal.taxId, legal.address].filter(Boolean).join(", ");
  const link = "text-white/80 transition-colors hover:text-sun";

  return (
    <footer className="on-dark bg-plum text-white">
      <div className="mx-auto max-w-[1440px] px-4 pt-16 pb-28 sm:px-6 lg:px-8 lg:pb-10">
        <div className="grid grid-cols-1 gap-12 border-b border-white/12 pb-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Image
              src="/images/brand/logo-240.png"
              alt="YUM-YUM Donuts"
              width={84}
              height={84}
              className="size-[84px] rounded-full"
            />
            <div className="max-w-md">
              <p className="font-display text-4xl leading-none" lang="en">
                Donut give up.
              </p>
              <p className="mt-4 text-white/80">{t("about")}</p>
            </div>
          </div>
          <div>
            <h2 className="text-2xl">{t("newsletter")}</h2>
            <p className="mt-2 text-sm text-white/75">{t("newsletterLead")}</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <nav aria-labelledby="f-shop">
            <h2
              id="f-shop"
              className="mb-4 font-sans text-xs font-bold tracking-[0.18em] text-sun uppercase"
            >
              {t("shop")}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={{ pathname: "/menu", query: { category: c.slug } }} className={link}>
                    {pick(c.name, locale)}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/gifts" className={link}>
                  {tn("bouquets")}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="mb-4 font-sans text-xs font-bold tracking-[0.18em] text-sun uppercase">
              {t("visit")}
            </h2>
            <ul className="flex flex-col gap-3 text-sm">
              {shops.map((s) => (
                <li key={s.slug} className="flex items-baseline justify-between gap-3">
                  <span>
                    <span className="block font-semibold text-white">{pick(s.name, locale)}</span>
                    <span className="text-white/70">
                      {hoursLabel(s, tc("mallHours"), tc("everyDay"))}
                    </span>
                  </span>
                  {s.googleMapsUrl ? (
                    <a
                      href={s.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 shrink-0 items-center gap-1 text-white/80 hover:text-sun"
                      aria-label={`${ts("directionsTo", { name: pick(s.name, locale) })} (${tc("newTab")})`}
                    >
                      {ts("directions")} <ArrowUpRight size={14} aria-hidden />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 font-sans text-xs font-bold tracking-[0.18em] text-sun uppercase">
              {t("contact")}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {contact.phones.map((p) => (
                <li key={p}>
                  <a href={`tel:${p}`} className={`${link} tabular-nums`}>
                    {formatPhone(p)}
                  </a>
                </li>
              ))}
              <li>
                <Link href="/contact" className={link}>
                  {t("contactForm")}
                </Link>
              </li>
            </ul>
            <p className="mt-6 mb-3 text-xs font-bold tracking-[0.18em] text-white/60 uppercase">
              {t("social")}
            </p>
            <ul className="flex gap-2">
              {contact.instagram ? (
                <li>
                  <a
                    href={`https://www.instagram.com/${contact.instagram}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Instagram @${contact.instagram} (${tc("newTab")})`}
                    className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-magenta"
                  >
                    <InstagramLogo size={22} />
                  </a>
                </li>
              ) : null}
              {contact.facebook ? (
                <li>
                  <a
                    href={`https://www.facebook.com/${contact.facebook}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Facebook ${contact.facebook} (${tc("newTab")})`}
                    className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-magenta"
                  >
                    <FacebookLogo size={22} />
                  </a>
                </li>
              ) : null}
              {contact.whatsapp ? (
                <li>
                  <a
                    href={`https://wa.me/${contact.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`WhatsApp (${tc("newTab")})`}
                    className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-magenta"
                  >
                    <WhatsappLogo size={22} />
                  </a>
                </li>
              ) : null}
              {contact.tiktok ? (
                <li>
                  <a
                    href={`https://www.tiktok.com/@${contact.tiktok}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`TikTok (${tc("newTab")})`}
                    className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-magenta"
                  >
                    <TiktokLogo size={22} />
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          <nav aria-labelledby="f-company">
            <h2
              id="f-company"
              className="mb-4 font-sans text-xs font-bold tracking-[0.18em] text-sun uppercase"
            >
              {t("company")}
            </h2>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href="/story" className={link}>
                  {t("storyLink")}
                </Link>
              </li>
              <li>
                <Link href="/shops" className={link}>
                  {t("allShops")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className={link}>
                  {t("press")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-6 border-t border-white/12 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <LanguageSwitch />
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold tracking-[0.18em] text-white/60 uppercase">
              {t("pay")}
            </span>
            <ul className="flex flex-wrap gap-2" aria-label={t("pay")}>
              <PayBadge>VISA</PayBadge>
              <PayBadge>Mastercard</PayBadge>
              <PayBadge>ArCa</PayBadge>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 text-xs text-white/65 lg:flex-row lg:items-center lg:justify-between">
          <p>
            {t("rights", { year })}
            <span className="mx-2" aria-hidden>
              ·
            </span>
            {t("legal", { details: legalDetails || t("legalPending") })}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <Link href="/privacy" className="hover:text-white">
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                {t("terms")}
              </Link>
            </li>
            <li>
              {process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT ? (
                <CookieSettingsButton className="hover:text-white">
                  {t("cookies")}
                </CookieSettingsButton>
              ) : (
                t("cookiesNote")
              )}
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
