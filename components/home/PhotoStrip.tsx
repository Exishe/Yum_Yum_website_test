import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { ImageInfo } from "@/lib/images";

/** A row of real photos to swipe through; it does not move by itself. */
export async function PhotoStrip({ photos }: { photos: ImageInfo[] }) {
  const t = await getTranslations("hero");
  return (
    <div
      className="relative z-10 -mt-2 overflow-x-clip py-6"
      role="region"
      aria-label={t("stripLabel")}
    >
      <ul
        data-reveal
        tabIndex={0}
        aria-label={t("stripLabel")}
        className="no-scrollbar snap-row flex scroll-px-6 gap-4 overflow-x-auto px-6 py-3 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-magenta"
      >
        {photos.map((p) => (
          <li key={p.src} className="shrink-0 snap-start">
            <span className="zoom-frame relative block h-[clamp(7rem,13vw,10rem)] w-[clamp(9.5rem,18vw,14rem)] overflow-hidden rounded-2xl shadow-card">
              <Image src={p.src} alt="" fill sizes="224px" className="zoom-photo object-cover" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
