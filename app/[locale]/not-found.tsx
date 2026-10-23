import { getTranslations } from "next-intl/server";
import { DonutIcon } from "@/components/icons/brand";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="dot-grid">
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <span className="animate-wiggle">
          <DonutIcon size={120} />
        </span>
        <h1 className="mt-6 text-[clamp(2.6rem,7vw,4.5rem)] leading-none">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted">{t("lead")}</p>
        <Link href="/" className="mt-8 inline-flex h-12 items-center rounded-full bg-plum px-6 font-semibold text-white">
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
