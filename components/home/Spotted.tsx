import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import { Photo } from "@/components/ui/Photo";
import type { ImageInfo } from "@/lib/images";

export type SpottedPhoto = { key: "wall" | "shake" | "neon" | "mall" | "togo"; image: ImageInfo };

export async function Spotted({
  photos,
  instagram,
}: {
  photos: SpottedPhoto[];
  instagram: string | null;
}) {
  const t = await getTranslations("spotted");
  const tc = await getTranslations("common");
  const href = instagram ? `https://www.instagram.com/${instagram}/` : null;
  return (
    <section
      aria-labelledby="spotted-title"
      className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="spotted-title" className="text-[clamp(2.08rem,4.32vw,3.24rem)] leading-[0.95]">
            <span className="block">{t("titleA")}</span>
            <span className="block text-magenta">{t("titleB")}</span>
          </h2>
          <p className="mt-3 max-w-md text-muted">{t("lead")}</p>
        </div>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1 font-semibold underline decoration-magenta decoration-2 underline-offset-4"
          >
            {t("tag", { handle: instagram ?? "" })} <ArrowUpRight size={16} aria-hidden />
            <span className="sr-only">({tc("newTab")})</span>
          </a>
        ) : null}
      </div>
      <ul className="no-scrollbar snap-row -mx-4 mt-8 flex scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:scroll-px-0 sm:grid-cols-3 sm:px-0 lg:grid-cols-5">
        {photos.map((p, i) => (
          <li key={p.key} className="w-[62vw] max-w-[260px] shrink-0 sm:w-auto sm:max-w-none">
            <figure className="group relative overflow-hidden rounded-[var(--radius-xl2)]">
              <Photo
                image={p.image}
                alt={t(`alts.${p.key}`)}
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 62vw"
                className="aspect-[3/4.6] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <figcaption
                className="absolute bottom-3 left-3 rounded-lg bg-white px-3 py-1 font-hand text-lg leading-tight"
                style={{ transform: `rotate(${i % 2 ? 2 : -2}deg)` }}
              >
                {t(`captions.${p.key}`)}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
