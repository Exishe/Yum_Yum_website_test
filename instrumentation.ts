import type { Instrumentation } from "next";

/**
 * Server errors (a page or an action that crashed) are reported to the
 * developer's Telegram chat, at most once per distinct message in 30 minutes.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const e = err as Error & { digest?: string };
  const message = (e?.message ?? String(err)).slice(0, 300);
  try {
    const { rateLimit } = await import("@/lib/security");
    if (!(await rateLimit(`server-error-msg:${message}`, 1, 1800))) return;
    const { notifyDeveloper } = await import("@/lib/notify");
    await notifyDeveloper(
      "Server error on the site",
      `${message}\n\n${request.method} ${request.path}\n${context.routeType} ${context.routePath}${
        e?.digest ? `\ndigest ${e.digest}` : ""
      }\n\n${(e?.stack ?? "").split("\n").slice(0, 6).join("\n")}`,
    );
  } catch (inner) {
    console.error("[onRequestError] could not report", inner);
  }
};
