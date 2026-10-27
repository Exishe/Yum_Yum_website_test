import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** A string in each site language. Armenian is the source of truth. */
export type Localized = { hy: string; ru: string; en: string };

/** Opening hours per weekday, 0 = Sunday. `null` = closed that day. Times are "HH:MM" in Asia/Yerevan. */
export type WeekHours = Array<{ open: string; close: string } | null>;

export const userRole = pgEnum("user_role", ["admin", "staff"]);
export const orderStatus = pgEnum("order_status", [
  "new",
  "confirmed",
  "preparing",
  "on_the_way",
  "ready_for_pickup",
  "done",
  "cancelled",
]);
export const fulfilment = pgEnum("fulfilment", ["pickup", "delivery"]);
export const paymentMethod = pgEnum("payment_method", ["cash", "card_on_delivery", "online"]);
export const optionKind = pgEnum("option_kind", ["size", "syrup", "filling", "text", "extra"]);
export const subscriberStatus = pgEnum("subscriber_status", [
  "pending",
  "confirmed",
  "unsubscribed",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* ───────────────────────── Catalogue ───────────────────────── */

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: jsonb("name").$type<Localized>().notNull(),
  description: jsonb("description").$type<Localized>(),
  image: text("image"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  /** Shown in the header mega-menu and the home tabs. */
  inMenu: boolean("in_menu").notNull().default(true),
  ...timestamps,
});

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    slug: text("slug").notNull().unique(),
    name: jsonb("name").$type<Localized>().notNull(),
    description: jsonb("description").$type<Localized>(),
    /** Price in whole Armenian dram. */
    priceAmd: integer("price_amd").notNull(),
    /** True while the price is a seed value that the client has not confirmed. */
    priceIsSample: boolean("price_is_sample").notNull().default(true),
    /** No known price: the site shows "price on request" and asks the customer to call or write. */
    priceOnRequest: boolean("price_on_request").notNull().default(false),
    /** The same product on buy.am, for customers who prefer to order there. */
    buyamUrl: text("buyam_url"),
    image: text("image"),
    imageAlt: jsonb("image_alt").$type<Localized>(),
    /** Filter tags: glazed, chocolate, fruity, kids, gifts, filled, iced, hot … */
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** Badges: new, bestseller. */
    badges: text("badges")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    isAvailable: boolean("is_available").notNull().default(true),
    isPublished: boolean("is_published").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    /** Orders containing this product must be placed this many days ahead (bouquets: 1). */
    leadTimeDays: integer("lead_time_days").notNull().default(0),
    /** Box products: how many donuts fit in. */
    boxSize: integer("box_size"),
    sortOrder: integer("sort_order").notNull().default(0),
    source: text("source"),
    ...timestamps,
  },
  (t) => [index("products_category_idx").on(t.categoryId)],
);

export const productOptions = pgTable(
  "product_options",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    kind: optionKind("kind").notNull(),
    name: jsonb("name").$type<Localized>().notNull(),
    priceDeltaAmd: integer("price_delta_amd").notNull().default(0),
    isDefault: boolean("is_default").notNull().default(false),
    /** For kind = text: the longest message allowed. */
    maxLength: integer("max_length"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("product_options_product_idx").on(t.productId)],
);

/* ───────────────────────── Shops & delivery ───────────────────────── */

