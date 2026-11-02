"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  HandGrabbing,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { announceAdd, cart } from "@/lib/cart-store";
import type { ClientProduct } from "@/lib/client-types";
import { cn } from "@/lib/cn";
import type { DonutBuilder, Packaging, Step, Topping } from "@/lib/donut3d/builder";
import { formatAmd } from "@/lib/format";
import { t as pick } from "@/lib/localized";

// Glazes that exist on the menu, with the menu donut each one leads to.
const FLAVOURS = [
  {
    key: "chocolate",
    color: "#4a2414",
    rough: 0.16,
    plain: "donut-chocolate",
    rainbow: "donut-chocolate-rainbow",
  },
  { key: "caramel", color: "#b8651e", rough: 0.18, plain: "donut-caramel" },
  { key: "white", color: "#f3ece0", rough: 0.24, plain: "donut-white-chocolate" },
  { key: "strawberry", color: "#f48fb1", rough: 0.22, plain: "donut-strawberry-rainbow" },
  { key: "peach", color: "#f9cf63", rough: 0.22, plain: "donut-peach-rainbow" },
  { key: "blue", color: "#6fd0ec", rough: 0.22, plain: "donut-blue-bali-rainbow" },
  { key: "lemon", color: "#b8d94a", rough: 0.24, plain: "donut-lemon" },
  { key: "pistachio", color: "#93ad55", rough: 0.3, plain: "donut-pistachio-king" },
] as const;
type FlavourKey = (typeof FLAVOURS)[number]["key"];

const TOPPINGS: { key: Topping; dots: string[] }[] = [
  { key: "sprinkles", dots: ["#ffd84a", "#5ec6e8", "#ff7a59"] },
  { key: "chocolate", dots: ["#3b1a10"] },
  { key: "white", dots: ["#f6efe4"] },
  { key: "nuts", dots: ["#c79a5e", "#9db25a"] },
];
const PACKS: Packaging[] = ["paper", "box", "gift"];
const STEPS = ["taste", "toppings", "pack"] as const;

/** Soft taps as toppings land; synthesized, no audio files. */
function makeTaps() {
  let ctx: AudioContext | null = null;
  let buf: AudioBuffer | null = null;
  return {
    unlock() {
      ctx ??= new AudioContext();
      void ctx.resume();
      if (!buf) {
        buf = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      }
    },
    tap() {
      if (!ctx || !buf) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const high = ctx.createBiquadFilter();
      high.type = "highpass";
      high.frequency.value = 2400 + Math.random() * 2600;
      const gain = ctx.createGain();
      gain.gain.value = 0.035;
      src.connect(high).connect(gain).connect(ctx.destination);
      src.start();
    },
  };
}

/**
 * "Build your donut": pick a glaze, toppings and packaging and watch a live
 * 3D donut change; the closest donut on the menu goes into the basket. The
 * 3D code loads only when the section comes near the screen.
 */
