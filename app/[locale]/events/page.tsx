import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EventForm } from "@/components/EventForm";
import { Photo } from "@/components/ui/Photo";
import type { Locale } from "@/i18n/routing";
import { imgOrThrow } from "@/lib/images";
import { alternates } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

const T = "/images/source/tomsarkgh";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("eventsTitle"), alternates: alternates(locale as Locale, "/events") };
}

export default async function EventsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("events");
  const cards = [
    { key: "boxes", image: imgOrThrow(`${T}/yumyum-19.jpg`) },
    { key: "bouquets", image: imgOrThrow(`${T}/yumyum-26.jpg`) },
    { key: "table", image: imgOrThrow(`${T}/yumyum-15.jpg`) },
  ] as const;
  const steps = t.raw("steps") as string[];

  return (
    <div className="dot-grid">
      <div className="mx-auto grid max-w-[1300px] grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="min-w-0">
          <p className="font-hand text-xl text-magenta-ink">{t("eyebrow")}</p>
          <h1 className="mt-1 text-[clamp(1.91rem,4.28vw,2.75rem)] leading-none">{t("title")}</h1>
          <p className="mt-4 max-w-xl leading-relaxed text-plum/85">{t("lead")}</p>

          <ul data-reveal-group className="mt-8 grid gap-4 sm:grid-cols-3">
            {cards.map((c) => (
              <li
                key={c.key}
                className="overflow-hidden rounded-[var(--radius-card)] bg-white shadow-card"
              >
                <Photo
                  zoom
                  image={c.image}
                  alt=""
                  sizes="(min-width: 1024px) 220px, (min-width: 640px) 33vw, 100vw"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-4">
                  <h2 className="font-sans text-base font-bold">{t(`cards.${c.key}.title`)}</h2>
                  <p className="mt-1 text-sm text-muted">{t(`cards.${c.key}.text`)}</p>
                </div>
              </li>
            ))}
          </ul>

          <h2 className="mt-10 text-2xl leading-tight">{t("how")}</h2>
          <ol data-reveal-group className="mt-4 grid gap-3 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s} className="flex items-start gap-3 rounded-2xl bg-white/70 p-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sun font-bold">
                  {i + 1}
                </span>
                <span className="text-sm leading-snug font-semibold">{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <EventForm />
        </div>
      </div>
    </div>
  );
}
