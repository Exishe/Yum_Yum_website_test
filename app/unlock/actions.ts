"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SITE_GATE_COOKIE, passwordMatches, safeNext, siteGateToken } from "@/lib/site-gate";

export async function unlockAction(_: { error: boolean }, fd: FormData) {
  const next = safeNext(fd.get("next"));
  if (!passwordMatches(String(fd.get("password") ?? ""))) {
    // A short pause makes guessing slow.
    await new Promise((r) => setTimeout(r, 800));
    return { error: true };
  }
  (await cookies()).set(SITE_GATE_COOKIE, siteGateToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(next);
}
