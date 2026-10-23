import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { ImageInfo } from "@/lib/images";

/** A slightly tilted strip of real photos that scrolls forever (CSS only). */
export async function PhotoStrip({ photos }: { photos: ImageInfo[] }) {
  const t = await getTranslations("hero");
  const row = (hidden: boolean) =>
    photos.map((p, i) => (
      <li key={`${hidden}-${p.src}`} className="flex shrink-0 items-center gap-6" aria-hidden={hidden || undefined}>
        <span
          className="relative block h-[clamp(5.5rem,11vw,8rem)] w-[clamp(8rem,15vw,11.5rem)] overflow-hidden rounded-2xl shadow-card"
          style={{ transform: `rotate(${i % 2 ? 3 : -2}deg)` }}
        >
          <Image src={p.src} alt="" fill sizes="190px" className="object-cover" />
        </span>
        <span className="font-display text-[clamp(1.6rem,3vw,2.4rem)] text-magenta" lang="en">
          {t("strip")}
        </span>
      </li>
    ));
  return (
    <div className="relative z-10 -mt-2 overflow-hidden py-6" role="region" aria-label={t("stripLabel")}>
      <div className="-rotate-2">
        <ul className="flex w-max animate-marquee gap-6 hover:[animation-play-state:paused] motion-reduce:animate-none">
          {row(false)}
          {row(true)}
        </ul>
      </div>
    </div>
  );
}
