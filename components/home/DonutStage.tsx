"use client";

import { ArrowRight, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import type { DonutEngine, FrameInfo, PartId } from "@/lib/donut3d/engine";

const GLAZES = [
  { key: "pink", glaze: "#f2649e", drizzle: "#3b1a10", swatch: "#f2649e" },
  { key: "chocolate", glaze: "#4a2414", drizzle: "#f4eee6", swatch: "#4a2414" },
  { key: "white", glaze: "#f4eee6", drizzle: "#3b1a10", swatch: "#f4eee6" },
  { key: "lemon", glaze: "#f7cf48", drizzle: "#3b1a10", swatch: "#f7cf48" },
  { key: "blue", glaze: "#5ec6e8", drizzle: "#f4eee6", swatch: "#5ec6e8" },
] as const;

const PARTS: PartId[] = ["dough", "glaze", "drizzle", "sprinkles"];
// Where each beat's text is fully shown, on the 0..1 scroll of the section.
const BEATS = [0.04, 0.27, 0.5, 0.73, 0.96];

/** A soft "pour" from filtered noise and a few taps as sprinkles land; no audio files. */
function makeSound() {
  let ctx: AudioContext | null = null;
  let pour: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  const context = () => (ctx ??= new AudioContext());
  const noise = (c: AudioContext, seconds: number) => {
    const b = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  };
  return {
    start() {
      const c = context();
      void c.resume();
      if (pour) return;
      const src = c.createBufferSource();
      src.buffer = noise(c, 2);
      src.loop = true;
      const band = c.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 650;
      band.Q.value = 0.8;
      const gain = c.createGain();
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.05, c.currentTime + 0.25);
      src.connect(band).connect(gain).connect(c.destination);
      src.start();
      pour = { src, gain };
    },
    stop() {
      if (!pour || !ctx) return;
      const { src, gain } = pour;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
      src.stop(ctx.currentTime + 0.4);
      pour = null;
    },
    tap() {
      if (!ctx) return;
      const src = ctx.createBufferSource();
      src.buffer = noise(ctx, 0.03);
      const high = ctx.createBiquadFilter();
      high.type = "highpass";
      high.frequency.value = 2500 + Math.random() * 2500;
      const gain = ctx.createGain();
      gain.gain.value = 0.03;
      src.connect(high).connect(gain).connect(ctx.destination);
      src.start();
    },
  };
}

/**
 * The home page's one moving centrepiece: a donut drawn live (three.js),
 * filmed by the scroll. Hold to pour the glaze; scroll to take it apart.
 * The 3D code loads only when the section comes near the screen.
 */
