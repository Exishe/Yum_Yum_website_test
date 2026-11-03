import { after, type NextRequest } from "next/server";
import { notifyDeveloper } from "@/lib/notify";
import { clientIp, rateLimit } from "@/lib/security";

/** Browser noise that is not the site's fault. */
const IGNORE = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,
  /chrome-extension:|moz-extension:|safari-extension:/i,
  /Non-Error promise rejection captured/i,
  /AbortError|The user aborted a request/i,
  /Load failed|Failed to fetch|NetworkError/i, // the visitor's connection dropped
];

/**
 * Errors from visitors' browsers (components/ErrorReporter.tsx). Each distinct
 * message is reported at most once in 30 minutes, and one visitor can send at
 * most 20 an hour, so a broken page cannot flood the chat.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > 8000) return new Response(null, { status: 413 });
  let body: { message?: unknown; stack?: unknown; url?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  const message = String(body.message ?? "")
    .slice(0, 300)
    .trim();
  if (!message || IGNORE.some((r) => r.test(message))) return new Response(null, { status: 204 });
  const stack = String(body.stack ?? "")
    .split("\n")
    .slice(0, 6)
    .join("\n")
    .slice(0, 1200);
  const url = String(body.url ?? "").slice(0, 300);
  const ip = await clientIp();
  if (!(await rateLimit(`client-error:${ip}`, 20, 3600)))
    return new Response(null, { status: 204 });
  if (!(await rateLimit(`client-error-msg:${message}`, 1, 1800)))
    return new Response(null, { status: 204 });
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 200);
  after(() =>
    notifyDeveloper(
      "Browser error on the site",
      `${message}\n\nPage: ${url}\nDevice: ${ua}\n\n${stack}`,
    ),
  );
  return new Response(null, { status: 204 });
}
