"use client";

import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { AskPrice } from "@/components/AskPrice";
import type { Locale } from "@/i18n/routing";
import { announceAdd, cart } from "@/lib/cart-store";
import type { ClientProduct } from "@/lib/client-types";
import { cn } from "@/lib/cn";
import { formatAmd } from "@/lib/format";
import { t as pick } from "@/lib/localized";

/**
 * The free box place nearest the pointer, in the box or its floating copy:
 * its index and rectangle; index -1 over a full box; null outside.
 */
function slotAt(
  boxes: (HTMLElement | null)[],
  x: number,
  y: number,
): { i: number; rect: DOMRect | null } | null {
  for (const ol of boxes) {
    if (!ol) continue;
    const r = ol.getBoundingClientRect();
    const pad = 24;
    if (x < r.left - pad || x > r.right + pad || y < r.top - pad || y > r.bottom + pad) continue;
    let best = -1;
    let rect: DOMRect | null = null;
    let bestD = Infinity;
    Array.from(ol.children).forEach((li, i) => {
      if ((li as HTMLElement).dataset.free !== "1") return;
      const c = li.getBoundingClientRect();
      const d = Math.hypot(c.left + c.width / 2 - x, c.top + c.height / 2 - y);
      if (d < bestD) {
        bestD = d;
        best = i;
        rect = c;
      }
    });
    return { i: best, rect };
  }
  return null;
}

type Drag = {
  product: ClientProduct;
  pointerId: number;
  touch: boolean;
  x0: number;
  y0: number;
  x: number;
  y: number;
  active: boolean;
  timer?: number;
  ghost?: HTMLElement;
  size: number;
  from: DOMRect;
};

/**
 * "Pack your box": pick 6 or 12 donuts and watch them fill the box. Tap a
 * donut to drop it in the next free place, or pick it up and carry it to the
 * place you want: with a mouse, press and move; on a phone, hold for a moment
 * and then move. The page scrolls on its own near the screen edges.
 */
