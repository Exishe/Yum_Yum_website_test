import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/format";

const UPDATED = new Date("2026-10-23T12:00:00Z");

export async function LegalPage({
  kind,
  locale,
  title,
}: {
  kind: "privacy" | "terms";
  locale: Locale;
  title: string;
}) {
  const t = await getTranslations("legal");
  const sections = t.raw(kind) as Array<{ h: string; p: string }>;
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-[clamp(1.4rem,5.4vw,2.88rem)] leading-none">{title}</h1>
      <p className="mt-3 text-sm text-muted">
        {t("updated", { date: formatDate(UPDATED, locale, { year: "numeric" }) })}
      </p>
      {sections.map((s) => (
        <section key={s.h} className="mt-8">
          <h2 className="font-sans text-xl font-bold">{s.h}</h2>
          <p className="mt-2 leading-relaxed text-plum/90">
            {s.p.replace("{days}", String(env.retentionDays))}
          </p>
        </section>
      ))}
    </article>
  );
}
