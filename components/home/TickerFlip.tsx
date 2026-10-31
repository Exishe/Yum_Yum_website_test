"use client";

import { useEffect, useRef, useState } from "react";

const EVERY_MS = 2600;

/**
 * Brand lines roll in one at a time, like a departures board: the old line
 * tips away upwards, the new one rolls up from below, and the yellow dots on
 * either side hop as it lands. Pauses off screen and for reduced motion.
 */
export function TickerFlip({ items }: { items: string[] }) {
  const [[i, prev], setPos] = useState<[number, number | null]>([0, null]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: number | undefined;
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(timer);
      if (e?.isIntersecting)
        timer = window.setInterval(() => setPos(([n]) => [(n + 1) % items.length, n]), EVERY_MS);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, [items.length]);

  const dot = (side: "l" | "r") => (
    <span aria-hidden className="flex items-end gap-1.5">
      {[0, 1, 2].map((n) => (
        <span
          key={`${i}-${side}${n}`}
          className="ticker-hop size-2.5 rounded-full bg-sun sm:size-3"
          style={{ animationDelay: `${(side === "l" ? 2 - n : n) * 70}ms` }}
        />
      ))}
    </span>
  );

  return (
    <div ref={ref} className="overflow-hidden bg-plum py-5 sm:py-6">
      <ul className="sr-only">
        {items.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <div
        aria-hidden
        className="mx-auto flex max-w-[1440px] items-center justify-center gap-4 px-4 sm:gap-8"
      >
        {dot("l")}
        <span className="ticker-stage relative grid h-[3.4rem] min-w-0 flex-1 place-items-center sm:h-[3.8rem] sm:max-w-3xl">
          {prev != null ? (
            <span
              key={`out-${prev}`}
              className="ticker-out col-start-1 row-start-1 truncate py-1 font-display text-[clamp(1.4rem,4vw,2.4rem)] leading-[1.35] whitespace-nowrap text-white"
            >
              {items[prev]}
            </span>
          ) : null}
          <span
            key={`in-${i}`}
            className="ticker-in col-start-1 row-start-1 truncate py-1 font-display text-[clamp(1.4rem,4vw,2.4rem)] leading-[1.35] whitespace-nowrap text-white"
          >
            {items[i]}
          </span>
        </span>
        {dot("r")}
      </div>
    </div>
  );
}
