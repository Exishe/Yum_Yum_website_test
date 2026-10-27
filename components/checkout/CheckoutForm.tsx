"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Storefront, Moped, CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { Turnstile } from "@/components/ui/Turnstile";
import { Link, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { placeOrder } from "@/lib/actions";
import { cart, cartSubtotal, useCart } from "@/lib/cart-store";
import type { PublicShop, PublicZone } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { districts } from "@/lib/districts";
import { formatAmd, formatDayChip } from "@/lib/format";
import { t as pick } from "@/lib/localized";
import { availableDays, type OrderingRules } from "@/lib/ordering";
import { quoteDelivery } from "@/lib/pricing";
import { addDays, yerevanParts } from "@/lib/time";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation";
import { DemoNote } from "@/components/AskPrice";

type Props = {
  shops: PublicShop[];
  zones: PublicZone[];
  rules: OrderingRules & { pickupEnabled: boolean; deliveryEnabled: boolean };
};

type FormValues = CheckoutInput & { fulfilment: "pickup" | "delivery" };

const field =
  "mt-1 h-12 w-full rounded-2xl border-2 border-line bg-white px-4 text-base focus:border-plum focus:outline-none aria-invalid:border-magenta";

export function CheckoutForm({ shops, zones, rules }: Props) {
  const t = useTranslations("checkout");
  const te = useTranslations("errors");
  const tc = useTranslations("cart");
  const tco = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const state = useCart();
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  const onToken = useCallback((v: string) => setToken(v), []);

  // Time-dependent choices are computed in the browser after mount.
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const pickupShops = shops.filter((s) => s.pickupEnabled);
  const items = useMemo(
    () =>
      state.lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        optionIds: l.optionIds,
        messages: l.messages,
        contents: l.contents,
      })),
    [state.lines],
  );

  const resolver: Resolver<FormValues> = useCallback(
    (values, ctx, opts) => {
      const v = { ...values, items, locale };
      if (v.fulfilment === "pickup") {
        delete v.address;
        delete v.district;
      } else delete v.shopId;
      return zodResolver(checkoutSchema)(v, ctx, opts as never) as never;
    },
    [items, locale],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver,
    defaultValues: {
      fulfilment: rules.pickupEnabled ? "pickup" : "delivery",
      shopId: state.shopId ?? pickupShops[0]?.id,
      paymentMethod: "cash",
      items: [],
      locale,
      date: "",
      slot: "",
    },
  });

  const fulfilment = watch("fulfilment");
  const shopId = watch("shopId");
  const district = watch("district");
  const date = watch("date");
  const leadDays = state.lines.reduce((m, l) => Math.max(m, l.leadTimeDays), 0);
  const shop = pickupShops.find((s) => s.id === Number(shopId));

  const days = useMemo(
    () =>
      now
        ? availableDays({ fulfilment, shopHours: shop?.hours ?? null, rules, leadDays, now })
        : [],
    [now, fulfilment, shop, rules, leadDays],
  );
  const day = days.find((d) => d.dateKey === date) ?? days[0];

  // Keep the chosen date and time valid as the options change (shop, pickup/delivery, clock).
  const slot = watch("slot");
  useEffect(() => {
    if (!days.length) return;
    const d = days.find((x) => x.dateKey === date);
    if (!d) {
      setValue("date", days[0]!.dateKey);
      setValue("slot", days[0]!.slots[0]?.value ?? "");
    } else if (!d.slots.some((s) => s.value === slot)) {
      setValue("slot", d.slots[0]?.value ?? "");
    }
  }, [days, date, slot, setValue]);

  const subtotal = cartSubtotal(state);
  const quote = fulfilment === "delivery" ? quoteDelivery(district, subtotal, zones) : null;
  const fee = quote?.ok ? quote.feeAmd : 0;
  const total = subtotal + fee;
  const today = now ? yerevanParts(now).dateKey : "";

  const err = (path: string) => {
    const parts = path.split(".");
    let node: unknown = errors;
    for (const p of parts) node = (node as Record<string, unknown> | undefined)?.[p];
    const msg = (node as { message?: string } | undefined)?.message;
    return msg ? (
      <p id={`${path}-err`} className="mt-1 text-sm text-magenta-ink">
        {te.has(msg as "required") ? te(msg as "required") : te("required")}
      </p>
    ) : null;
  };
  const aria = (path: string) => {
    const has = !!path
      .split(".")
      .reduce<unknown>((n, p) => (n as Record<string, unknown> | undefined)?.[p], errors);
    return { "aria-invalid": has, "aria-describedby": has ? `${path}-err` : undefined };
  };

  if (state.lines.length === 0) {
    return (
      <div className="rounded-[var(--radius-xl2)] bg-white p-10 text-center shadow-card">
        <p className="text-lg">{t("empty")}</p>
        <Link
          href="/menu"
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-plum px-6 font-semibold text-white"
        >
          {tc("browse")} <ArrowRight size={18} weight="bold" aria-hidden />
        </Link>
      </div>
    );
  }

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    start(async () => {
      const payload = { ...values, items, locale, turnstileToken: token || undefined };
      if (payload.fulfilment === "pickup") {
        delete payload.address;
        delete payload.district;
      }
      const res = await placeOrder(payload);
      if (res.ok) {
        cart.clear();
        router.push({
          pathname: "/order/[publicId]",
          params: { publicId: res.publicId },
          query: { new: "1" },
        });
        return;
      }
      for (const [k, v] of Object.entries(res.fields ?? {})) setError(k as never, { message: v });
      const key = te.has(res.error as "generic") ? res.error : "generic";
      setFormError(te(key as "generic", res.params ?? {}));
    });
  });

  const section = "rounded-[var(--radius-xl2)] bg-white p-5 shadow-card sm:p-6";
  const legend = "font-display text-2xl";

  return (
    <form
      id="checkout-form"
      onSubmit={onSubmit}
      noValidate
      className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.9fr] lg:items-start"
    >
      <div className="flex flex-col gap-5">
        {/* How */}
        <div className={section}>
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className={cn(legend, "mb-4 p-0")}>{t("how")}</legend>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["pickup", t("pickup"), t("pickupSub"), Storefront, rules.pickupEnabled],
                  [
                    "delivery",
                    t("delivery"),
                    t("deliverySub", {
                      open: rules.deliveryHours.open,
                      close: rules.deliveryHours.close,
                    }),
                    Moped,
                    rules.deliveryEnabled,
                  ],
                ] as const
              ).map(([value, label, sub, Icon, enabled]) => (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1 rounded-2xl border-2 p-4 has-focus-visible:ring-3 has-focus-visible:ring-magenta",
                    fulfilment === value
                      ? "border-plum bg-plum text-white"
                      : "border-line hover:border-plum/40",
                    !enabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <input
                    type="radio"
                    value={value}
                    disabled={!enabled}
                    {...register("fulfilment")}
                    className="sr-only"
                  />
                  <Icon size={28} aria-hidden />
                  <span className="font-bold">{label}</span>
                  <span
                    className={cn("text-sm", fulfilment === value ? "text-white/80" : "text-muted")}
                  >
                    {sub}
                  </span>
                </label>
              ))}
            </div>
            {!rules.deliveryEnabled ? (
              <p className="mt-3 text-sm text-muted">{t("deliveryOff")}</p>
            ) : null}
          </fieldset>
        </div>

        {/* Where */}
        {fulfilment === "pickup" ? (
          <div className={section}>
            <label htmlFor="shopId" className={legend}>
              {t("shop")}
            </label>
            <select
              id="shopId"
              {...register("shopId", {
                setValueAs: (v) => (v ? Number(v) : undefined),
                onChange: (e) => cart.setShop(Number(e.target.value)),
              })}
              className={cn(field, "mt-3")}
              {...aria("shopId")}
            >
              <option value="">{t("shopPlaceholder")}</option>
              {pickupShops.map((s) => (
                <option key={s.id} value={s.id}>
                  {pick(s.name, locale)} · {pick(s.address, locale)}
                </option>
              ))}
            </select>
            {err("shopId")}
          </div>
        ) : (
          <div className={section}>
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className={cn(legend, "mb-4 p-0")}>
                {t("address")} <DemoNote className="ml-1" />
              </legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                <label className="col-span-2 font-semibold sm:col-span-6">
                  {t("district")}
                  <select
                    {...register("district")}
                    className={field}
                    {...aria("district")}
                    autoComplete="address-level3"
                  >
                    <option value="">{t("districtPlaceholder")}</option>
                    {districts.map((d) => (
                      <option key={d.key} value={d.key}>
                        {pick(d.name, locale)}
                      </option>
                    ))}
                  </select>
                  {err("district")}
                </label>
                <label className="col-span-2 font-semibold sm:col-span-4">
                  {t("street")}
                  <input
                    {...register("address.street")}
                    autoComplete="address-line1"
                    className={field}
                    {...aria("address.street")}
                  />
                  {err("address.street")}
                </label>
                <label className="col-span-2 font-semibold sm:col-span-2">
                  {t("building")}
                  <input
                    {...register("address.building")}
                    className={field}
                    {...aria("address.building")}
                  />
                  {err("address.building")}
                </label>
                {(["entrance", "floor", "apartment"] as const).map((k) => (
                  <label
                    key={k}
                    className="col-span-1 font-semibold last:col-span-2 sm:col-span-2 sm:last:col-span-2"
                  >
                    {t(k)}{" "}
                    <span className="text-sm font-normal text-muted">({tco("optional")})</span>
                    <input {...register(`address.${k}`)} className={field} />
                  </label>
                ))}
              </div>
              {quote && !quote.ok && quote.reason === "belowMinimum" ? (
                <p className="mt-3 rounded-2xl bg-sun-soft px-4 py-3 text-sm">
                  {t("minOrder", {
                    zone: pick(quote.zone.name, locale),
                    price: formatAmd(quote.minOrderAmd, locale),
                  })}{" "}
                  <DemoNote />
                </p>
              ) : null}
            </fieldset>
          </div>
        )}

        {/* When */}
        <div className={section}>
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className={cn(legend, "mb-4 p-0")}>{t("when")}</legend>
            <div>
              {leadDays > 0 ? (
                <p className="mb-3 flex items-center gap-2 rounded-2xl bg-sun-soft px-4 py-3 text-sm">
                  <CalendarBlank size={20} aria-hidden className="shrink-0" />
                  <span>
                    {t("leadNote")} <DemoNote />
                  </span>
                </p>
              ) : null}
              {!now ? (
                <p className="text-muted">…</p>
              ) : days.length === 0 ? (
                <p className="text-muted">{t("noSlots")}</p>
              ) : (
                <>
                  <p className="mb-2 text-sm font-semibold" id="date-label">
                    {t("date")}
                  </p>
                  <div
                    role="radiogroup"
                    aria-labelledby="date-label"
                    className="no-scrollbar snap-row -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
                  >
                    {days.map((d) => {
                      const label =
                        d.dateKey === today
                          ? t("today")
                          : d.dateKey === addDays(today, 1)
                            ? t("tomorrow")
                            : formatDayChip(d.dateKey, locale);
                      return (
                        <label
                          key={d.dateKey}
                          className={cn(
                            "flex min-h-12 shrink-0 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 px-4 text-sm font-semibold has-focus-visible:ring-3 has-focus-visible:ring-magenta",
                            (date || days[0]?.dateKey) === d.dateKey
                              ? "border-plum bg-plum text-white"
                              : "border-line",
                          )}
                        >
                          <input
                            type="radio"
                            value={d.dateKey}
                            className="sr-only"
                            {...register("date", {
                              onChange: () => setValue("slot", d.slots[0]?.value ?? ""),
                            })}
                          />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                  <label className="mt-4 block font-semibold" htmlFor="slot">
                    {t("slot")}
                  </label>
                  <select id="slot" {...register("slot")} className={field} {...aria("slot")}>
                    {day?.slots.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {err("slot")}
                </>
              )}
            </div>
          </fieldset>
        </div>

        {/* You */}
        <div className={section}>
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className={cn(legend, "mb-4 p-0")}>{t("you")}</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="font-semibold">
                {t("name")}
                <input
                  {...register("name")}
                  autoComplete="name"
                  maxLength={60}
                  className={field}
                  {...aria("name")}
                />
                {err("name")}
              </label>
              <label className="font-semibold">
                {t("phone")}
                <input
                  {...register("phone")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+374 "
                  maxLength={25}
                  className={field}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-err" : "phone-hint"}
                />
                {err("phone") ?? (
                  <span id="phone-hint" className="mt-1 block text-sm font-normal text-muted">
                    {t("phoneHint")}
                  </span>
                )}
              </label>
              <label className="font-semibold sm:col-span-2">
                {t("comment")}
                <textarea
                  {...register("comment")}
                  rows={3}
                  maxLength={500}
                  placeholder={t("commentPlaceholder")}
                  className={cn(field, "h-auto py-3")}
                />
              </label>
            </div>
          </fieldset>
        </div>

        {/* Payment */}
        <div className={section}>
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className={cn(legend, "mb-4 p-0")}>
              {t("payment")} <DemoNote className="ml-1" />
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(["cash", "card_on_delivery"] as const).map((m) => (
                <label
                  key={m}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 font-semibold has-checked:border-plum has-focus-visible:ring-3 has-focus-visible:ring-magenta",
                    "border-line",
                  )}
                >
                  <input
                    type="radio"
                    value={m}
                    {...register("paymentMethod")}
                    className="size-5 accent-magenta"
                  />
                  {m === "cash" ? t("cash") : t("cardOnDelivery")}
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">{t("onlineSoon")}</p>
          </fieldset>
        </div>
      </div>

      {/* Summary */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-28" aria-labelledby="summary-title">
        <div className={section}>
          <h2 id="summary-title" className={legend}>
            {t("summary")}
          </h2>
          <ul className="mt-4 divide-y divide-line">
            {state.lines.map((l) => (
              <li key={l.key} className="flex items-center gap-3 py-3">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-magenta-soft">
                  {l.image ? (
                    <Image src={l.image} alt="" fill sizes="48px" className="object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block font-semibold">
                    {l.quantity} × {pick(l.name, locale)}
                  </span>
                  {l.messages.length ? (
                    <span className="block text-muted">«{l.messages.join(" · ")}»</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatAmd(l.unitPriceAmd * l.quantity, locale)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-line pt-3">
            <div className="flex justify-between">
              <dt>{tc("subtotal")}</dt>
              <dd className="tabular-nums">{formatAmd(subtotal, locale)}</dd>
            </div>
            {fulfilment === "delivery" ? (
              <div className="flex justify-between">
                <dt>
                  {t("deliveryFee")} {fulfilment === "delivery" ? <DemoNote /> : null}
                </dt>
                <dd className="tabular-nums">
                  {quote?.ok ? (fee === 0 ? t("free") : formatAmd(fee, locale)) : "—"}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between pt-2 text-lg font-bold">
              <dt>{t("total")}</dt>
              <dd className="font-display text-2xl tabular-nums">{formatAmd(total, locale)}</dd>
            </div>
          </dl>

          <label className="mt-5 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              {...register("consent")}
              className="mt-0.5 size-5 shrink-0 accent-magenta"
              {...aria("consent")}
            />
            <span>
              {t.rich("consent", {
                link: (chunks) => (
                  <Link href="/privacy" target="_blank" className="font-semibold underline">
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </label>
          {err("consent")}
          <input
            type="text"
            {...register("website")}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="hidden"
          />
          <div className="mt-4">
            <Turnstile onToken={onToken} label={t("turnstile")} locale={locale} />
          </div>
          {formError ? (
            <p
              role="alert"
              className="mt-4 rounded-2xl bg-magenta-soft px-4 py-3 text-sm font-semibold text-plum"
            >
              {formError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending || !now || days.length === 0}
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-magenta text-lg font-bold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
          >
            {pending ? t("submitting") : t("submit", { price: formatAmd(total, locale) })}
          </button>
        </div>
      </aside>
    </form>
  );
}
