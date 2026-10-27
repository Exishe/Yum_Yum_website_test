import "server-only";
import { db } from "@/db";
import { notificationLog } from "@/db/schema";
import { env } from "./env";

type Message = { subject: string; text: string; orderId?: string };

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );
}

async function sendTelegram(m: Message) {
  if (!env.telegramToken || !env.telegramChatId) throw new Error("Telegram is not configured");
  const res = await fetch(`${env.telegramApi}/bot${env.telegramToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.telegramChatId,
      text: `<b>${escapeHtml(m.subject)}</b>\n\n${escapeHtml(m.text)}`,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  if (!env.resendKey) throw new Error("Email is not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.emailFrom, to: [to], subject, text, html }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

/**
 * Tells the shop about something (a new order, a contact message) on every
 * configured channel. Failures are logged and never block the customer.
 * With nothing configured, the message is written to the server log and the
 * notification log so it can still be checked in the admin panel.
 */
export async function notifyShop(m: Message) {
  const channels: Array<[string, () => Promise<void>]> = [];
  if (env.notifyChannels.includes("telegram") && env.telegramToken)
    channels.push(["telegram", () => sendTelegram(m)]);
  if (env.notifyChannels.includes("email") && env.resendKey && env.orderEmailTo)
    channels.push(["email", () => sendEmail(env.orderEmailTo, m.subject, m.text)]);

  if (channels.length === 0) {
    console.info(`[notify:console] ${m.subject}\n${m.text}`);
    await log("console", m, true);
    return;
  }
  await Promise.all(
    channels.map(async ([name, send]) => {
      try {
        await send();
        await log(name, m, true);
      } catch (err) {
        console.error(`[notify:${name}]`, err);
        await log(name, m, false, err instanceof Error ? err.message : String(err));
      }
    }),
  );
}

async function log(channel: string, m: Message, ok: boolean, error?: string) {
  try {
    await db.insert(notificationLog).values({
      channel,
      subject: m.subject.slice(0, 200),
      ok,
      error: error?.slice(0, 500),
      orderId: m.orderId,
    });
  } catch (err) {
    console.error("[notify] could not write log", err);
  }
}
