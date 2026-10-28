"use client";

import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

/*
 * Minimal consent: the site sets no tracking cookies. The only optional thing
 * is cookieless, anonymous analytics, which loads only after "Allow".
 * The choice is stored in localStorage, not in a cookie.
 */
const KEY = "yy-consent-v1";
type Consent = "essential" | "analytics" | null;

const listeners = new Set<() => void>();
function read(): Consent {
  try {
    return (localStorage.getItem(KEY) as Consent) ?? null;
  } catch {
    return null;
  }
}
function write(value: Exclude<Consent, null>) {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}
function useConsent(): Consent | "unknown" {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => "unknown",
  );
}

export function openCookieSettings() {
  window.dispatchEvent(new Event("yy:cookie-settings"));
}

export function CookieSettingsButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className={cn("min-h-6 underline-offset-2 hover:underline", className)}
    >
      {children}
    </button>
  );
}

export function CookieConsent({
  analyticsSrc,
  analyticsDomain,
  nonce,
}: {
  analyticsSrc?: string;
  analyticsDomain?: string;
  nonce?: string;
}) {
  const t = useTranslations("cookies");
  const consent = useConsent();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const onOpen = () => {
      setAnalytics(read() === "analytics");
      setSettingsOpen(true);
    };
    window.addEventListener("yy:cookie-settings", onOpen);
    return () => window.removeEventListener("yy:cookie-settings", onOpen);
  }, []);

  // Load the analytics script only after consent, and only if one is configured.
  useEffect(() => {
    if (consent !== "analytics" || !analyticsSrc || document.getElementById("yy-analytics")) return;
    const s = document.createElement("script");
    s.id = "yy-analytics";
    s.defer = true;
    s.src = analyticsSrc;
    if (nonce) s.nonce = nonce;
    if (analyticsDomain) s.dataset.domain = analyticsDomain;
    // Umami uses data-website-id; Plausible uses data-domain.
    if (process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID)
      s.dataset.websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
    document.head.appendChild(s);
  }, [consent, analyticsSrc, analyticsDomain, nonce]);

  return (
    <>
      {consent === null ? (
        <div
          data-float-bottom
          role="region"
          aria-label={t("title")}
          className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-xl animate-rise rounded-3xl bg-white p-4 shadow-lift ring-1 ring-line sm:bottom-6 sm:p-5 lg:right-6 lg:left-auto lg:mx-0"
        >
          <p className="text-xs text-plum sm:text-sm">{t("text")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => write("analytics")}
              className="h-11 rounded-full bg-plum px-5 text-sm font-semibold text-white"
            >
              {t("accept")}
            </button>
            <button
              type="button"
              onClick={() => write("essential")}
              className="h-11 rounded-full border border-plum/25 px-5 text-sm font-semibold"
            >
              {t("essential")}
            </button>
          </div>
        </div>
      ) : null}

      <Dialog.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-plum/50 data-[state=open]:animate-fade" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed top-1/2 left-1/2 z-[71] w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-cream p-6 shadow-2xl"
          >
            <Dialog.Title className="font-display text-3xl">{t("title")}</Dialog.Title>
            <div className="mt-5 space-y-4">
              <label className="flex items-start gap-3 rounded-2xl bg-white p-4">
                <input type="checkbox" checked disabled className="mt-1 size-5 accent-magenta" />
                <span>
                  <span className="block font-semibold">{t("essentialTitle")}</span>
                  <span className="text-sm text-muted">{t("essentialText")}</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-4">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-1 size-5 accent-magenta"
                />
                <span>
                  <span className="block font-semibold">{t("analyticsTitle")}</span>
                  <span className="text-sm text-muted">{t("analyticsText")}</span>
                </span>
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                write(analytics ? "analytics" : "essential");
                setSettingsOpen(false);
              }}
              className="mt-6 h-12 w-full rounded-full bg-plum font-semibold text-white"
            >
              {t("save")}
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
