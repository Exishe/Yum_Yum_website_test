"use client";

import { ArrowRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { subscribeNewsletter } from "@/lib/actions";

export function NewsletterForm() {
  const t = useTranslations("footer");
  const te = useTranslations("errors");
  const locale = useLocale();
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <p role="status" className="mt-5 flex items-center gap-2 rounded-2xl bg-white/10 p-4 text-sm">
        <CheckCircle size={22} className="text-sun" aria-hidden /> {t("subscribed")}
      </p>
    );
  }

  return (
    <form
      className="mt-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const res = await subscribeNewsletter({
            email: String(form.get("email") ?? ""),
            website: String(form.get("website") ?? ""),
            locale,
          });
          if (res.ok) setDone(true);
          else setError(te(res.error as "generic"));
        });
      }}
    >
      <label htmlFor="nl-email" className="sr-only">
        {t("email")}
      </label>
      <div className="flex h-14 items-center rounded-full bg-white p-1.5 focus-within:ring-3 focus-within:ring-sun">
        <input
          id="nl-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          aria-invalid={!!error}
          aria-describedby={error ? "nl-error" : undefined}
          className="h-full min-w-0 flex-1 rounded-full bg-transparent px-4 text-plum placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-magenta px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {t("subscribe")} <ArrowRight size={16} weight="bold" aria-hidden />
        </button>
      </div>
      {/* Honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error ? (
        <p id="nl-error" role="alert" className="mt-2 text-sm text-pink-glow">
          {error}
        </p>
      ) : null}
    </form>
  );
}
