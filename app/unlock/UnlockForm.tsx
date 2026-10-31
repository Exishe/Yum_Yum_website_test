"use client";

import { useActionState } from "react";
import { unlockAction } from "./actions";

export function UnlockForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(unlockAction, { error: false });
  return (
    <form action={action} className="mt-6 flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <label className="text-sm font-semibold">
        Գաղտնաբառ · Пароль · Password
        <input
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="mt-1 h-12 w-full rounded-xl border-2 border-line bg-white px-3 focus:border-plum focus:outline-none"
        />
      </label>
      {state.error ? (
        <p role="alert" className="text-sm font-semibold text-magenta-ink">
          Սխալ գաղտնաբառ · Неверный пароль · Wrong password
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-full bg-plum font-semibold text-white disabled:opacity-60"
      >
        {pending ? "…" : "Մուտք · Войти · Enter"}
      </button>
    </form>
  );
}
