"use client";

import { useEffect } from "react";

/**
 * Sends uncaught browser errors to /api/client-error, so the developer hears
 * about a broken page before a customer complains. At most 3 per page view.
 */
export function ErrorReporter() {
  useEffect(() => {
    let sent = 0;
    const send = (message: string, stack?: string) => {
      if (sent >= 3 || !message) return;
      sent++;
      const body = JSON.stringify({ message, stack, url: location.pathname + location.search });
      if (
        !navigator.sendBeacon?.("/api/client-error", new Blob([body], { type: "application/json" }))
      )
        void fetch("/api/client-error", { method: "POST", body, keepalive: true }).catch(() => {});
    };
    const onError = (e: ErrorEvent) => send(e.message, e.error?.stack);
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      send(r instanceof Error ? r.message : String(r), r instanceof Error ? r.stack : undefined);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
