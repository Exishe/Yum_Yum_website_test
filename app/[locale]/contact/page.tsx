import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/ContactForm";
import type { Locale } from "@/i18n/routing";
import { formatPhone } from "@/lib/format";
import { alternates } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("contactTitle"), alternates: alternates(locale as Locale, "/contact") };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const { contact } = await getSettings();
  return (
    <div className="dot-grid">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <h1 className="text-[clamp(1.91rem,4.28vw,2.75rem)] leading-none">{t("title")}</h1>
          <p className="mt-4">{t("lead")}</p>
          <h2 className="mt-8 font-sans text-sm font-bold tracking-[0.18em] text-magenta-ink uppercase">
            {t("phones")}
          </h2>
          <ul className="mt-2 space-y-1">
            {contact.phones.map((p) => (
              <li key={p}>
                <a
                  href={`tel:${p}`}
                  className="inline-flex min-h-11 items-center font-display text-3xl hover:text-magenta-ink"
                >
                  {formatPhone(p)}
                </a>
              </li>
            ))}
          </ul>
          <h2 className="mt-6 font-sans text-sm font-bold tracking-[0.18em] text-magenta-ink uppercase">
            {t("socials")}
          </h2>
          <ul className="mt-2 space-y-1 font-semibold">
            {contact.instagram ? (
              <li>
                <a
                  href={`https://www.instagram.com/${contact.instagram}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center underline-offset-2 hover:underline"
                >
                  Instagram @{contact.instagram}
                </a>
              </li>
            ) : null}
            {contact.facebook ? (
              <li>
                <a
                  href={`https://www.facebook.com/${contact.facebook}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center underline-offset-2 hover:underline"
                >
                  facebook.com/{contact.facebook}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
