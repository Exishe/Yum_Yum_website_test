import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Photo } from "@/components/ui/Photo";
import type { Locale } from "@/i18n/routing";
import { imgOrThrow } from "@/lib/images";
import { alternates } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("storyTitle"),
    description: t("storyDescription"),
    alternates: alternates(locale as Locale, "/story"),
  };
}

export default async function StoryPage({ params }: Props) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const t = await getTranslations("story");
  const T = "/images/source/tomsarkgh";
  const timeline = [
    { year: "1997", text: t("page.t1997") },
    { year: "2010", text: t("page.t2010") },
    { year: String(new Date().getFullYear()), text: t("page.tToday") },
  ];
  return (
    <article className="dot-grid">
      <header className="mx-auto max-w-[1440px] px-4 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <p className="font-hand text-xl text-magenta-ink">{t("eyebrow")}</p>
        <h1 className="max-w-4xl text-[clamp(1.91rem,3.98vw,3.21rem)] leading-[0.95]">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed">{t("page.lead")}</p>
      </header>
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <Photo
          image={imgOrThrow(`${T}/yumyum-13.jpg`)}
          alt={t("interiorAlt")}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="aspect-square w-full rounded-[var(--radius-xl2)] object-cover"
        />
        <div className="flex flex-col gap-5 leading-relaxed text-plum/90 lg:pt-6">
          <p>{t("page.p1")}</p>
          <p>{t("page.p2")}</p>
          <p className="rounded-2xl bg-sun-soft p-5 font-hand text-xl leading-snug text-plum">
            {t("page.p3")}
          </p>
          <p>{t("page.p4")}</p>
          <p className="text-sm text-muted">{t("page.source")}</p>
        </div>
      </div>
      <section aria-labelledby="timeline" className="bg-plum py-14 text-white">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <h2 id="timeline" className="text-[clamp(1.4rem,5.76vw,1.62rem)]">
            {t("page.timeline")}
          </h2>
          <ol className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {timeline.map((e) => (
              <li key={e.year} className="border-t-2 border-sun pt-4">
                <p className="font-display text-4xl text-sun">{e.year}</p>
                <p className="mt-2 text-white/85">{e.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-4 py-14 sm:grid-cols-3 sm:px-6 lg:px-8">
        {[
          [`${T}/yumyum-14.jpg`, t("counterAlt")],
          [`${T}/yumyum-15.jpg`, t("muffinsAlt")],
          [`${T}/yumyum-16.jpg`, t("cakeAlt")],
        ].map(([src, alt]) => (
          <Photo
            key={src}
            image={imgOrThrow(src!)}
            alt={alt!}
            sizes="(min-width: 640px) 33vw, 100vw"
            className="aspect-[4/3] w-full rounded-[var(--radius-xl2)] object-cover"
          />
        ))}
      </div>
    </article>
  );
}
