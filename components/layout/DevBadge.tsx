"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const GAP = 12;

/*
 * The developers' badge on the concept demo (settings in lib/demo-config.ts).
 * Open on every page; × folds it into a glowing pill that opens again by
 * itself. It rises above the site's own floating bars (anything marked
 * data-float-bottom) instead of covering them.
 */
export function DevBadge({
  texts,
  href,
  reopenAfterSeconds,
}: {
  texts: { label: string; title: string; button: string; collapse: string };
  href: string;
  reopenAfterSeconds: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [lift, setLift] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
  const setRef = (el: HTMLElement | null) => {
    ref.current = el;
  };

  // Every page starts with the badge open; the choice is never remembered.
  const [shownOn, setShownOn] = useState(pathname);
  if (shownOn !== pathname) {
    setShownOn(pathname);
    setOpen(true);
  }

  useEffect(() => {
    if (open) return;
    const timer = window.setTimeout(() => setOpen(true), reopenAfterSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [open, reopenAfterSeconds]);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const me = ref.current?.getBoundingClientRect();
        if (!me) return;
        let next = 0;
        for (const el of document.querySelectorAll<HTMLElement>("[data-float-bottom]")) {
          const r = el.getBoundingClientRect();
          if (!r.height || r.right <= me.left || r.left >= me.right) continue;
          next = Math.max(next, window.innerHeight - r.top);
        }
        setLift((prev) => (prev === next ? prev : next));
      });
    };
    measure();
    const mo = new MutationObserver(measure);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", measure);
    // Floating bars slide in; measure again once they have arrived.
    document.addEventListener("animationend", measure, true);
    document.addEventListener("transitionend", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      mo.disconnect();
      window.removeEventListener("resize", measure);
      document.removeEventListener("animationend", measure, true);
      document.removeEventListener("transitionend", measure, true);
    };
  }, [open]);

  const bottom = lift ? lift + GAP : GAP;

  if (!open) {
    return (
      <button
        ref={setRef}
        type="button"
        onClick={() => setOpen(true)}
        style={{ bottom }}
        className="dev-badge dev-badge-glow fixed left-3 z-[55] flex items-center gap-2 rounded-full border border-[#facc15]/60 bg-[#111827] py-1.5 pr-4 pl-1.5 transition-[bottom] duration-200 sm:left-5 print:hidden"
      >
        <span
          aria-hidden
          className="grid size-8 place-items-center rounded-full bg-[#facc15] font-mono text-[11px] font-bold text-[#111827]"
        >
          {"</>"}
        </span>
        <span className="text-[11px] font-bold tracking-[0.12em] text-[#facc15] uppercase">
          {texts.label}
        </span>
      </button>
    );
  }

  return (
    <aside
      ref={setRef}
      aria-label={texts.label}
      style={{ bottom }}
      className="dev-badge fixed inset-x-3 z-[55] flex items-start gap-3 rounded-[18px] border border-[#facc15]/70 bg-[#111827] p-4 pr-11 text-white shadow-[0_18px_40px_-12px_rgb(0_0_0/0.55)] transition-[bottom] duration-200 sm:right-auto sm:left-5 sm:w-[23rem] print:hidden"
    >
      <span
        aria-hidden
        className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#facc15] font-mono text-base font-bold text-[#111827]"
      >
        {"</>"}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold tracking-[0.12em] text-[#facc15] uppercase">
          {texts.label}
        </p>
        <p className="mt-1 text-[15px] leading-snug font-semibold">{texts.title}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-10 items-center rounded-full bg-[#facc15] px-4 text-sm font-bold text-[#111827] transition-colors hover:bg-[#fde047]"
        >
          {texts.button}
        </a>
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label={texts.collapse}
        className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full bg-white/10 text-lg leading-none text-white transition-colors hover:bg-white/20"
      >
        ×
      </button>
    </aside>
  );
}