export function DonutStage() {
  const t = useTranslations("donut3d");
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DonutEngine | null>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const ringRef = useRef<SVGCircleElement>(null);
  const holdRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<ReturnType<typeof makeSound> | null>(null);
  const [status, setStatus] = useState<"waiting" | "ready" | "fallback">("waiting");
  const [glaze, setGlaze] = useState(0);
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const [sound, setSound] = useState(true);
  const soundOn = useRef(true);

  // Beats and the hold control follow the scroll position directly (not an
  // observer), so no text reveal is ever skipped on a heavy frame.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let frame = 0;
    const update = () => {
      const r = section.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, span)));
      engineRef.current?.setProgress(p);
      BEATS.forEach((at, i) => {
        const el = beatRefs.current[i];
        if (!el) return;
        const o = Math.max(0, 1 - Math.abs(p - at) / 0.13);
        el.style.opacity = String(o);
        el.style.transform = `translateY(${(1 - o) * (p < at ? 12 : -12)}px)`;
        el.style.visibility = o > 0.01 ? "visible" : "hidden";
      });
      if (holdRef.current) {
        const o = Math.max(0, 1 - p / 0.12);
        holdRef.current.style.opacity = String(o);
        holdRef.current.style.visibility = o > 0.01 ? "visible" : "hidden";
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Load the engine when the section is near; run it only while it is on screen.
  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    let engine: DonutEngine | null = null;
    let disposed = false;
    let visible = false;
    let landed = 0;

    const supported = (() => {
      try {
        const probe = document.createElement("canvas");
        return !!(probe.getContext("webgl2") ?? probe.getContext("webgl"));
      } catch {
        return false;
      }
    })();
    if (!supported) {
      // No WebGL: the section shows a photo and the same words.
      void Promise.resolve().then(() => setStatus("fallback"));
      return;
    }

    const boot = async () => {
      try {
        const { DonutEngine } = await import("@/lib/donut3d/engine");
        if (disposed) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const phone = window.matchMedia("(pointer: coarse)").matches;
        engine = new DonutEngine(canvas, { reducedMotion: reduced, phone });
        engine.setGlaze(GLAZES[0].glaze, GLAZES[0].drizzle);
        engine.onFrame = (info: FrameInfo) => paint(info);
        await engine.ready();
        if (disposed) return engine.dispose();
        engineRef.current = engine;
        window.dispatchEvent(new Event("scroll"));
        setStatus("ready");
        if (visible) engine.start();
      } catch {
        setStatus("fallback");
      }
    };

    const paint = (info: FrameInfo) => {
      const ring = ringRef.current;
      if (ring) ring.style.strokeDashoffset = String(100 - info.cover * 100);
      if (!doneRef.current && info.cover >= 1 && info.sprinkles >= 1) {
        doneRef.current = true;
        setDone(true);
      }
      // A few soft taps while the sprinkles land.
      const k = Math.floor(info.sprinkles * 10);
      if (k > landed && info.sprinkles < 1) {
        landed = k;
        if (soundOn.current) soundRef.current?.tap();
      }
      const w = canvas.clientWidth;
      info.anchors.forEach((a, i) => {
        const label = labelRefs.current[i];
        const line = lineRefs.current[i];
        if (!label || !line) return;
        const show = info.explode > 0.6 && a.visible;
        const o = show ? Math.min(1, (info.explode - 0.6) / 0.3) : 0;
        const lx = Math.min(w - 16 - label.offsetWidth, a.x + Math.max(48, w * 0.08));
        label.style.opacity = String(o);
        label.style.transform = `translate(${lx}px, ${a.y - label.offsetHeight / 2}px)`;
        line.setAttribute("x1", String(a.x));
        line.setAttribute("y1", String(a.y));
        line.setAttribute("x2", String(lx - 6));
        line.setAttribute("y2", String(a.y));
        line.style.opacity = String(o * 0.7);
      });
    };

    const near = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting && !engine) void boot();
      },
      { rootMargin: "100% 0px" },
    );
    const onScreen = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      if (!engineRef.current) return;
      if (visible) engineRef.current.start();
      else engineRef.current.stop();
    });
    near.observe(section);
    onScreen.observe(section);
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

  function pickGlaze(i: number) {
    setGlaze(i);
    engineRef.current?.setGlaze(GLAZES[i]!.glaze, GLAZES[i]!.drizzle);
  }
  function holdStart(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    engineRef.current?.setHolding(true);
    if (soundOn.current) (soundRef.current ??= makeSound()).start();
  }
  function holdEnd() {
    engineRef.current?.setHolding(false);
    soundRef.current?.stop();
  }
  function onPointerMove(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    engineRef.current?.setPointer(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      ((e.clientY - r.top) / r.height) * 2 - 1,
    );
  }

  const beats = [0, 1, 2, 3, 4].map((i) => ({
    title: t(`b${i}Title` as "b0Title"),
    text: t(`b${i}Text` as "b0Text"),
  }));

  return (
    <section
      ref={sectionRef}
      aria-labelledby="donut-title"
      className="relative h-[340vh] bg-plum lg:h-[420vh]"
    >
      <div
        className="on-dark sticky top-0 h-[100svh] overflow-hidden text-white"
        onPointerMove={onPointerMove}
      >
        {/* The studio: a dark room with a warm glow where the donut sits. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_55%_at_62%_48%,#5a1846_0%,#2b0a24_62%,#1a0616_100%)] max-lg:bg-[radial-gradient(80%_45%_at_50%_42%,#5a1846_0%,#2b0a24_65%,#1a0616_100%)]"
        />
        {status === "fallback" ? (
          <div className="absolute inset-x-6 top-[14%] bottom-[38%] overflow-hidden rounded-[var(--radius-xl2)] lg:inset-y-[12%] lg:right-[6%] lg:left-[46%]">
            <Image
              src="/images/source/tomsarkgh/yumyum-19.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 48vw, 90vw"
              className="object-cover"
            />
          </div>
        ) : null}
        <canvas
          ref={canvasRef}
          aria-hidden
          onPointerDown={holdStart}
          onPointerUp={holdEnd}
          onPointerLeave={holdEnd}
          onPointerCancel={holdEnd}
          className={cn(
            "absolute inset-0 size-full touch-pan-y transition-opacity duration-500 ease-out select-none [-webkit-touch-callout:none]",
            status === "ready" ? "opacity-100" : "opacity-0",
          )}
        />
        {/* Grain, so the render reads as a photograph rather than a screenshot. */}
        <div aria-hidden className="film-grain pointer-events-none absolute inset-0" />

        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full">
          {PARTS.map((id, i) => (
            <line
              key={id}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              stroke="#ffd84a"
              strokeWidth="1.5"
              strokeDasharray="3 4"
              style={{ opacity: 0 }}
            />
          ))}
        </svg>
        {PARTS.map((id, i) => (
          <div
            key={id}
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 rounded-full bg-white px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-plum shadow-card"
            style={{ opacity: 0 }}
          >
            {t(`parts.${id}`)}
          </div>
        ))}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[#1a0616] via-[#1a0616]/80 to-transparent lg:hidden" />

        {beats.map((b, i) => (
          <div
            key={i}
            ref={(el) => {
              beatRefs.current[i] = el;
            }}
            className="pointer-events-none absolute inset-x-5 bottom-52 max-w-md will-change-transform [text-shadow:0_2px_18px_rgb(26_6_22/0.85)] lg:top-1/2 lg:bottom-auto lg:left-[7%] lg:-translate-y-1/2"
            style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}
          >
            {i === 0 ? <p className="mb-2 font-hand text-xl text-sun">{t("label")}</p> : null}
            {i === 0 ? (
              <h2 id="donut-title" className="text-[clamp(1.9rem,4vw,3rem)] leading-tight">
                {b.title}
              </h2>
            ) : (
              <h3 className="text-[clamp(1.6rem,3.4vw,2.6rem)] leading-tight">{b.title}</h3>
            )}
            <p className="mt-3 max-w-sm text-white/80 lg:text-lg">{b.text}</p>
            {i === 4 ? (
              <Link
                href="/menu"
                className="pointer-events-auto mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-sun px-6 font-bold whitespace-nowrap text-plum transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.97]"
              >
                {t("cta")} <ArrowRight size={18} weight="bold" aria-hidden />
              </Link>
            ) : null}
          </div>
        ))}

        {/* Hold to pour, glaze colours and sound: only on the first beat. */}
        <div
          ref={holdRef}
          className="absolute inset-x-5 bottom-20 flex flex-wrap items-center gap-x-3 gap-y-2 lg:inset-x-auto lg:right-[8%] lg:bottom-[10%]"
        >
          <button
            type="button"
            disabled={status !== "ready"}
            onPointerDown={holdStart}
            onPointerUp={holdEnd}
            onPointerLeave={holdEnd}
            onPointerCancel={holdEnd}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                e.preventDefault();
                engineRef.current?.setHolding(true);
              }
            }}
            onKeyUp={holdEnd}
            className="inline-flex h-12 touch-none items-center gap-2.5 rounded-full bg-white pr-5 pl-1.5 font-bold text-plum shadow-lift transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
          >
            <svg viewBox="0 0 36 36" className="size-9 -rotate-90" aria-hidden>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3e6ec" strokeWidth="3.5" />
              <circle
                ref={ringRef}
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="#de1281"
                strokeWidth="3.5"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray="100"
                strokeDashoffset="100"
              />
            </svg>
            {done ? t("holdDone") : t("hold")}
          </button>
          <div role="group" aria-label={t("glaze")} className="flex gap-1.5">
            {GLAZES.map((g, i) => (
              <button
                key={g.key}
                type="button"
                aria-pressed={glaze === i}
                aria-label={t(`colors.${g.key}`)}
                title={t(`colors.${g.key}`)}
                onClick={() => pickGlaze(i)}
                className={cn(
                  "grid size-11 place-items-center rounded-full transition-transform duration-150 ease-out active:scale-[0.94]",
                  glaze === i ? "bg-white/20" : "hover:bg-white/10",
                )}
              >
                <span
                  className={cn(
                    "size-7 rounded-full ring-2",
                    glaze === i ? "ring-white" : "ring-white/30",
                  )}
                  style={{ background: g.swatch }}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-pressed={sound}
            aria-label={sound ? t("soundOff") : t("soundOn")}
            onClick={() => {
              soundOn.current = !sound;
              if (sound) soundRef.current?.stop();
              setSound(!sound);
            }}
            className="grid size-11 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            {sound ? <SpeakerHigh size={20} aria-hidden /> : <SpeakerSlash size={20} aria-hidden />}
          </button>
          {status === "fallback" ? (
            <p className="basis-full text-sm text-white/75">{t("noWebgl")}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
