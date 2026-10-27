/*
 * Zod schemas shared by the browser forms and the server actions.
 * Error messages are translation keys under "errors.*" in messages/*.json.
 */
import { z } from "zod";
import { districtKeys } from "./districts";
import { normalizeArmenianPhone } from "./format";

// Our Content-Security-Policy forbids eval. Without this, zod probes for it with
// `new Function` on first use and the browser logs a CSP violation.
z.config({ jitless: true });

/** Trims, removes control characters and collapses runs of spaces. */
export function clean(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

const text = (min: number, max: number, key = "required") =>
  z
    .string()
    .transform(clean)
    .pipe(
      z
        .string()
        .min(min, { message: min > 0 ? key : "required" })
        .max(max, { message: "tooLong" }),
    );

const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? clean(v) : ""))
    .pipe(z.string().max(max, { message: "tooLong" }));

export const phoneSchema = z
  .string()
  .max(25, { message: "phone" })
  .transform((v, ctx) => {
    const phone = normalizeArmenianPhone(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "phone" });
      return z.NEVER;
    }
    return phone;
  });

export const localeSchema = z.enum(["hy", "ru", "en"]);

export const cartItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(50),
  optionIds: z.array(z.number().int().positive()).max(10).default([]),
  messages: z
    .array(z.string().transform(clean).pipe(z.string().max(60)))
    .max(12)
    .default([]),
  /** Product IDs packed into a box. */
  contents: z.array(z.number().int().positive()).max(12).default([]),
});
export type CartItemInput = z.input<typeof cartItemSchema>;

export const addressSchema = z.object({
  street: text(2, 120),
  building: text(1, 20),
  entrance: optionalText(10),
  floor: optionalText(10),
  apartment: optionalText(10),
});

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "date" });
const slotValue = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, { message: "slot" });

export const checkoutSchema = z
  .object({
    items: z.array(cartItemSchema).min(1, { message: "emptyCart" }).max(40),
    fulfilment: z.enum(["pickup", "delivery"]),
    shopId: z.number({ message: "shop" }).int().positive({ message: "shop" }).optional(),
    name: text(2, 60),
    phone: phoneSchema,
    address: addressSchema.optional(),
    district: z.enum(districtKeys, { message: "district" }).optional(),
    date: dateKey,
    slot: slotValue,
    comment: optionalText(500),
    paymentMethod: z.enum(["cash", "card_on_delivery"]),
    consent: z.literal(true, { message: "consent" }),
    locale: localeSchema,
    /** Honeypot: real people never see or fill this field. */
    website: z.string().max(0, { message: "spam" }).optional().default(""),
    turnstileToken: z.string().max(4096).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.fulfilment === "pickup" && !v.shopId) {
      ctx.addIssue({ code: "custom", path: ["shopId"], message: "shop" });
    }
    if (v.fulfilment === "delivery") {
      if (!v.address)
        ctx.addIssue({ code: "custom", path: ["address", "street"], message: "required" });
      if (!v.district) ctx.addIssue({ code: "custom", path: ["district"], message: "district" });
    }
    if (!v.slot.startsWith(v.date)) {
      ctx.addIssue({ code: "custom", path: ["slot"], message: "slot" });
    }
  });
export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;

export const contactSchema = z.object({
  name: text(2, 60),
  contact: text(5, 120),
  message: text(5, 2000),
  locale: localeSchema,
  website: z.string().max(0, { message: "spam" }).optional().default(""),
  turnstileToken: z.string().max(4096).optional(),
});
export type ContactInput = z.input<typeof contactSchema>;

export const newsletterSchema = z.object({
  email: z
    .string()
    .transform((v) => clean(v).toLowerCase())
    .pipe(z.email({ message: "email" }).max(160, { message: "tooLong" })),
  locale: localeSchema,
  website: z.string().max(0, { message: "spam" }).optional().default(""),
});
export type NewsletterInput = z.input<typeof newsletterSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.email().max(160)),
  password: z.string().min(1).max(200),
});

export const passwordSchema = z
  .string()
  .min(12, { message: "Use at least 12 characters." })
  .max(200)
  .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), {
    message: "Use letters and at least one number.",
  });
