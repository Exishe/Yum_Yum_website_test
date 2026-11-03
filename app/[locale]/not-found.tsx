import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="dot-grid">
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <div className="mascot-stage" data-state="open">
          <Image
            src="/images/brand/mascot.webp"
            alt=""
            width={864}
            height={739}
            quality={85}
            sizes="208px"
            priority
            className="mascot-figure w-44 sm:w-52"
          />
        </div>
        <h1 className="mt-6 text-[clamp(1.91rem,4.28vw,2.75rem)] leading-none">{t("title")}</h1>
        <p className="mt-4 text-muted">{t("lead")}</p>
        <Link
          href="/"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-plum px-6 font-semibold text-white"
        >
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
