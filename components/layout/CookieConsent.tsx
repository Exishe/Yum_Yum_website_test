"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

/*
 * Cookie consent, following the EU rules (GDPR and ePrivacy, as read by the
 * EDPB in 2023) that most international sites follow:
 * - only essential storage works before a choice (language, basket, site
 *   password, staff sign-in, this choice, spam protection on forms);
 * - visit counting (Vercel Analytics, Speed Insights, or an optional extra
 *   script) loads only after "Allow"; it is cookieless, but reading the
 *   visitor's device for statistics still needs consent;
 * - "Only essential" is as easy as "Allow": same size, same place;
 * - the choice can be changed at any time from the footer, and is asked
 *   again after 12 months.
 * The choice is kept in localStorage, not in a cookie.
 */
const KEY = "yy-consent-v2";
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
type Choice = "essential" | "analytics";
type Consent = Choice | null;

const listeners = new Set<() => void>();
function read(): Consent {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { c, t } = JSON.parse(raw) as { c?: string; t?: number };
    if ((c !== "essential" && c !== "analytics") || !t || Date.now() - t > MAX_AGE_MS) return null;
    return c;
  } catch {
    return null;
  }
}
function write(value: Choice) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ c: value, t: Date.now() }));
    localStorage.removeItem("yy-consent-v1");
  } catch {
    // Private mode: the choice lasts for this page only.
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
  vercel,
  analyticsSrc,
  analyticsDomain,
  nonce,
}: {
  /** Running on Vercel: its visit and speed statistics are available. */
  vercel?: boolean;
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

  // An optional extra analytics script, also only after consent.
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

  const button = "h-11 w-full rounded-full bg-plum px-5 text-sm font-semibold text-white sm:w-auto";

  return (
    <>
      {/* After "Allow" only. Withdrawing consent stops them from the next page load. */}
      {consent === "analytics" && vercel ? (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      ) : null}

      {consent === null ? (
        <div
          data-float-bottom
          role="region"
          aria-label={t("title")}
          className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-xl animate-rise rounded-3xl bg-white p-4 shadow-lift ring-1 ring-line sm:bottom-6 sm:p-5 lg:right-6 lg:left-auto lg:mx-0"
        >
          <p className="text-xs text-plum sm:text-sm">
            {t("text")}{" "}
            <Link href="/privacy" className="font-semibold underline underline-offset-2">
              {t("policy")}
            </Link>
          </p>
          <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <button type="button" onClick={() => write("analytics")} className={button}>
              {t("accept")}
            </button>
            <button type="button" onClick={() => write("essential")} className={button}>
              {t("essential")}
            </button>
            <button
              type="button"
              onClick={openCookieSettings}
              className="h-10 px-2 text-sm font-semibold text-plum underline underline-offset-2"
            >
              {t("customize")}
            </button>
          </div>
        </div>
      ) : null}

      <Dialog.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-plum/50 data-[state=open]:animate-fade" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed top-1/2 left-1/2 z-[71] max-h-[90dvh] w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-cream p-6 shadow-2xl"
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
            <p className="mt-3 text-center text-sm">
              <Link
                href="/privacy"
                onClick={() => setSettingsOpen(false)}
                className="underline underline-offset-2"
              >
                {t("policy")}
              </Link>
            </p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
