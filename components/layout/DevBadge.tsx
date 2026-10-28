"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const GAP = 12;

/*
 * The developers' badge on the concept demo (settings in lib/demo-config.ts).
 * Markup and styles (app/globals.css) are Wiymood's own and kept as supplied.
 * Open on every page; × folds it into a pill that opens again by itself.
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
  const [lift, setLift] = useState(0);
  const badgeRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);

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
      >
        {mark}
        <span>{texts.label}</span>
      </button>
    </>
  );
}
