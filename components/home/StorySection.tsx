import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import { Photo } from "@/components/ui/Photo";
import { Link } from "@/i18n/navigation";
import type { ImageInfo } from "@/lib/images";

export async function StorySection({
  photos,
}: {
  photos: { interior: ImageInfo; counter: ImageInfo; muffins: ImageInfo; cake: ImageInfo };
}) {
  const t = await getTranslations("story");
  return (
    <section
      aria-labelledby="story-title"
      className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr_0.6fr]">
        <div className="lg:pr-6">
          <p className="font-hand text-2xl text-magenta-ink">{t("eyebrow")}</p>
          <h2 id="story-title" className="mt-1 text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.02]">
            {t("title")}
          </h2>
          <p className="mt-5 text-plum/85">{t("body")}</p>
          <dl className="mt-7 flex gap-4">
            <div>
              <dt className="sr-only">{t("statHours")}</dt>
              <dd className="font-display text-4xl text-magenta">{t("statHoursValue")}</dd>
              <dd className="text-sm">{t("statHours")}</dd>
            </div>
          </dl>
          <Link
            href="/story"
            className="mt-7 inline-flex min-h-11 items-center gap-1 font-semibold underline decoration-2 underline-offset-4 hover:text-magenta-ink"
          >
            {t("readMore")} <ArrowRight size={16} weight="bold" aria-hidden />
          </Link>
        </div>
        <Photo
          image={photos.interior}
          alt={t("interiorAlt")}
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="aspect-square w-full rounded-[var(--radius-xl2)] object-cover"
        />
        <Photo
          image={photos.counter}
          alt={t("counterAlt")}
          sizes="(min-width: 1024px) 22vw, 100vw"
          className="aspect-[4/3] w-full rounded-[var(--radius-xl2)] object-cover lg:aspect-square"
        />
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Photo
          image={photos.muffins}
          alt={t("muffinsAlt")}
          sizes="(min-width: 640px) 50vw, 100vw"
          className="aspect-[2/1] w-full rounded-[var(--radius-xl2)] object-cover"
        />
        <Photo
          image={photos.cake}
          alt={t("cakeAlt")}
          sizes="(min-width: 640px) 50vw, 100vw"
          className="aspect-[2/1] w-full rounded-[var(--radius-xl2)] object-cover"
        />
      </div>
    </section>
  );
}
