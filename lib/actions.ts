"use server";

/*
 * Public server actions: placing an order, the contact form and the
 * newsletter. Every input is validated again here with the same Zod schemas
 * the browser uses; nothing from the browser is trusted.
 */
import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { db } from "@/db";
import { contactMessages, newsletterSubscribers } from "@/db/schema";
import { isPhoneBlocked } from "./blocklist";
import { env } from "./env";
import { formatPhone } from "./format";
import { notifyShop, sendEmail } from "./notify";
import { contactMessage } from "./staff-message";
import { createOrder, orderNotification } from "./orders";
import { clientIp, hashValue, rateLimit, sha256, verifyTurnstile } from "./security";
import { getSettings } from "./settings";
import { checkoutSchema, contactSchema, newsletterSchema } from "./validation";

export type ActionResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string; params?: Record<string, string>; fields?: Record<string, string> };

function fieldErrors(issues: Array<{ path: PropertyKey[]; message: string }>) {
  const fields: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.map(String).join(".");
    if (!fields[key]) fields[key] = i.message;
  }
  return fields;
}

export async function placeOrder(input: unknown): Promise<ActionResult<{ publicId: string }>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fields = fieldErrors(parsed.error.issues);
    return { ok: false, error: Object.values(fields)[0] ?? "generic", fields };
  }
  const data = parsed.data;
  if (data.website) return { ok: false, error: "spam" };

  const ip = await clientIp();
  const perHour = Number(process.env.ORDER_RATE_LIMIT_PER_HOUR ?? 8);
  if (
    !(await rateLimit(`order:ip:${ip}`, perHour, 3600)) ||
    !(await rateLimit(`order:phone:${data.phone}`, Math.max(5, Math.ceil(perHour / 2)), 3600))
  ) {
    return { ok: false, error: "rateLimit" };
  }
  if (!(await verifyTurnstile(data.turnstileToken, ip))) return { ok: false, error: "turnstile" };
  // Blocked numbers get a neutral answer that points to the phone, not "you are blocked".
  if (await isPhoneBlocked(data.phone)) {
    const shopPhone = (await getSettings()).contact.phones[0] ?? "";
    return { ok: false, error: "blocked", params: { phone: formatPhone(shopPhone, "local") } };
  }

  try {
    const result = await createOrder(data, hashValue(ip));
    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        params: result.params,
        fields: result.field ? { [result.field]: result.error } : undefined,
      };
    }
    // Tell the shop after the customer already has their answer.
    after(async () => {
      const note = await orderNotification(result.publicId);
      if (note) await notifyShop({ subject: note.subject, text: note.text, orderId: note.orderId });
    });
    return { ok: true, publicId: result.publicId };
  } catch (err) {
    console.error("[placeOrder]", err);
    return { ok: false, error: "generic" };
  }
}

export async function sendContact(input: unknown): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    const fields = fieldErrors(parsed.error.issues);
    return { ok: false, error: Object.values(fields)[0] ?? "generic", fields };
  }
  const data = parsed.data;
  if (data.website) return { ok: false, error: "spam" };
  const ip = await clientIp();
  if (!(await rateLimit(`contact:${ip}`, 5, 3600))) return { ok: false, error: "rateLimit" };
  if (!(await verifyTurnstile(data.turnstileToken, ip))) return { ok: false, error: "turnstile" };

  try {
    await db.insert(contactMessages).values({
      name: data.name,
      contact: data.contact,
      message: data.message,
      locale: data.locale,
      ipHash: hashValue(ip),
    });
    after(() => notifyShop(contactMessage(data)));
    return { ok: true };
  } catch (err) {
    console.error("[sendContact]", err);
    return { ok: false, error: "generic" };
  }
}

const confirmText: Record<string, { subject: string; body: (url: string) => string }> = {
  hy: {
    subject: "Հաստատեք բաժանորդագրությունը՝ YUM-YUM Donuts",
    body: (u) =>
      `Բարև։\n\nՍեղմեք հղումը՝ YUM-YUM-ի տեղեկագիրը ստանալու համար․\n${u}\n\nԵթե դուք չեք բաժանորդագրվել, պարզապես անտեսեք այս նամակը։`,
  },
  ru: {
    subject: "Подтвердите подписку на YUM-YUM Donuts",
    body: (u) =>
      `Привет!\n\nНажмите на ссылку, чтобы получать рассылку YUM-YUM:\n${u}\n\nЕсли вы не подписывались, просто проигнорируйте это письмо.`,
  },
  en: {
    subject: "Confirm your YUM-YUM Donuts subscription",
    body: (u) =>
      `Hi!\n\nClick the link to get the YUM-YUM newsletter:\n${u}\n\nIf you didn’t sign up, just ignore this email.`,
  },
};

export async function subscribeNewsletter(input: unknown): Promise<ActionResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) {
    const fields = fieldErrors(parsed.error.issues);
    return { ok: false, error: Object.values(fields)[0] ?? "generic", fields };
  }
  const { email, locale, website } = parsed.data;
  if (website) return { ok: false, error: "spam" };
  const ip = await clientIp();
  if (!(await rateLimit(`newsletter:${ip}`, 5, 3600))) return { ok: false, error: "rateLimit" };

  // Double opt-in: store as pending with a one-time token; confirm by email link.
  const token = randomBytes(24).toString("base64url");
  try {
    const [row] = await db
      .insert(newsletterSubscribers)
      .values({ email, locale, status: "pending", tokenHash: sha256(token) })
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: { tokenHash: sha256(token), locale },
      })
      .returning({ status: newsletterSubscribers.status });
    // Same answer whether or not the address was already subscribed.
    if (row?.status !== "confirmed") {
      const url = `${env.siteUrl}/api/newsletter?action=confirm&token=${token}&locale=${locale}`;
      const copy = confirmText[locale] ?? confirmText.en!;
      after(async () => {
        try {
          await sendEmail(email, copy.subject, copy.body(url));
        } catch {
          console.info(`[newsletter] email not configured. Confirmation link for ${email}: ${url}`);
        }
      });
    }
    return { ok: true };
  } catch (err) {
    console.error("[subscribeNewsletter]", err);
    return { ok: false, error: "generic" };
  }
}
