import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/settings";

/** Links to the shop's real store pages on delivery apps. Only enabled ones with a URL are shown. */
export async function DeliveryLinks() {
  const t = await getTranslations("delivery");
  const tc = await getTranslations("common");
  const links = (await getSettings()).externalDelivery.filter((d) => d.enabled && /^https:\/\//.test(d.url));
  if (!links.length) return null;
  return (
    <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <p className="font-hand text-2xl text-magenta-ink">{t("title")}</p>
      <ul className="flex flex-wrap gap-2">
        {links.map((d) => (
          <li key={d.name}>
            <a
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-1 rounded-full border-2 border-plum/20 bg-white px-5 text-sm font-semibold hover:border-plum"
            >
              {t("on", { name: d.name })} <ArrowUpRight size={14} weight="bold" aria-hidden />
              <span className="sr-only">({tc("newTab")})</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