export function BoxBuilder({ boxes, donuts }: { boxes: ClientProduct[]; donuts: ClientProduct[] }) {
  const t = useTranslations("gifts.box");
  const locale = useLocale() as Locale;
  const sorted = [...boxes].sort((a, b) => (a.boxSize ?? 0) - (b.boxSize ?? 0));
  const [boxId, setBoxId] = useState(sorted[0]?.id);
  const [slots, setSlots] = useState<(ClientProduct | null)[]>([]);
  const [over, setOver] = useState<number | null>(null);
  const [carrying, setCarrying] = useState(false);
  // Phones: when the box is off screen, a small copy of it floats at the top while carrying.
  const [tray, setTray] = useState(false);
  const trayRef = useRef<HTMLOListElement>(null);
  const boxRef = useRef<HTMLOListElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const drag = useRef<Drag | null>(null);
  const justDragged = useRef(false);
  const box = sorted.find((b) => b.id === boxId) ?? sorted[0];
  const size = box?.boxSize ?? 0;

  // While a donut is carried on a phone, the finger must not scroll the page.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const stop = (e: TouchEvent) => {
      if (drag.current?.active) e.preventDefault();
    };
    list.addEventListener("touchmove", stop, { passive: false });
    return () => list.removeEventListener("touchmove", stop);
  }, []);

  // Near the top or bottom of the screen the page scrolls by itself.
  useEffect(() => {
    if (!carrying) return;
    let frame = 0;
    const tick = () => {
      const d = drag.current;
      if (d?.active && !trayRef.current) {
        const edge = 80;
        const dy =
          d.y < edge
            ? -(edge - d.y) / 5
            : d.y > innerHeight - edge
              ? (d.y - innerHeight + edge) / 5
              : 0;
        if (dy) {
          window.scrollBy(0, dy);
          setOver(slotAt([boxRef.current, trayRef.current], d.x, d.y)?.i ?? null);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [carrying]);

  const cells = Array.from({ length: size }, (_, i) => slots[i] ?? null);

  if (!box?.boxSize) return null;
  const packed = cells.filter((c): c is ClientProduct => c !== null);
  const left = size - packed.length;
  const donutsTotal = packed.reduce((s, p) => s + p.priceAmd, 0);
  const total = box.priceAmd + donutsTotal;
  const available = donuts.filter((d) => d.isAvailable && !d.priceOnRequest);

  function chooseBox(id: number) {
    const next = sorted.find((b) => b.id === id);
    setBoxId(id);
    // Keep what is packed, moved up to fill the first places of the new box.
    setSlots((s) => s.filter(Boolean).slice(0, next?.boxSize ?? s.length));
  }

  /** Puts a donut in place `at` if it is free, otherwise in the first free place. */
  function put(p: ClientProduct, at?: number | null) {
    setSlots((s) => {
      const next = Array.from({ length: size }, (_, i) => s[i] ?? null);
      const i = at != null && at >= 0 && !next[at] ? at : next.findIndex((c) => !c);
      if (i < 0) return s;
      next[i] = p;
      return next;
    });
  }
  function removeAt(i: number) {
    setSlots((s) => s.map((c, k) => (k === i ? null : c)));
  }

  function lift(d: Drag, img: HTMLImageElement | null) {
    d.active = true;
    setCarrying(true);
    const r = boxRef.current?.getBoundingClientRect();
    if (r && (r.bottom < 160 || r.top > innerHeight - 120)) setTray(true);
    const g = document.createElement("div");
    g.setAttribute("aria-hidden", "true");
    g.className = "box-ghost";
    g.style.width = g.style.height = `${d.size}px`;
    if (img?.currentSrc) g.style.backgroundImage = `url("${img.currentSrc}")`;
    document.body.appendChild(g);
    d.ghost = g;
    moveGhost(d);
    navigator.vibrate?.(12);
  }
  function moveGhost(d: Drag) {
    if (!d.ghost) return;
    d.ghost.style.transform = `translate3d(${d.x - d.size / 2}px, ${d.y - d.size / 2}px, 0) scale(1.1) rotate(-6deg)`;
  }
  function drop(d: Drag) {
    const g = d.ghost;
    const hit = slotAt([boxRef.current, trayRef.current], d.x, d.y);
    const at = hit && hit.i >= 0 ? hit.i : null;
    const target = at != null ? hit!.rect : null;
    setOver(null);
    setCarrying(false);
    setTray(false);
    if (!g) return;
    g.classList.add("box-ghost-settle");
    if (target) {
      const s = target.width / d.size;
      g.style.transform = `translate3d(${target.left + target.width / 2 - d.size / 2}px, ${target.top + target.height / 2 - d.size / 2}px, 0) scale(${s})`;
      window.setTimeout(() => {
        put(d.product, at);
        g.remove();
      }, 200);
    } else {
      // Not over the box: it goes back where it came from.
      g.style.transform = `translate3d(${d.from.left}px, ${d.from.top}px, 0) scale(${d.from.width / d.size})`;
      g.style.opacity = "0";
      window.setTimeout(() => g.remove(), 220);
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>, p: ClientProduct) {
    if (left === 0 || drag.current || e.button > 0) return;
    const pic = e.currentTarget.querySelector("span");
    const from = (pic ?? e.currentTarget).getBoundingClientRect();
    const d: Drag = {
      product: p,
      pointerId: e.pointerId,
      touch: e.pointerType === "touch",
      x0: e.clientX,
      y0: e.clientY,
      x: e.clientX,
      y: e.clientY,
      active: false,
      size: Math.max(64, Math.min(110, from.width)),
      from,
    };
    drag.current = d;
    const img = e.currentTarget.querySelector("img");
    if (d.touch) d.timer = window.setTimeout(() => drag.current === d && lift(d, img), 260);
  }
  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    d.x = e.clientX;
    d.y = e.clientY;
    const moved = Math.hypot(d.x - d.x0, d.y - d.y0);
    if (!d.active) {
      if (d.touch) {
        // Moving before the hold completes is a scroll, not a pick-up.
        if (moved > 10) {
          window.clearTimeout(d.timer);
          drag.current = null;
        }
        return;
      }
      if (moved < 6) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      lift(d, e.currentTarget.querySelector("img"));
    }
    moveGhost(d);
    const at = slotAt([boxRef.current, trayRef.current], d.x, d.y)?.i ?? null;
    setOver((o) => (o === at ? o : at));
  }
  function onPointerEnd(e: React.PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    window.clearTimeout(d.timer);
    drag.current = null;
    if (d.active) {
      justDragged.current = true;
      drop(d);
    }
  }

  return (
    <section
      id="box"
      aria-labelledby="box-title"
      className="scroll-mt-28 rounded-[2rem] bg-white p-5 shadow-card sm:p-8"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="box-title" className="text-[clamp(1.62rem,3.06vw,2.14rem)] leading-none">
            {t("title")}
          </h2>
          <p className="mt-2 max-w-lg text-muted">{t("lead")}</p>
        </div>
        <div role="radiogroup" aria-label={t("size")} className="flex gap-2">
          {sorted.map((b) => (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={b.id === box.id}
              onClick={() => chooseBox(b.id)}
              className={cn(
                "h-12 rounded-full border-2 px-5 text-sm font-semibold",
                b.id === box.id
                  ? "border-plum bg-plum text-white"
                  : "border-line bg-white hover:border-plum/40",
              )}
            >
              {b.boxSize === 6 ? t("six") : t("twelve")}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* The box */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[1.5rem] bg-magenta p-3 shadow-lift sm:p-4">
            <ol
              ref={boxRef}
              className={cn(
                "grid gap-2 rounded-2xl bg-magenta-soft p-3 transition-[background-color,box-shadow] duration-150",
                size === 6 ? "grid-cols-3" : "grid-cols-4",
                carrying && "bg-white shadow-[inset_0_0_0_3px_var(--color-sun)]",
              )}
              aria-label={t("left", { count: left })}
            >
              {cells.map((p, i) => {
                return (
                  <li key={i} data-free={p ? undefined : "1"} className="aspect-square">
                    {p ? (
                      <button
                        type="button"
                        onClick={() => removeAt(i)}
                        aria-label={t("remove", { name: pick(p.name, locale) })}
                        className="relative block size-full animate-pop overflow-hidden rounded-full bg-white ring-2 ring-white transition-transform"
                      >
                        {p.img ? (
                          <Image
                            src={p.img.src}
                            alt=""
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : null}
                      </button>
                    ) : (
                      <span
                        className={cn(
                          "grid size-full place-items-center rounded-full border-2 border-dashed border-magenta/40 text-xs text-magenta-ink transition-[scale,background-color,border-color] duration-150 ease-out",
                          over === i && "scale-105 border-solid border-magenta bg-magenta/10",
                        )}
                        aria-label={t("slot", { n: i + 1 })}
                      >
                        {i + 1}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold" aria-live="polite">
              {t("left", { count: left })}
            </p>
            <div className="flex items-center gap-2">
              {packed.length ? (
                <button
                  type="button"
                  onClick={() => setSlots([])}
                  className="inline-flex h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold text-muted hover:text-plum"
                >
                  <ArrowCounterClockwise size={16} aria-hidden /> {t("clear")}
                </button>
              ) : null}
              {box.priceOnRequest ? null : (
                <button
                  type="button"
                  disabled={left !== 0}
                  onClick={(e) => {
                    cart.add({
                      productId: box.id,
                      quantity: 1,
                      optionIds: [],
                      messages: [],
                      contents: packed.map((p) => p.id),
                      name: box.name,
                      unitPriceAmd: total,
                      image: packed[0]?.img?.src ?? box.img?.src ?? null,
                      detail: { contents: packed.map((p) => p.name) },
                      leadTimeDays: Math.max(
                        box.leadTimeDays,
                        ...packed.map((p) => p.leadTimeDays),
                      ),
                    });
                    announceAdd(e.currentTarget);
                    setSlots([]);
                  }}
                  className="h-12 rounded-full bg-plum px-6 font-semibold text-white transition-transform disabled:translate-y-0 disabled:opacity-45"
                >
                  {t("add", { price: formatAmd(total, locale) })}
                </button>
              )}
            </div>
          </div>
          {box.priceOnRequest ? (
            <>
              <p className="mt-1 text-sm text-muted">
                {t("boxFeeOnRequest", { price: formatAmd(donutsTotal, locale) })}
              </p>
              <AskPrice
                className="mt-4"
                item={`${pick(box.name, locale)}${
                  packed.length ? `: ${packed.map((p) => pick(p.name, locale)).join(", ")}` : ""
                }`}
              />
            </>
          ) : (
            <p className="mt-1 text-sm text-muted">
              {t("boxFee", { price: formatAmd(box.priceAmd, locale) })}
            </p>
          )}
        </div>

        {/* The donuts to choose from */}
        <div>
          <p className="mb-3 font-hand text-xl text-magenta-ink">{t("pick")}</p>
          <ul ref={listRef} className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-4">
            {available.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  disabled={left === 0}
                  onPointerDown={(e) => onPointerDown(e, d)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerEnd}
                  onPointerCancel={onPointerEnd}
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={() => {
                    if (justDragged.current) {
                      justDragged.current = false;
                      return;
                    }
                    put(d);
                  }}
                  className="group flex w-full cursor-grab touch-manipulation flex-col items-center gap-1 rounded-2xl p-1 text-center select-none [-webkit-touch-callout:none] active:cursor-grabbing disabled:cursor-default disabled:opacity-50"
                >
                  <span className="relative block aspect-square w-full overflow-hidden rounded-full bg-magenta-soft transition-transform duration-200 ease-out group-hover:scale-[1.04] group-active:scale-95">
                    {d.img ? (
                      <Image
                        src={d.img.src}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 140px, 30vw"
                        draggable={false}
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="text-xs leading-tight font-semibold">
                    {pick(d.name, locale)}
                  </span>
                  <span className="text-xs text-muted">{formatAmd(d.priceAmd, locale)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {tray ? (
        <div className="fixed inset-x-3 top-[80px] z-[90] mx-auto max-w-md animate-panel rounded-2xl bg-magenta p-2 shadow-lift lg:hidden">
          <ol
            ref={trayRef}
            aria-hidden
            className={cn(
              "grid gap-1.5 rounded-xl bg-white p-2",
              size === 6 ? "grid-cols-6" : "grid-cols-6 grid-rows-2",
            )}
          >
            {cells.map((p, i) => (
              <li
                key={i}
                data-free={p ? undefined : "1"}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-full border-2 border-dashed border-magenta/40 transition-[scale,background-color,border-color] duration-150",
                  p && "border-solid border-white",
                  over === i && "scale-110 border-solid border-magenta bg-magenta/10",
                )}
              >
                {p?.img ? (
                  <Image src={p.img.src} alt="" fill sizes="48px" className="object-cover" />
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
