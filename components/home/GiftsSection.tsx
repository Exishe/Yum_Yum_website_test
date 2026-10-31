import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getLocale, getTranslations } from "next-intl/server";
import { Photo } from "@/components/ui/Photo";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { formatAmd } from "@/lib/format";
import type { ImageInfo } from "@/lib/images";
import { DemoNote } from "@/components/AskPrice";

export async function GiftsSection({
  bouquet,
  box,
  prices,
  phone,
  phoneDisplay,
}: {
  bouquet: ImageInfo;
  box: ImageInfo;
  /** Starting prices; a gift without a known price is left out. */
  prices: { bouquet: number | null; composition: number | null; box: number | null };
  phone: string;
  phoneDisplay: string;
}) {
  const t = await getTranslations("gifts");
  const locale = (await getLocale()) as Locale;
  const options = [
    { title: t("bouquet"), sub: t("bouquetSub"), price: prices.bouquet },
    { title: t("composition"), sub: t("compositionSub"), price: prices.composition },
    { title: t("boxTitle"), sub: t("boxSub"), price: prices.box },
  ].flatMap((o) =>
    o.price == null ? [] : [{ ...o, price: t("from", { price: formatAmd(o.price, locale) }) }],
  );

  return (
    <section aria-labelledby="gifts-title" className="relative mt-16 bg-sun">
      <svg
        aria-hidden
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="absolute -top-[59px] left-0 h-[60px] w-full fill-sun"
      >
        <path d="M0 40 C 240 0, 480 0, 720 26 S 1200 60, 1440 18 V60 H0Z" />
      </svg>
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8 lg:py-20">
        <div>
          <p className="font-hand text-xl text-magenta-ink">{t("eyebrow")}</p>
          <h2 id="gifts-title" className="mt-1 text-[clamp(2.24rem,4.68vw,3.6rem)] leading-[0.95]">
            {t("title")}
          </h2>
          <p className="mt-5 max-w-lg text-lg">
            {t("lead")} <DemoNote />
          </p>
          <ul className="mt-7 flex max-w-lg flex-col gap-3">
            {options.map((o) => (
              <li
                key={o.title}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl bg-white px-5 py-4 shadow-card"
              >
                <span className="min-w-0">
                  <span className="block font-semibold">{o.title}</span>
                  <span className="block text-sm text-muted">{o.sub}</span>
                </span>
                <span className="ml-auto shrink-0 font-bold">{o.price}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/gifts"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-plum px-7 font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              {t("orderOnline")} <ArrowRight size={18} weight="bold" aria-hidden />
            </Link>
            <a
              href={`tel:${phone}`}
              className="inline-flex h-14 items-center justify-center rounded-full border-2 border-plum px-7 font-semibold transition-colors hover:bg-plum hover:text-white"
            >
              {t("callToOrder", { phone: phoneDisplay })}
            </a>
          </div>
        </div>
        <div className="no-scrollbar snap-row -mx-4 flex scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:block lg:scroll-px-0 lg:overflow-visible lg:px-0">
          <div className="relative min-h-0 lg:h-[600px]">
            <figure className="w-[78vw] max-w-[380px] shrink-0 -rotate-3 rounded-[1.75rem] bg-white p-2.5 shadow-lift transition-transform duration-500 hover:rotate-0 lg:absolute lg:top-0 lg:left-[6%] lg:w-[54%]">
              <Photo
                image={bouquet}
                alt={t("bouquetAlt")}
                sizes="(min-width: 1024px) 380px, 78vw"
                className="aspect-[4/5] w-full rounded-[1.3rem] object-cover"
              />
            </figure>
          </div>
          <figure className="relative w-[70vw] max-w-[340px] shrink-0 rotate-3 rounded-[1.75rem] bg-white p-2.5 shadow-lift transition-transform duration-500 hover:rotate-0 lg:absolute lg:top-[110px] lg:right-[2%] lg:w-[42%] xl:right-[6%]">
            <Photo
              image={box}
              alt={t("boxAlt")}
              sizes="(min-width: 1024px) 320px, 70vw"
              className="aspect-[5/6] w-full rounded-[1.3rem] object-cover"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
