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
            className="group flex flex-col gap-3 rounded-[var(--radius-card)] bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:flex-row sm:items-center sm:p-5"
          >
            <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${tile}`}>
              <Icon size={34} className="group-hover:animate-wiggle" />
            </span>
            <span>
              <span className="block font-semibold">{title}</span>
              <span className="block text-sm text-muted">{sub}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
