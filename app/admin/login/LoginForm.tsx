"use client";

import { useActionState } from "react";
import { useAdminT } from "@/components/admin/AdminLang";
import { loginAction } from "../actions";

export function LoginForm() {
  const t = useAdminT();
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <label className="text-sm font-semibold">
        {t("Login")}
        <input
          name="login"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          className="mt-1 h-12 w-full rounded-xl border-2 border-line px-3 focus:border-plum focus:outline-none"
        />
      </label>
      <label className="text-sm font-semibold">
        {t("Password")}
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 h-12 w-full rounded-xl border-2 border-line px-3 focus:border-plum focus:outline-none"
        />
      </label>
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-magenta-soft px-3 py-2 text-sm">
          {t(state.error)}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-full bg-plum font-semibold text-white disabled:opacity-60"
      >
        {pending ? t("Signing in…") : t("Sign in")}
      </button>
    </form>
  );
}
