import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import { BagIcon, PhoneIcon, PinIcon } from "@/components/icons/brand";
import { Link } from "@/i18n/navigation";

/** Three steps from the menu to a confirmed order, with one clear way in. */
export async function HowToOrder() {
  const t = await getTranslations("howTo");
  const steps = [
    { icon: BagIcon, title: t("s1"), sub: t("s1Sub") },
    { icon: PinIcon, title: t("s2"), sub: t("s2Sub") },
    { icon: PhoneIcon, title: t("s3"), sub: t("s3Sub") },
  ];
  return (
    <section
      aria-labelledby="how-title"
      className="mx-auto max-w-[1440px] px-4 pb-4 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-5 rounded-[var(--radius-xl2)] bg-plum p-5 text-white sm:p-7 lg:flex-row lg:items-center lg:gap-8">
        <h2 id="how-title" className="text-2xl leading-tight lg:w-48 lg:shrink-0">
          {t("title")}
        </h2>
        <ol className="grid flex-1 gap-3 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, sub }, i) => (
            <li key={title} className="flex items-start gap-3 rounded-2xl bg-white/8 p-3.5">
              <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-white">
                <Icon size={26} />
                <span className="absolute -top-1 -left-1 grid size-5 place-items-center rounded-full bg-sun text-[0.75rem] font-bold text-plum">
                  {i + 1}
                </span>
              </span>
              <span>
                <span className="block leading-snug font-semibold">{title}</span>
                <span className="mt-0.5 block text-sm leading-snug text-white/75">{sub}</span>
              </span>
            </li>
          ))}
        </ol>
        <Link
          href="/menu"
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-sun px-6 font-bold whitespace-nowrap text-plum transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.97]"
        >
          {t("cta")} <ArrowRight size={18} weight="bold" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
