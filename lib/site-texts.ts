import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { siteTexts } from "@/db/schema";

export const TEXTS_TAG = "site-texts";

export const getTextOverrides = unstable_cache(
  async () =>
    db
      .select({ key: siteTexts.key, locale: siteTexts.locale, value: siteTexts.value })
      .from(siteTexts),
  ["site-texts"],
  { tags: [TEXTS_TAG], revalidate: 600 },
);
