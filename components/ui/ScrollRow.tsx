"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

/**
 * A horizontal row that scrolls when its chips do not fit. The edges fade and
 * round arrow buttons appear only on the side that has more to show; the
 * selected chip (aria-selected / aria-pressed / aria-checked) is kept in view.
 */
export function ScrollRow({
  children,
  className,
  rowClassName,
  watch,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  rowClassName?: string;
  /** Changes when the selection changes, to bring the selected chip into view. */
  watch?: unknown;
}) {
  const t = useTranslations("common");
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ back: false, more: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const back = el.scrollLeft > 4;
    const more = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setEdges((e) => (e.back === back && e.more === more ? e : { back, more }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [measure]);

  useEffect(() => {
    const el = ref.current;
    const chip = el?.querySelector<HTMLElement>(
      '[aria-selected="true"],[aria-pressed="true"],[aria-checked="true"]',
    );
    if (!el || !chip) return;
    const pad = 48;
    const left = chip.offsetLeft - el.offsetLeft;
    const right = left + chip.offsetWidth;
    if (left < el.scrollLeft + pad) el.scrollTo({ left: left - pad, behavior: "smooth" });
    else if (right > el.scrollLeft + el.clientWidth - pad)
      el.scrollTo({ left: right - el.clientWidth + pad, behavior: "smooth" });
  }, [watch]);

  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  const arrow =
    "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-plum shadow-card transition-opacity hover:bg-sun-soft sm:grid";

  return (
    <div className={cn("relative min-w-0", className)}>
      <div
        ref={ref}
        {...rest}
        className={cn("no-scrollbar flex overflow-x-auto scroll-smooth", rowClassName)}
        style={{
          maskImage: `linear-gradient(to right, ${edges.back ? "transparent, #000 3rem" : "#000, #000"}, ${edges.more ? "#000 calc(100% - 3rem), transparent" : "#000"})`,
        }}
      >
        {children}
      </div>
      <button
        type="button"
        tabIndex={-1}
        aria-label={t("scrollBack")}
        onClick={() => go(-1)}
        className={cn(
          arrow,
          "left-0",
          edges.back ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <CaretLeft size={16} weight="bold" aria-hidden />
      </button>
      <button
        type="button"
        tabIndex={-1}
        aria-label={t("scrollMore")}
        onClick={() => go(1)}
        className={cn(
          arrow,
          "right-0",
          edges.more ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <CaretRight size={16} weight="bold" aria-hidden />
      </button>
    </div>
  );
}
