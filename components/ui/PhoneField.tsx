"use client";

import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { parsePhoneNumberFromString } from "libphonenumber-js/min";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { COUNTRY_NAMES } from "@/lib/country-names";
import { TOP_COUNTRIES, countryOf, dialCode, flag, type CountryCode } from "@/lib/phone";

/** The value sent to the server: E.164 when the number is complete, else what was typed. */
function combine(country: CountryCode, national: string) {
  const raw = national.trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  return parsePhoneNumberFromString(raw, country)?.number ?? `${dialCode(country)}${raw}`;
}

/**
 * A phone number with its country: a country picker (flag and code, Armenia
 * first) joined to the number box. A pasted or autofilled international number
 * ("+33 6 …") switches the country by itself. Country names are built in
 * (lib/country-names), sorted for each site language.
 */
export function PhoneField({
  id,
  name,
  locale,
  countryLabel,
  invalid,
  describedBy,
  required,
  onValueChange,
}: {
  id: string;
  /** For plain forms: a hidden input with this name carries the full number. */
  name?: string;
  locale: string;
  countryLabel: string;
  invalid?: boolean;
  describedBy?: string;
  required?: boolean;
  onValueChange?: (value: string) => void;
}) {
  const [country, setCountry] = useState<CountryCode>("AM");
  const [national, setNational] = useState("");
  const options = useMemo(() => {
    const list = COUNTRY_NAMES[locale as keyof typeof COUNTRY_NAMES] ?? COUNTRY_NAMES.en;
    const name = new Map(list);
    const label = (c: string) =>
      `${flag(c as CountryCode)} ${name.get(c) ?? c} (${dialCode(c as CountryCode)})`;
    return {
      top: TOP_COUNTRIES.map((c) => ({ c, l: label(c) })),
      rest: list
        .filter(([c]) => !TOP_COUNTRIES.includes(c as CountryCode))
        .map(([c]) => ({ c, l: label(c) })),
    };
  }, [locale]);

  const update = (c: CountryCode, n: string) => {
    setCountry(c);
    setNational(n);
    onValueChange?.(combine(c, n));
  };

  return (
    <div
      className={cn(
        "mt-1 flex h-12 w-full overflow-hidden rounded-2xl border-2 bg-white font-normal transition-colors focus-within:border-plum",
        invalid ? "border-magenta" : "border-line",
      )}
    >
      <div className="relative flex shrink-0 items-center gap-1.5 border-r-2 border-line pr-2.5 pl-3 focus-within:bg-cream">
        <span aria-hidden className="text-lg leading-none">
          {flag(country)}
        </span>
        <span aria-hidden className="text-base font-semibold tabular-nums">
          {dialCode(country)}
        </span>
        <CaretDown aria-hidden size={14} weight="bold" className="text-muted" />
        <select
          aria-label={countryLabel}
          value={country}
          onChange={(e) => update(e.target.value as CountryCode, national)}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {options.top.map(({ c, l }) => (
            <option key={c} value={c}>
              {l}
            </option>
          ))}
          <option disabled>──────────</option>
          {options.rest.map(({ c, l }) => (
            <option key={c} value={c}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required={required}
        maxLength={25}
        value={national}
        placeholder={country === "AM" ? "94 30 15 74" : undefined}
        onChange={(e) => {
          const v = e.target.value;
          // A full international number picks its own country.
          const c = v.trim().startsWith("+") ? countryOf(v) : undefined;
          update(c ?? country, v);
        }}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="min-w-0 flex-1 bg-transparent px-3 text-base focus:outline-none"
      />
      {name ? <input type="hidden" name={name} value={combine(country, national)} /> : null}
    </div>
  );
}
