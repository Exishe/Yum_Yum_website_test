"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";

export function SubmitButton({
  children,
  className,
  confirm,
  name,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  confirm?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
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
        "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-plum px-5 text-sm font-semibold text-white hover:bg-plum-3 disabled:opacity-60",
        className,
      )}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
