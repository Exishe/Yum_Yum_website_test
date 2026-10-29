"use client";

import { useAdminT } from "@/components/admin/AdminLang";

export function PrintButton() {
  const t = useAdminT();
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 items-center rounded-full border-2 border-plum/15 bg-white px-5 text-sm font-semibold print:hidden"
    >
      {t("Print")}
    </button>
  );
}
