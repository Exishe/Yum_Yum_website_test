"use client";

import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * A footer column. On phones it folds into a tap-to-open row so the footer
 * is a short list of headings; from tablet width up it is always open.
 * Rendered open, so everything is reachable without JavaScript.
 */
export function FooterSection({
  title,
  id,
  className,
  children,
}: {
  title: string;
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia("(min-width: 640px)");
    const apply = () => {
      el.open = mq.matches;
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return (
    <details ref={ref} open className={cn("group border-b border-white/12 sm:border-0", className)}>
      <summary
        id={id}
        className="flex min-h-14 cursor-pointer list-none items-center justify-between font-sans text-xs font-bold tracking-[0.18em] text-sun uppercase sm:pointer-events-none sm:mb-4 sm:min-h-0 [&::-webkit-details-marker]:hidden"
      >
        {title}
        <CaretDown
          size={16}
          weight="bold"
          aria-hidden
          className="transition-transform group-open:rotate-180 sm:hidden"
        />
      </summary>
      <div className="pb-5 sm:pb-0">{children}</div>
    </details>
  );
}
