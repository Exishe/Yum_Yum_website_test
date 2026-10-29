import "server-only";
import { cookies } from "next/headers";
import { ADMIN_LANG_COOKIE, makeT, type AdminLang } from "./admin-i18n";

/** The admin's chosen language; Armenian unless they switched to English. */
export async function adminLang(): Promise<AdminLang> {
  return (await cookies()).get(ADMIN_LANG_COOKIE)?.value === "en" ? "en" : "hy";
}

export async function adminT() {
  return makeT(await adminLang());
}
