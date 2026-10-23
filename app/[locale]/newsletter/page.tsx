import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DonutIcon } from "@/components/icons/brand";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ status?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("newsletterTitle"), robots: { index: false } };
}

export default async function NewsletterPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { status } = await searchParams;
  const t = await getTranslations("newsletter");
  const tn = await getTranslations("notFound");
  const key = status === "confirmed" || status === "unsubscribed" ? status : "invalid";
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <DonutIcon size={96} />
      <h1 className="mt-6 text-4xl">{t(key)}</h1>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center rounded-full bg-plum px-6 font-semibold text-white"
      >
        {tn("home")}
      </Link>
    </div>
  );
}
