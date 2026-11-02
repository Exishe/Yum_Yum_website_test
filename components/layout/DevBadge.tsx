"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const GAP = 12;

/*
 * The developers' badge on the concept demo (settings in lib/demo-config.ts).
 * Markup and styles (app/globals.css) are Wiymood's own and kept as supplied.
 * Phones: open when a page loads; scrolling on or × folds it into a pill,
 * which opens again by itself unless the order bar is showing. Computers: a pill that opens while the pointer is on it.
 * It rises above the site's own floating bars (anything marked
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
  // On a computer the open badge would sit over the page, so there it starts
  // as the small pill and opens while the pointer is on it.
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (hover: hover)");
    const apply = () => {
      setCompact(mq.matches);
      setOpen(!mq.matches);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  const [lift, setLift] = useState(0);
  const badgeRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);

  // Every page starts with the badge open; the choice is never remembered.
  const [shownOn, setShownOn] = useState(pathname);
  if (shownOn !== pathname) {
    setShownOn(pathname);
    setOpen(!compact);
  }

  // Phones: it folds away once the visitor scrolls on, so it never sits over
  // the menu or the order bar for long.
  useEffect(() => {
    if (!open || compact) return;
    const start = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - start) > 320) setOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open, compact, shownOn]);

  useEffect(() => {
    if (open || compact) return;
    const timer = window.setTimeout(() => {
      // Not over the order bar: the pill stays a pill while one is showing.
      const barShowing = [...document.querySelectorAll<HTMLElement>("[data-float-bottom]")].some(
        (el) => el.getBoundingClientRect().height > 0,
      );
      if (!barShowing) setOpen(true);
    }, reopenAfterSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [open, compact, reopenAfterSeconds]);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const me = (open ? badgeRef : pillRef).current?.getBoundingClientRect();
        if (!me?.width) return;
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

  // Only overrides the stylesheet's corner position when something is in the way.
  const style = lift ? { bottom: lift + GAP } : undefined;
  const mark = (
    <span className="wm" aria-hidden>
      <span className="wm-mark">
        <span className="wm-w" />
        <i className="wm-dot" />
      </span>
    </span>
  );

  return (
    <>
      <aside
        ref={badgeRef}
        className="demo-badge"
        data-demo-badge
        aria-label={texts.label}
        hidden={!open}
        style={style}
        onMouseLeave={compact ? () => setOpen(false) : undefined}
      >
        {mark}
        <div className="demo-badge-body">
          <span className="demo-badge-label">{texts.label}</span>
          <strong>{texts.title}</strong>
          <div className="demo-badge-links">
            <a className="demo-badge-cta" href={href} rel="noopener" target="_blank">
              {texts.button}
            </a>
          </div>
        </div>
        <button
          type="button"
          data-demo-close
          aria-label={texts.collapse}
          onClick={() => setOpen(false)}
        >
          ×
        </button>
      </aside>
      <button
        ref={pillRef}
        type="button"
        className="demo-pill"
        data-demo-open
        hidden={open}
        style={style}
        onClick={() => setOpen(true)}
        onMouseEnter={compact ? () => setOpen(true) : undefined}
      >
        {mark}
        <span>{texts.label}</span>
      </button>
    </>
  );
}