export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: jsonb("name").$type<Localized>().notNull(),
  address: jsonb("address").$type<Localized>().notNull(),
  district: text("district").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  phone: text("phone"),
  /** `null` means the shop follows the mall's hours (see hoursNote). */
  hours: jsonb("hours").$type<WeekHours>(),
  hoursNote: jsonb("hours_note").$type<Localized>(),
  isMall: boolean("is_mall").notNull().default(false),
  image: text("image"),
  googleMapsUrl: text("google_maps_url"),
  yandexMapsUrl: text("yandex_maps_url"),
  twoGisUrl: text("two_gis_url"),
  pickupEnabled: boolean("pickup_enabled").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  /** False until the client confirms the shop is still open. */
  isConfirmed: boolean("is_confirmed").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const deliveryZones = pgTable("delivery_zones", {
  id: serial("id").primaryKey(),
  name: jsonb("name").$type<Localized>().notNull(),
  /** District keys (see lib/districts.ts) covered by this zone. */
  districts: text("districts").array().notNull(),
  feeAmd: integer("fee_amd").notNull(),
  minOrderAmd: integer("min_order_amd").notNull().default(0),
  /** Orders above this subtotal ship free. `null` = never free. */
  freeFromAmd: integer("free_from_amd"),
  etaMinutes: integer("eta_minutes").notNull().default(60),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

/* ───────────────────────── Orders ───────────────────────── */

export type DeliveryAddress = {
  street: string;
  building: string;
  entrance?: string;
  floor?: string;
  apartment?: string;
};

export type OrderItemOptions = {
  options?: Array<{ id: number; name: string; priceDeltaAmd: number }>;
  /** Text written in glaze (name donuts) or one message per donut (bouquets). */
  messages?: string[];
  /** For boxes: the donuts packed inside. */
  contents?: Array<{ productId: number; name: string; priceAmd: number }>;
};

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Random, unguessable ID shown to the customer. Never expose `id`. */
    publicId: text("public_id").notNull().unique(),
    /** Short human number for the phone ("#4821"). Not secret, not unique forever. */
    shortCode: text("short_code").notNull(),
    status: orderStatus("status").notNull().default("new"),
    fulfilment: fulfilment("fulfilment").notNull(),
    shopId: integer("shop_id").references(() => shops.id, { onDelete: "set null" }),
    zoneId: integer("zone_id").references(() => deliveryZones.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    address: jsonb("address").$type<DeliveryAddress>(),
    district: text("district"),
    /** Start of the chosen slot, stored as UTC. */
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    slotLabel: text("slot_label").notNull(),
    comment: text("comment"),
    paymentMethod: paymentMethod("payment_method").notNull(),
    subtotalAmd: integer("subtotal_amd").notNull(),
    deliveryFeeAmd: integer("delivery_fee_amd").notNull().default(0),
    totalAmd: integer("total_amd").notNull(),
    locale: text("locale").notNull(),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    /** SHA-256 of the client IP + secret salt, for abuse checks only. */
    ipHash: text("ip_hash"),
    staffNote: text("staff_note"),
    anonymizedAt: timestamp("anonymized_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
    index("orders_phone_idx").on(t.phone),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    /** Product name at the time of order, in the customer's language. */
    name: text("name").notNull(),
    unitPriceAmd: integer("unit_price_amd").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalAmd: integer("line_total_amd").notNull(),
    details: jsonb("details").$type<OrderItemOptions>(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: serial("id").primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatus("from_status"),
    toStatus: orderStatus("to_status").notNull(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_status_history_order_idx").on(t.orderId)],
);

/* ───────────────────────── Content ───────────────────────── */

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  author: text("author").notNull(),
  platform: text("platform").notNull(),
  url: text("url"),
  rating: integer("rating"),
  /** Exactly as written by the reviewer. Never edited. */
  quote: text("quote").notNull(),
  /** Language the quote was written in. */
  quoteLocale: text("quote_locale").notNull(),
  reviewDate: text("review_date"),
  shopId: integer("shop_id").references(() => shops.id, { onDelete: "set null" }),
  isApproved: boolean("is_approved").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

/** Admin overrides of interface strings from messages/*.json. */
export const siteTexts = pgTable(
  "site_texts",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    locale: text("locale").notNull(),
    value: text("value").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("site_texts_key_locale_idx").on(t.key, t.locale)],
);

/** Key/value settings: banner, WhatsApp number, delivery links … */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  ...timestamps,
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  locale: text("locale").notNull(),
  status: subscriberStatus("status").notNull().default("pending"),
  tokenHash: text("token_hash"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  ...timestamps,
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  message: text("message").notNull(),
  locale: text("locale").notNull(),
  isHandled: boolean("is_handled").notNull().default(false),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ───────────────────────── Auth & audit ───────────────────────── */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("staff"),
  isActive: boolean("is_active").notNull().default(true),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  ...timestamps,
});

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the session token. The token itself lives only in the cookie. */
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    userEmail: text("user_email"),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    changes: jsonb("changes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_created_idx").on(t.createdAt)],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

export const notificationLog = pgTable("notification_log", {
  id: serial("id").primaryKey(),
  channel: text("channel").notNull(),
  subject: text("subject").notNull(),
  ok: boolean("ok").notNull(),
  error: text("error"),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductOption = typeof productOptions.$inferSelect;
export type Shop = typeof shops.$inferSelect;
export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatus = (typeof orderStatus.enumValues)[number];
export type Review = typeof reviews.$inferSelect;
export type User = typeof users.$inferSelect;
export type UserRole = (typeof userRole.enumValues)[number];
