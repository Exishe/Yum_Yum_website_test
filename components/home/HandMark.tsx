"use client";

/* A marker stroke drawn once behind words, like a real highlighter.
   Rough Notation by Preet Shihn (MIT, https://github.com/rough-stuff/rough-notation).
   Reduced motion: the stroke is there at once. */
import { useEffect, useRef } from "react";
import { annotate } from "rough-notation";

export function HandMark({
  children,
  color = "#ffe14d",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const a = annotate(el, {
      type: "highlight",
      color,
      multiline: true,
      iterations: 1,
      animate: !reduce,
      animationDuration: 900,
    });
    const id = window.setTimeout(() => a.show(), reduce ? 0 : 500);
    return () => {
      window.clearTimeout(id);
      a.remove();
    };
  }, [color]);
  return (
    <span ref={ref} className="relative text-magenta-ink">
      {children}
    </span>
  );
}
