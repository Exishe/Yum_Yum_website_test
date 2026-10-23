"use client";

import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState, useTransition } from "react";
import { Turnstile } from "@/components/ui/Turnstile";
import { sendContact } from "@/lib/actions";

export function ContactForm() {
  const t = useTranslations("contact");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const tk = useTranslations("checkout");
  const locale = useLocale();
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [token, setToken] = useState("");
  const onToken = useCallback((v: string) => setToken(v), []);

  if (done)
    return (
      <p
        role="status"
        className="flex items-center gap-3 rounded-2xl bg-white p-6 text-lg shadow-card"
      >
        <CheckCircle size={28} className="text-magenta" aria-hidden /> {t("sent")}
      </p>
    );

  const input =
    "mt-1 w-full rounded-2xl border-2 border-line bg-white px-4 py-3 focus:border-plum focus:outline-none aria-invalid:border-magenta";
  const err = (k: string) =>
    fields[k] ? (
      <p id={`c-${k}-err`} className="mt-1 text-sm text-magenta-ink">
        {te(fields[k] as "required")}
      </p>
    ) : null;

  return (
    <form
      noValidate
      className="flex flex-col gap-4 rounded-[var(--radius-xl2)] bg-white p-5 shadow-card sm:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const res = await sendContact({
            name: String(f.get("name") ?? ""),
            contact: String(f.get("contact") ?? ""),
            message: String(f.get("message") ?? ""),
            website: String(f.get("website") ?? ""),
            locale,
            turnstileToken: token || undefined,
          });
          if (res.ok) setDone(true);
          else {
            setFields(res.fields ?? {});
            setError(te(res.error as "generic"));
          }
        });
      }}
    >
      <label className="font-semibold">
        {t("name")}
        <input
          name="name"
          autoComplete="name"
          required
          maxLength={60}
          aria-invalid={!!fields.name}
          aria-describedby={fields.name ? "c-name-err" : undefined}
          className={input}
        />
        {err("name")}
      </label>
      <label className="font-semibold">
        {t("contact")}
        <input
          name="contact"
          autoComplete="tel"
          required
          maxLength={120}
          aria-invalid={!!fields.contact}
          aria-describedby={fields.contact ? "c-contact-err" : undefined}
          className={input}
        />
        {err("contact")}
      </label>
      <label className="font-semibold">
        {t("message")}
        <textarea
          name="message"
          rows={5}
          required
          maxLength={2000}
          aria-invalid={!!fields.message}
          aria-describedby={fields.message ? "c-message-err" : undefined}
          className={input}
        />
        {err("message")}
      </label>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />
      <Turnstile onToken={onToken} label={tk("turnstile")} locale={locale} />
      {error ? (
        <p role="alert" className="text-sm text-magenta-ink">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-13 rounded-full bg-plum py-3.5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? tc("sending") : tc("send")}
      </button>
    </form>
  );
}