export function BuildDonut({ products }: { products: Record<string, ClientProduct | null> }) {
  const t = useTranslations("builder");
  const locale = useLocale() as Locale;
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DonutBuilder | null>(null);
  const tapsRef = useRef<ReturnType<typeof makeTaps> | null>(null);
  const soundOn = useRef(true);
  const drag = useRef<{ id: number; x: number } | null>(null);
  const [status, setStatus] = useState<"waiting" | "ready" | "fallback">("waiting");
  const [step, setStep] = useState<Step>(0);
  const [flavour, setFlavour] = useState<FlavourKey>("chocolate");
  const [toppings, setToppings] = useState<Topping[]>(["sprinkles"]);
  const [pack, setPack] = useState<Packaging>("paper");
  const [sound, setSound] = useState(true);
  const [added, setAdded] = useState(false);

  // Keep the engine in step with the choices.
  useEffect(() => engineRef.current?.setStep(step), [step, status]);
  useEffect(() => {
    const f = FLAVOURS.find((x) => x.key === flavour)!;
    engineRef.current?.setGlaze(f.color, f.rough);
  }, [flavour, status]);
  useEffect(() => engineRef.current?.setToppings(toppings), [toppings, status]);
  useEffect(() => engineRef.current?.setPackaging(pack), [pack, status]);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    let disposed = false;
    let booting = false;
    let visible = false;

    const supported = (() => {
      try {
        const probe = document.createElement("canvas");
        return !!(probe.getContext("webgl2") ?? probe.getContext("webgl"));
      } catch {
        return false;
      }
    })();
    if (!supported) {
      void Promise.resolve().then(() => setStatus("fallback"));
      return;
    }

    const boot = async () => {
      booting = true;
      try {
        const { DonutBuilder } = await import("@/lib/donut3d/builder");
        if (disposed) return;
        const engine = new DonutBuilder(canvas, {
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          phone: window.matchMedia("(pointer: coarse)").matches,
        });
        engine.onDrop = () => {
          if (soundOn.current) tapsRef.current?.tap();
        };
        await engine.ready();
        if (disposed) return engine.dispose();
        engineRef.current = engine;
        setStatus("ready");
        if (visible) engine.start();
      } catch {
        setStatus("fallback");
      }
    };
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting || booting) return;
        booting = true;
        // Near the top of the page now: let the page and its photos load first,
        // then build the 3D scene when the browser has a free moment.
        const later = () =>
          typeof window.requestIdleCallback === "function"
            ? window.requestIdleCallback(() => void boot(), { timeout: 1500 })
            : window.setTimeout(() => void boot(), 300);
        if (document.readyState === "complete") later();
        else window.addEventListener("load", later, { once: true });
      },
      { rootMargin: "100% 0px" },
    );
    const onScreen = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      if (visible && !document.hidden) engineRef.current?.start();
      else engineRef.current?.stop();
    });
    near.observe(section);
    onScreen.observe(canvas);
    const resize = new ResizeObserver(() => engineRef.current?.resize());
    resize.observe(canvas);
    const onVisibility = () => {
      if (document.hidden) engineRef.current?.stop();
      else if (visible) engineRef.current?.start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      near.disconnect();
      onScreen.disconnect();
      resize.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Sound may only start after a tap, so the first choice unlocks it.
  const touch = () => {
    if (soundOn.current) (tapsRef.current ??= makeTaps()).unlock();
    setAdded(false);
  };
  const toggleTopping = (k: Topping) => {
    touch();
    setToppings((list) => (list.includes(k) ? list.filter((x) => x !== k) : [...list, k]));
  };

  // Drag sideways to turn; vertical swipes still scroll the page.
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drag.current) return;
    drag.current = { id: e.pointerId, x: e.clientX };
    e.currentTarget.setPointerCapture(e.pointerId);
    engineRef.current?.dragStart();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current?.id !== e.pointerId) return;
    engineRef.current?.dragBy(e.clientX - drag.current.x);
    drag.current.x = e.clientX;
  };
  const onPointerEnd = (e: React.PointerEvent) => {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    engineRef.current?.dragEnd();
  };

  const f = FLAVOURS.find((x) => x.key === flavour)!;
  const slug = toppings.includes("sprinkles") && "rainbow" in f ? f.rainbow : f.plain;
  const match = products[slug];
  const summary = [
    t(`flavours.${flavour}`),
    toppings.length
      ? toppings.map((k) => t(`toppings.${k}`).toLowerCase()).join(", ")
      : t("noToppings"),
    t(`packs.${pack}`).toLowerCase(),
  ].join(" · ");

  function addMatch(e: React.MouseEvent<HTMLButtonElement>) {
    if (!match) return;
    cart.add({
      productId: match.id,
      quantity: 1,
      optionIds: match.options.filter((o) => o.isDefault).map((o) => o.id),
      messages: [],
      contents: [],
      name: match.name,
      unitPriceAmd: match.priceAmd,
      image: match.img?.src ?? null,
      leadTimeDays: match.leadTimeDays,
    });
    announceAdd(e.currentTarget);
    setAdded(true);
  }

  const chip =
    "transition-[background-color,border-color,scale] duration-150 ease-out active:scale-[0.97]";

  return (
    <section ref={sectionRef} aria-labelledby="build-title" className="on-dark bg-plum text-white">
      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-10 lg:px-8 lg:py-16">
        {/* The studio. */}
        {/* Phones: the studio stays pinned under the header while the choices scroll
            beneath it, so every change is seen as it happens. */}
        <div className="relative z-10 w-full overflow-hidden rounded-[var(--radius-xl2)] bg-[radial-gradient(70%_60%_at_50%_45%,#5a1846_0%,#2b0a24_65%,#1a0616_100%)] shadow-[0_18px_30px_-12px_rgb(26_6_22/0.9)] max-lg:sticky max-lg:top-[76px] max-lg:h-[min(44svh,420px)] lg:aspect-[5/4]">
          {status === "fallback" ? (
            <Image
              src={match?.img?.src ?? "/images/source/tomsarkgh/yumyum-19.jpg"}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain p-10"
            />
          ) : null}
          <canvas
            ref={canvasRef}
            aria-hidden
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            className={cn(
              "absolute inset-0 size-full cursor-grab touch-pan-y transition-opacity duration-500 ease-out select-none active:cursor-grabbing",
              status === "ready" ? "opacity-100" : "opacity-0",
            )}
          />
          {status === "ready" ? (
            <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white/85">
              <HandGrabbing size={16} aria-hidden /> {t("drag")}
            </span>
          ) : null}
          <button
            type="button"
            aria-pressed={sound}
            aria-label={sound ? t("soundOff") : t("soundOn")}
            onClick={() => {
              soundOn.current = !sound;
              setSound(!sound);
            }}
            className="absolute top-2 right-2 grid size-11 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            {sound ? <SpeakerHigh size={20} aria-hidden /> : <SpeakerSlash size={20} aria-hidden />}
          </button>
          {status === "fallback" ? (
            <p className="absolute inset-x-4 bottom-3 text-center text-sm text-white/80">
              {t("noWebgl")}
            </p>
          ) : null}
        </div>

        {/* The choices. */}
        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <p className="font-hand text-xl text-sun">{t("eyebrow")}</p>
            <h2 id="build-title" className="text-[clamp(1.9rem,3.6vw,2.8rem)] leading-tight">
              {t("title")}
            </h2>
            <p className="mt-2 max-w-md text-white/75">{t("lead")}</p>
          </div>

          <div
            role="tablist"
            aria-label={t("title")}
            className="grid grid-cols-3 gap-1 rounded-full bg-white/8 p-1"
          >
            {STEPS.map((s, i) => (
              <button
                key={s}
                type="button"
                role="tab"
                id={`build-tab-${s}`}
                aria-selected={step === i}
                aria-controls="build-panel"
                onClick={() => setStep(i as Step)}
                className={cn(
                  "flex h-11 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-colors duration-200 min-[400px]:gap-2 min-[400px]:text-sm",
                  step === i ? "bg-white text-plum" : "text-white/80 hover:text-white",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-xs font-bold max-[359px]:hidden",
                    step === i ? "bg-sun text-plum" : "bg-white/12",
                  )}
                >
                  {i + 1}
                </span>
                {t(`steps.${s}`)}
              </button>
            ))}
          </div>

          <div
            id="build-panel"
            role="tabpanel"
            aria-labelledby={`build-tab-${STEPS[step]}`}
            key={step}
            className="animate-swap"
          >
            <p className="mb-3 text-sm text-white/70">{t(`hints.${STEPS[step]}`)}</p>
            {step === 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {FLAVOURS.map((x) => (
                  <button
                    key={x.key}
                    type="button"
                    aria-pressed={flavour === x.key}
                    onClick={() => {
                      touch();
                      setFlavour(x.key);
                    }}
                    className={cn(
                      "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-1 py-2 text-center text-xs leading-tight font-semibold",
                      chip,
                      flavour === x.key
                        ? "border-sun bg-white/12"
                        : "border-transparent bg-white/6 hover:bg-white/10",
                    )}
                  >
                    <span
                      aria-hidden
                      className="size-8 rounded-full shadow-[inset_0_-3px_0_rgb(0_0_0/0.18)] ring-2 ring-white/25"
                      style={{ background: x.color }}
                    />
                    {t(`flavours.${x.key}`)}
                  </button>
                ))}
              </div>
            ) : step === 1 ? (
              <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                {TOPPINGS.map((x) => {
                  const on = toppings.includes(x.key);
                  return (
                    <button
                      key={x.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleTopping(x.key)}
                      className={cn(
                        "flex min-h-14 items-center gap-3 rounded-2xl border-2 px-3 text-left text-sm font-semibold",
                        chip,
                        on
                          ? "border-sun bg-white/12"
                          : "border-transparent bg-white/6 hover:bg-white/10",
                      )}
                    >
                      <span aria-hidden className="flex shrink-0 -space-x-1">
                        {x.dots.map((d) => (
                          <span
                            key={d}
                            className="size-4 rounded-full ring-2 ring-plum"
                            style={{ background: d }}
                          />
                        ))}
                      </span>
                      <span className="flex-1">{t(`toppings.${x.key}`)}</span>
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-6 place-items-center rounded-full transition-colors duration-150",
                          on ? "bg-sun text-plum" : "bg-white/10 text-transparent",
                        )}
                      >
                        <Check size={14} weight="bold" />
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {PACKS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={pack === p}
                    onClick={() => {
                      touch();
                      setPack(p);
                    }}
                    className={cn(
                      "flex min-h-14 flex-col justify-center rounded-2xl border-2 px-4 py-2.5 text-left",
                      chip,
                      pack === p
                        ? "border-sun bg-white/12"
                        : "border-transparent bg-white/6 hover:bg-white/10",
                    )}
                  >
                    <span className="text-sm font-semibold">{t(`packs.${p}`)}</span>
                    <span className="text-xs text-white/65">{t(`packSub.${p}`)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as Step)}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white/25 px-5 font-semibold transition-[border-color,scale] duration-150 ease-out hover:border-white/60 active:scale-[0.97]"
              >
                <ArrowLeft size={18} weight="bold" aria-hidden /> {t("back")}
              </button>
            ) : null}
            {step < 2 ? (
              <button
                type="button"
                onClick={() => setStep((step + 1) as Step)}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 font-bold text-plum transition-transform duration-150 ease-out active:scale-[0.97] sm:flex-none"
              >
                {t("next")} <ArrowRight size={18} weight="bold" aria-hidden />
              </button>
            ) : null}
          </div>

          {/* What goes in the order: the closest real donut, at its real price. */}
          <div className="rounded-[var(--radius-card)] bg-white p-3 text-plum shadow-lift sm:p-4">
            <p className="text-xs font-semibold text-muted">{t("yours")}</p>
            <p className="mt-0.5 text-sm font-semibold">{summary}</p>
            {match ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-blush">
                  {match.img ? (
                    <Image
                      src={match.img.src}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-contain"
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted">{t("closest")}</span>
                  <span className="block truncate font-semibold">{pick(match.name, locale)}</span>
                </span>
                <button
                  type="button"
                  disabled={!match.isAvailable}
                  onClick={addMatch}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-magenta px-4 text-sm font-bold whitespace-nowrap text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50 max-[420px]:w-full"
                >
                  {added ? t("added") : t("add", { price: formatAmd(match.priceAmd, locale) })}
                </button>
              </div>
            ) : null}
            {pack !== "paper" ? (
              <Link
                href="/gifts"
                className="mt-2 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-magenta-ink underline decoration-2 underline-offset-4"
              >
                {t("giftsLink")} <ArrowRight size={14} weight="bold" aria-hidden />
              </Link>
            ) : null}
            <p className="mt-2 text-xs text-muted">{t("note")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
