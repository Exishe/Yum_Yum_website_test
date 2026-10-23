"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}

/**
 * Cloudflare Turnstile. Renders nothing when no site key is configured
 * (local development); the server skips the check in that case too.
 */
export function Turnstile({
  onToken,
  label,
  locale,
  resetKey,
}: {
  onToken: (token: string) => void;
  label: string;
  locale: string;
  resetKey?: number;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    const el = ref.current;
    const render = () => {
      if (!window.turnstile || idRef.current) return;
      idRef.current = window.turnstile.render(el, {
        sitekey: siteKey,
        language: locale === "hy" ? "en" : locale,
        appearance: "interaction-only",
        callback: onToken,
        "expired-callback": () => onToken(""),
      });
    };
    if (window.turnstile) render();
    else if (!document.getElementById("cf-turnstile")) {
      const s = document.createElement("script");
      s.id = "cf-turnstile";
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      const nonce = document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')?.content;
      if (nonce) s.nonce = nonce;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      document.getElementById("cf-turnstile")!.addEventListener("load", render);
    }
    return () => {
      if (idRef.current && window.turnstile) window.turnstile.remove(idRef.current);
      idRef.current = null;
    };
  }, [siteKey, locale, onToken, resetKey]);

  if (!siteKey) return null;
  return <div ref={ref} aria-label={label} className="min-h-0" />;
}
