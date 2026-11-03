import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { ImageInfo } from "@/lib/images";

/** A slightly tilted strip of real photos to swipe through. */
export async function PhotoStrip({ photos }: { photos: ImageInfo[] }) {
  const t = await getTranslations("hero");
  return (
    <div
      className="relative z-10 -mt-2 overflow-x-clip py-6"
      role="region"
      aria-label={t("stripLabel")}
    >
      {/* A row the visitor swipes or scrolls; it does not move by itself. */}
      <ul
        data-reveal
        className="no-scrollbar snap-row flex -rotate-2 scroll-px-6 gap-6 overflow-x-auto px-6 py-3"
      >
        {photos.map((p, i) => (
          <li key={p.src} className="flex shrink-0 snap-start items-center gap-6">
            <span
              className="zoom-frame relative block h-[clamp(5.5rem,11vw,8rem)] w-[clamp(8rem,15vw,11.5rem)] overflow-hidden rounded-2xl shadow-card"
              style={{ transform: `rotate(${i % 2 ? 3 : -2}deg)` }}
            >
              <Image src={p.src} alt="" fill sizes="190px" className="zoom-photo object-cover" />
            </span>
            <span
              aria-hidden
              className="font-display text-[clamp(1.12rem,2.16vw,1.73rem)] text-magenta"
              lang="en"
            >
              {t("strip")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
