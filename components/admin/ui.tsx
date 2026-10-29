import { CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import type { Localized } from "@/db/schema";
import { decodeFlash } from "@/lib/admin-i18n";
import { adminT } from "@/lib/admin-lang";
import { cn } from "@/lib/cn";
export { SubmitButton } from "./SubmitButton";

/** Result message after a form; the text comes from the URL and is translated here. */
export async function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  const t = await adminT();
  const [text, params] = decodeFlash((error ?? ok)!);
  return (
    <p
      role={error ? "alert" : "status"}
      className={cn(
        "mb-5 flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-medium break-words",
        error ? "bg-magenta-soft text-plum" : "bg-[#dff5e8] text-[#14532d]",
      )}
    >
      {error ? (
        <WarningCircle size={20} className="shrink-0" aria-hidden />
      ) : (
        <CheckCircle size={20} className="shrink-0" aria-hidden />
      )}
      {t(text, params)}
    </p>
  );
}

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl sm:text-4xl">{title}</h1>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl bg-white p-5 shadow-card", className)}>{children}</div>;
}

export const inputCls =
  "mt-1 h-11 w-full rounded-xl border-2 border-line bg-white px-3 text-sm focus:border-plum focus:outline-none";

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  hint,
  required,
  className,
  ...rest
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  hint?: string;
  required?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue">) {
  return (
    <label className={cn("block text-sm font-semibold", className)}>
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        className={inputCls}
        {...rest}
      />
      {hint ? <span className="mt-1 block text-xs font-normal text-muted">{hint}</span> : null}
    </label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        className={cn(inputCls, "h-auto py-2")}
      />
    </label>
  );
}

export function Check({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex min-h-11 items-start gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-5 accent-magenta"
      />
      <span>
        <span className="font-semibold">{label}</span>
        {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

const LANGS = [
  ["hy", "Armenian"],
  ["ru", "Russian"],
  ["en", "English"],
] as const;

/** Three inputs, one per language. */
export async function LocalizedField({
  label,
  name,
  value,
  multiline,
  required,
}: {
  label: string;
  name: string;
  value?: Localized | null;
  multiline?: boolean;
  required?: boolean;
}) {
  const t = await adminT();
  return (
    <fieldset className="rounded-xl border border-line p-3">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {LANGS.map(([l, full]) => (
          <label key={l} className="block text-xs font-semibold text-muted" lang={l}>
            {t(full)}
            {multiline ? (
              <textarea
                name={`${name}.${l}`}
                defaultValue={value?.[l] ?? ""}
                rows={2}
                className={cn(inputCls, "h-auto py-2 text-plum")}
              />
            ) : (
              <input
                name={`${name}.${l}`}
                defaultValue={value?.[l] ?? ""}
                required={required}
                className={cn(inputCls, "text-plum")}
              />
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export const statusTone: Record<string, string> = {
  new: "bg-magenta text-white",
  confirmed: "bg-sun text-plum",
  preparing: "bg-sun-soft text-plum",
  on_the_way: "bg-[#d7efff] text-plum",
  ready_for_pickup: "bg-[#d7efff] text-plum",
  done: "bg-[#dff5e8] text-[#14532d]",
  cancelled: "bg-line text-muted",
};

export const statusLabel: Record<string, string> = {
  new: "New",
  confirmed: "Confirmed",
  preparing: "Preparing",
  on_the_way: "On the way",
  ready_for_pickup: "Ready for pickup",
  done: "Done",
  cancelled: "Cancelled",
};

export async function StatusBadge({ status }: { status: string }) {
  const t = await adminT();
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap",
        statusTone[status],
      )}
    >
      {statusLabel[status] ? t(statusLabel[status]) : status}
    </span>
  );
}

export const btn = {
  primary:
    "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-plum px-5 text-sm font-semibold text-white hover:bg-plum-3",
  ghost:
    "inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-plum/15 bg-white px-5 text-sm font-semibold hover:border-plum",
  danger:
    "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-magenta-soft px-5 text-sm font-semibold text-plum hover:bg-magenta hover:text-white",
};

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export function sp(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}
