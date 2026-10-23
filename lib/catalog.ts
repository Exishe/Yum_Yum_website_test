import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import {
  categories,
  deliveryZones,
  productOptions,
  products,
  reviews,
  shops,
  type Localized,
  type WeekHours,
} from "@/db/schema";

export const CATALOG_TAG = "catalog";
export const SHOPS_TAG = "shops";
export const ZONES_TAG = "zones";
export const REVIEWS_TAG = "reviews";

export type MenuOption = {
  id: number;
  kind: "size" | "syrup" | "filling" | "text" | "extra";
  name: Localized;
  priceDeltaAmd: number;
  isDefault: boolean;
  maxLength: number | null;
};

export type MenuProduct = {
  id: number;
  categoryId: number;
  slug: string;
  name: Localized;
  description: Localized | null;
  priceAmd: number;
  image: string | null;
  imageAlt: Localized | null;
  tags: string[];
  badges: string[];
  isAvailable: boolean;
  isFeatured: boolean;
  leadTimeDays: number;
  boxSize: number | null;
  options: MenuOption[];
};

export type MenuCategory = {
  id: number;
  slug: string;
  name: Localized;
  description: Localized | null;
  image: string | null;
  inMenu: boolean;
  products: MenuProduct[];
};

export const getMenu = unstable_cache(
  async (): Promise<MenuCategory[]> => {
    const [cats, prods, opts] = await Promise.all([
      db
        .select()
        .from(categories)
        .where(eq(categories.isPublished, true))
        .orderBy(asc(categories.sortOrder), asc(categories.id)),
      db
        .select()
        .from(products)
        .where(eq(products.isPublished, true))
        .orderBy(asc(products.sortOrder), asc(products.id)),
      db
        .select()
        .from(productOptions)
        .orderBy(asc(productOptions.sortOrder), asc(productOptions.id)),
    ]);
    const optsByProduct = new Map<number, MenuOption[]>();
    for (const o of opts) {
      const list = optsByProduct.get(o.productId) ?? [];
      list.push({
        id: o.id,
        kind: o.kind,
        name: o.name,
        priceDeltaAmd: o.priceDeltaAmd,
        isDefault: o.isDefault,
        maxLength: o.maxLength,
      });
      optsByProduct.set(o.productId, list);
    }
    return cats.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      image: c.image,
      inMenu: c.inMenu,
      products: prods
        .filter((p) => p.categoryId === c.id)
        .map((p) => ({
          id: p.id,
          categoryId: p.categoryId,
          slug: p.slug,
          name: p.name,
          description: p.description,
          priceAmd: p.priceAmd,
          image: p.image,
          imageAlt: p.imageAlt,
          tags: p.tags,
          badges: p.badges,
          isAvailable: p.isAvailable,
          isFeatured: p.isFeatured,
          leadTimeDays: p.leadTimeDays,
          boxSize: p.boxSize,
          options: optsByProduct.get(p.id) ?? [],
        })),
    }));
  },
  ["menu"],
  { tags: [CATALOG_TAG], revalidate: 600 },
);

export function minPrice(cat: MenuCategory): number | null {
  const prices = cat.products.filter((p) => p.isAvailable && !p.boxSize).map((p) => p.priceAmd);
  return prices.length ? Math.min(...prices) : null;
}

export type PublicShop = {
  id: number;
  slug: string;
  name: Localized;
  address: Localized;
  district: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  hours: WeekHours | null;
  hoursNote: Localized | null;
  isMall: boolean;
  image: string | null;
  googleMapsUrl: string | null;
  yandexMapsUrl: string | null;
  twoGisUrl: string | null;
  pickupEnabled: boolean;
};

export const getShops = unstable_cache(
  async (): Promise<PublicShop[]> => {
    const rows = await db
      .select()
      .from(shops)
      .where(eq(shops.isActive, true))
      .orderBy(asc(shops.sortOrder), asc(shops.id));
    return rows.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      address: s.address,
      district: s.district,
      lat: s.lat,
      lng: s.lng,
      phone: s.phone,
      hours: s.hours,
      hoursNote: s.hoursNote,
      isMall: s.isMall,
      image: s.image,
      googleMapsUrl: s.googleMapsUrl,
      yandexMapsUrl: s.yandexMapsUrl,
      twoGisUrl: s.twoGisUrl,
      pickupEnabled: s.pickupEnabled,
    }));
  },
  ["shops"],
  { tags: [SHOPS_TAG], revalidate: 600 },
);

export type PublicZone = {
  id: number;
  name: Localized;
  districts: string[];
  feeAmd: number;
  minOrderAmd: number;
  freeFromAmd: number | null;
  etaMinutes: number;
};

export const getZones = unstable_cache(
  async (): Promise<PublicZone[]> => {
    const rows = await db
      .select()
      .from(deliveryZones)
      .where(eq(deliveryZones.isActive, true))
      .orderBy(asc(deliveryZones.sortOrder));
    return rows.map((z) => ({
      id: z.id,
      name: z.name,
      districts: z.districts,
      feeAmd: z.feeAmd,
      minOrderAmd: z.minOrderAmd,
      freeFromAmd: z.freeFromAmd,
      etaMinutes: z.etaMinutes,
    }));
  },
  ["zones"],
  { tags: [ZONES_TAG], revalidate: 600 },
);

export type PublicReview = {
  id: number;
  author: string;
  platform: string;
  url: string | null;
  rating: number | null;
  quote: string;
  quoteLocale: string;
};

export const getReviews = unstable_cache(
  async (): Promise<PublicReview[]> => {
    const rows = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.isApproved, true)))
      .orderBy(asc(reviews.sortOrder), asc(reviews.id));
    return rows.map((r) => ({
      id: r.id,
      author: r.author,
      platform: r.platform,
      url: r.url,
      rating: r.rating,
      quote: r.quote,
      quoteLocale: r.quoteLocale,
    }));
  },
  ["reviews"],
  { tags: [REVIEWS_TAG], revalidate: 600 },
);
