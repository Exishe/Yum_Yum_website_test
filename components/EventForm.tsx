"use client";

import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState, useTransition } from "react";
import { PhoneField } from "@/components/ui/PhoneField";
import { Turnstile } from "@/components/ui/Turnstile";
import { sendEventRequest } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { EVENT_ITEMS, EVENT_KINDS } from "@/lib/validation";

/** Corporate and event request: the staff call back with options and a price. */
export function EventForm() {
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const tk = useTranslations("checkout");
  const locale = useLocale();
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [kind, setKind] = useState<(typeof EVENT_KINDS)[number]>("office");
  const [items, setItems] = useState<string[]>(["donuts"]);
  const [token, setToken] = useState("");
  const onToken = useCallback((v: string) => setToken(v), []);
  const today = new Date().toISOString().slice(0, 10);

  if (done)
    return (
      <p
        role="status"
        className="flex items-center gap-3 rounded-[var(--radius-xl2)] bg-white p-6 text-lg shadow-card"
      >
        <CheckCircle size={28} className="shrink-0 text-magenta" aria-hidden /> {t("sent")}
      </p>
    );

  const input =
    "mt-1 w-full rounded-2xl border-2 border-line bg-white px-4 py-3 font-normal focus:border-plum focus:outline-none aria-invalid:border-magenta";
  const err = (k: string) =>
    fields[k] ? (
      <p id={`e-${k}-err`} className="mt-1 text-sm font-normal text-magenta-ink">
        {te(fields[k] as "required")}
      </p>
    ) : null;
  const chip = (on: boolean) =>
    cn(
      "inline-flex h-11 items-center rounded-full border-2 px-4 text-sm font-semibold transition-[background-color,border-color,color,scale] duration-150 ease-out active:scale-[0.97]",
      on ? "border-plum bg-plum text-white" : "border-line bg-white hover:border-plum/40",
    );

  return (
    <form
      noValidate
      aria-labelledby="event-form-title"
      className="flex flex-col gap-4 rounded-[var(--radius-xl2)] bg-white p-5 shadow-card sm:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const guests = String(f.get("guests") ?? "").trim();
        setError(null);
        start(async () => {
          const res = await sendEventRequest({
            name: String(f.get("name") ?? ""),
            phone: String(f.get("phone") ?? ""),
            company: String(f.get("company") ?? ""),
            kind,
            date: String(f.get("date") ?? ""),
            guests: guests ? Number(guests) : undefined,
            items,
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
      <h2 id="event-form-title" className="text-2xl leading-tight">
        {t("formTitle")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="font-semibold">
          {t("name")}
          <input
            name="name"
            autoComplete="name"
            required
            maxLength={60}
            aria-invalid={!!fields.name}
            aria-describedby={fields.name ? "e-name-err" : undefined}
            className={input}
          />
          {err("name")}
        </label>
        <div className="font-semibold">
          <label htmlFor="event-phone">{t("phone")}</label>
          <PhoneField
            id="event-phone"
            name="phone"
            required
            locale={locale}
            countryLabel={tc("country")}
            invalid={!!fields.phone}
            describedBy={fields.phone ? "e-phone-err" : undefined}
          />
          {err("phone")}
        </div>
      </div>
      <label className="font-semibold">
        {t("company")}
        <input name="company" autoComplete="organization" maxLength={80} className={input} />
      </label>

      <fieldset>
        <legend className="font-semibold">{t("kind")}</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup">
          {EVENT_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={chip(kind === k)}
            >
              {t(`kinds.${k}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="font-semibold">
          {t("date")}
          <input
            name="date"
            type="date"
            min={today}
            aria-invalid={!!fields.date}
            aria-describedby={fields.date ? "e-date-err" : undefined}
            className={input}
          />
          {err("date")}
        </label>
        <label className="font-semibold">
          {t("guests")}
          <input
            name="guests"
            type="number"
            inputMode="numeric"
            min={1}
            max={5000}
            aria-invalid={!!fields.guests}
            aria-describedby={fields.guests ? "e-guests-err" : undefined}
            className={input}
          />
          {err("guests")}
        </label>
      </div>

      <fieldset>
        <legend className="font-semibold">{t("items")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {EVENT_ITEMS.map((k) => {
            const on = items.includes(k);
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setItems((list) => (on ? list.filter((x) => x !== k) : [...list, k]))
                }
                className={chip(on)}
              >
                {t(`itemNames.${k}`)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="font-semibold">
        {t("message")}
        <textarea name="message" rows={4} maxLength={1500} className={input} />
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
        className="h-13 rounded-full bg-plum py-3.5 font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? tc("sending") : t("send")}
      </button>
      <p className="text-sm text-muted">{t("note")}</p>
    </form>
  );
}
