"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import { useAdminT } from "./AdminLang";

export function SubmitButton({
  children,
  className,
  confirm,
  name,
  value,
  variant = "primary",
}: {
  children: React.ReactNode;
  className?: string;
  confirm?: string;
  name?: string;
  value?: string;
  /** secondary: outlined; danger: magenta, for cancel / block. */
  variant?: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();
  const t = useAdminT();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-60",
        variant === "primary" && "bg-plum text-white hover:bg-plum-3",
        variant === "secondary" && "bg-white text-plum ring-2 ring-plum/20 hover:ring-plum",
        variant === "danger" && "bg-magenta text-white hover:bg-magenta-ink",
        className,
      )}
    >
      {pending ? t("Saving…") : children}
    </button>
  );
}
