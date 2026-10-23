"use client";

import { X } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { DonutIcon } from "@/components/icons/brand";

/** "Today in the window": a daily special the admin can switch on. */
export function Banner({ text }: { text: string }) {
  const t = useTranslations("banner");
  const key = `yy-banner:${text}`;
  const dismissedStored = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return sessionStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || dismissedStored) return null;

  return (
    <div className="relative z-[51] bg-sun text-plum">
      <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-3 px-12 py-2 text-sm">
        <DonutIcon size={20} />
        <p>
          <strong className="font-semibold">{t("label")}:</strong> {text}
        </p>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            try {
              sessionStorage.setItem(key, "1");
            } catch {
              // ignore
            }
          }}
          aria-label={t("dismiss")}
          className="absolute right-2 grid size-10 place-items-center rounded-full hover:bg-plum/10"
        >
          <X size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}
