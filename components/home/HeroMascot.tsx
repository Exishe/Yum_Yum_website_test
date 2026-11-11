"use client";

import { X } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

type Stage = "hidden" | "ask" | "yes" | "no" | "leaving";

/**
 * Tap the hero photo and the YUM-YUM donut steps out to say hello and ask
 * whether you have tried the donuts. Two answers, each with a way to the menu.
 * Only transform and opacity animate; reduced motion shows it without movement.
 */
export function HeroMascot() {
  const t = useTranslations("hero.mascot");
  const [stage, setStage] = useState<Stage>("hidden");
  const rootRef = useRef<HTMLDivElement>(null);
  const firstAnswer = useRef<HTMLButtonElement>(null);
  const shown = stage !== "hidden";

  const close = () => setStage((s) => (s === "hidden" ? s : "leaving"));

  useEffect(() => {
    if (stage !== "leaving") return;
    const id = window.setTimeout(() => setStage("hidden"), 200);
    return () => window.clearTimeout(id);
  }, [stage]);

  useEffect(() => {
    if (!shown || stage === "leaving") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [shown, stage]);

  useEffect(() => {
    if (stage === "ask") firstAnswer.current?.focus({ preventScroll: true });
  }, [stage]);

  return (
    <div ref={rootRef} className="contents">
      {/* The photo itself is the button. */}
      <button
        type="button"
        aria-label={t("open")}
        aria-expanded={shown && stage !== "leaving"}
        onClick={() => setStage((s) => (s === "hidden" || s === "leaving" ? "ask" : "leaving"))}
        className="group absolute inset-[7%] z-[5] cursor-pointer rounded-full focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-magenta"
      >
        <span
          aria-hidden
          className={`pointer-events-none absolute bottom-[12%] left-1/2 -translate-x-1/2 rounded-lg bg-white/92 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-plum shadow-card transition-[opacity,scale] duration-200 ease-out group-hover:scale-105 ${shown ? "opacity-0" : "opacity-100"}`}
        >
          {t("hint")}
        </span>
      </button>

      {shown ? (
        <div
          data-state={stage === "leaving" ? "leaving" : "open"}
          className="mascot-stage pointer-events-none absolute inset-0 z-20"
        >
          <Image
            src="/images/brand/mascot.webp"
            alt={t("alt")}
            width={864}
            height={739}
            quality={85}
            sizes="(min-width: 1024px) 280px, 46vw"
            className="mascot-figure absolute bottom-[2%] left-[-2%] w-[46%] drop-shadow-xl"
          />
          <div
            role="dialog"
            aria-label={t("hello")}
            className="mascot-bubble pointer-events-auto absolute top-[6%] right-[-3%] w-[min(66%,17rem)] rounded-3xl rounded-bl-md bg-white p-3 text-plum shadow-lift ring-1 ring-line sm:top-auto sm:bottom-[34%] sm:p-4"
          >
            <button
              type="button"
              onClick={close}
              aria-label={t("close")}
              className="absolute top-1 right-1 grid size-9 place-items-center rounded-full text-muted hover:text-plum"
            >
              <X size={16} weight="bold" aria-hidden />
            </button>
            <p className="pr-6 font-hand text-lg leading-tight text-magenta-ink sm:text-xl">
              {t("hello")}
            </p>
            {stage === "ask" || stage === "leaving" ? (
              <>
                <p className="mt-1 text-sm leading-snug font-semibold">{t("ask")}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
                  <button
                    ref={firstAnswer}
                    type="button"
                    onClick={() => setStage("yes")}
                    className="h-10 rounded-xl bg-plum px-3 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] sm:px-4"
                  >
                    {t("yes")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage("no")}
                    className="h-10 rounded-xl border-2 border-plum px-3 text-sm font-semibold transition-[background-color,scale] duration-150 ease-out hover:bg-plum/5 active:scale-[0.97] sm:px-4"
                  >
                    {t("no")}
                  </button>
                </div>
              </>
            ) : (
              <div key={stage} className="animate-swap">
                <p className="mt-1 text-sm leading-snug">
                  {stage === "yes" ? t("afterYes") : t("afterNo")}
                </p>
                <Link
                  href={
                    stage === "no" ? { pathname: "/menu", query: { category: "donuts" } } : "/menu"
                  }
                  className="mt-3 inline-flex h-10 items-center rounded-xl bg-magenta px-4 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
                >
                  {t("toMenu")}
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
