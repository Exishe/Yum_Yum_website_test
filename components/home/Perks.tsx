import { getTranslations } from "next-intl/server";
import { BagIcon, CardIcon, FreshDonutIcon, PinIcon } from "@/components/icons/brand";

export async function Perks() {
  const t = await getTranslations("perks");
  const perks = [
    { icon: FreshDonutIcon, title: t("fresh"), sub: t("freshSub"), tile: "bg-sun-soft" },
    { icon: PinIcon, title: t("shops"), sub: t("shopsSub"), tile: "bg-magenta-soft" },
    { icon: BagIcon, title: t("takeaway"), sub: t("takeawaySub"), tile: "bg-sun-soft" },
    { icon: CardIcon, title: t("cards"), sub: t("cardsSub"), tile: "bg-magenta-soft" },
  ];
  return (
    <section aria-label={t("label")} className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {perks.map(({ icon: Icon, title, sub, tile }) => (
          <li
            key={title}
            className="flex flex-col items-start gap-2.5 rounded-[var(--radius-card)] bg-white p-3.5 shadow-card sm:flex-row sm:items-center sm:gap-4 sm:p-5"
          >
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-2xl sm:size-14 ${tile}`}
            >
              <Icon size={34} />
            </span>
            <span>
              <span className="block text-[0.9375rem] leading-snug font-semibold sm:text-base">
                {title}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-muted sm:text-sm">{sub}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
