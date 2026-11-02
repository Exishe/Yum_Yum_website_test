"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Sections ease in once as they scroll into view, the way a printed page is
 * turned to: a short rise and fade, children of a group one after another.
 *
 *   data-reveal        the element itself rises in
 *   data-reveal-group  each direct child rises in, 70 ms apart
 *
 * Anything already on screen when the page opens is shown as is, so nothing
 * blinks on load. Only elements armed here are ever hidden, so something that
 * mounts later is simply there. Without JS, or with reduced motion, everything is simply there.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;

    // A group is watched as one block (its rows may scroll sideways, out of
    // the viewport's reach); when it shows, its children follow in turn.
    const show = (el: Element) => {
      el.classList.add("is-in");
      if (el.hasAttribute("data-reveal-group"))
        Array.from(el.children).forEach((c) => c.classList.add("is-in"));
    };
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-group]"),
    );
    for (const group of targets) {
      if (!group.hasAttribute("data-reveal-group")) continue;
      Array.from(group.children).forEach((child, i) => {
        const el = child as HTMLElement;
        el.style.setProperty("--i", String(Math.min(i, 8)));
        el.setAttribute("data-reveal-item", "");
        el.setAttribute("data-armed", "");
      });
    }
    for (const el of targets) if (el.hasAttribute("data-reveal")) el.setAttribute("data-armed", "");

    const fold = window.innerHeight;
    for (const el of targets) if (el.getBoundingClientRect().top < fold * 0.92) show(el);
    root.classList.add("js-reveal");

    const pending = new Set(targets.filter((el) => !el.classList.contains("is-in")));
    const reveal = (el: Element) => {
      show(el);
      pending.delete(el as HTMLElement);
      io.unobserve(el);
      if (!pending.size) window.removeEventListener("scroll", onScroll);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) reveal(e.target);
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    // A fast fling can carry a block straight past the screen without it ever
    // counting as visible; anything that is already above the fold shows too.
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        for (const el of pending) if (el.getBoundingClientRect().top < 0) reveal(el);
      });
    };
    pending.forEach((el) => io.observe(el));
    if (pending.size) window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
