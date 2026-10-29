import { setAdminLangAction } from "@/app/admin/actions";
import { ADMIN_LANGS, type AdminLang } from "@/lib/admin-i18n";
import { cn } from "@/lib/cn";

const LABEL: Record<AdminLang, string> = { hy: "ՀԱՅ", en: "EN" };

/** ՀԱՅ / EN switch for the admin; the choice is kept in a cookie on this device. */
export function LangSwitch({ lang, dark }: { lang: AdminLang; dark?: boolean }) {
  return (
    <form action={setAdminLangAction} className="flex gap-1" aria-label="Language / Լեզու">
      {ADMIN_LANGS.map((l) => (
        <button
          key={l}
          type="submit"
          name="lang"
          value={l}
          aria-pressed={l === lang}
          className={cn(
            "h-9 rounded-full px-3 text-xs font-bold",
            l === lang
              ? dark
                ? "bg-white text-plum"
                : "bg-plum text-white"
              : dark
                ? "text-white/80 hover:bg-white/10"
                : "text-plum ring-1 ring-line hover:ring-plum",
          )}
        >
          {LABEL[l]}
        </button>
      ))}
    </form>
  );
}
