import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { settings } from "@/db/schema";
import type { Localized } from "@/db/schema";
import { seedSettings } from "@/db/seed-data";

export type ContactSettings = {
  phones: string[];
  whatsapp: string | null;
  whatsappConfirmed: boolean;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  email: string | null;
};
export type BannerSettings = { enabled: boolean; text: Localized };
export type OrderingSettings = {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryHours: { open: string; close: string };
  pickupSlotMinutes: number;
  deliverySlotMinutes: number;
  minLeadMinutes: number;
  maxDaysAhead: number;
};
export type ExternalDelivery = Array<{ name: string; url: string; enabled: boolean }>;
export type Ratings = {
  google?: { rating: number; count: number; label?: string };
  yandex?: { rating: number; count: number; label?: string };
  buyam?: { rating: number };
};
export type LegalSettings = {
  companyName: string | null;
  taxId: string | null;
  address: string | null;
};

/** "Example, to be discussed" hints next to values the client has not confirmed yet. */
export type DemoNotesSettings = { enabled: boolean };

export type SiteSettings = {
  contact: ContactSettings;
  banner: BannerSettings;
  ordering: OrderingSettings;
  externalDelivery: ExternalDelivery;
  ratings: Ratings;
  legal: LegalSettings;
  demoNotes: DemoNotesSettings;
  foundedYear: number;
};

export const SETTINGS_TAG = "settings";

export const getSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const rows = await db.select().from(settings);
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { ...(seedSettings as SiteSettings), ...(map as Partial<SiteSettings>) };
  },
  ["site-settings"],
  { tags: [SETTINGS_TAG], revalidate: 300 },
);
