/*
 * Seeds the database with YUM-YUM's real menu, shops and settings.
 * Safe to run more than once: existing rows are left alone, so prices the
 * client has edited in the admin panel are never overwritten.
 * Pass --force to overwrite catalogue rows with the seed values.
 */
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq, sql as dsql } from "drizzle-orm";
import { scriptDb } from "./script-client";
import * as s from "./schema";
import {
  SAMPLE,
  buyamProductUrls,
  seedCategories,
  seedProducts,
  seedReviews,
  seedSettings,
  seedShops,
  seedZones,
} from "./seed-data";

const force = process.argv.includes("--force");

export async function seedDatabase(
  { db }: { db: ReturnType<typeof scriptDb>["db"] },
  opts: { demoPassword?: string } = {},
) {
  for (const c of seedCategories) {
    const q = db.insert(s.categories).values({ ...c });
    await (force
      ? q.onConflictDoUpdate({ target: s.categories.slug, set: { ...c } })
      : q.onConflictDoNothing());
  }
  const cats = await db.select().from(s.categories);
  const catId = new Map(cats.map((c) => [c.slug, c.id]));

  let sort = 0;
  let inserted = 0;
  for (const p of seedProducts) {
    sort += 1;
    const { category, options, ...rest } = p;
    const values = {
      ...rest,
      tags: rest.tags ?? [],
      badges: rest.badges ?? [],
      categoryId: catId.get(category)!,
      sortOrder: sort,
      priceIsSample: true,
      priceOnRequest: rest.source === SAMPLE,
      buyamUrl: buyamProductUrls[rest.slug] ?? null,
    };
    const q = db.insert(s.products).values(values);
    const rows = await (force
      ? q.onConflictDoUpdate({ target: s.products.slug, set: values }).returning()
      : q.onConflictDoNothing().returning());
    const row = rows[0];
    if (!row) continue;
    inserted += 1;
    await db.delete(s.productOptions).where(eq(s.productOptions.productId, row.id));
    if (options?.length) {
      await db.insert(s.productOptions).values(
        options.map((o, i) => ({
          ...o,
          productId: row.id,
          sortOrder: i,
          isDefault: o.isDefault ?? false,
        })),
      );
    }
  }

  for (const [i, shop] of seedShops.entries()) {
    const values = { ...shop, sortOrder: i + 1 } as typeof s.shops.$inferInsert;
    const q = db.insert(s.shops).values(values);
    await (force
      ? q.onConflictDoUpdate({ target: s.shops.slug, set: values })
      : q.onConflictDoNothing());
  }

  const [{ zoneCount }] = (await db
    .select({ zoneCount: dsql<number>`count(*)::int` })
    .from(s.deliveryZones)) as [{ zoneCount: number }];
  if (zoneCount === 0) await db.insert(s.deliveryZones).values(seedZones);

  const [{ reviewCount }] = (await db
    .select({ reviewCount: dsql<number>`count(*)::int` })
    .from(s.reviews)) as [{ reviewCount: number }];
  if (reviewCount === 0) await db.insert(s.reviews).values(seedReviews);

  for (const [key, value] of Object.entries(seedSettings)) {
    await db.insert(s.settings).values({ key, value }).onConflictDoNothing();
  }

  // First admin. Credentials come from the environment; otherwise a random
  // password is generated and printed once.
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@yumyum.local").toLowerCase();
  const existing = await db.select().from(s.users).where(eq(s.users.email, email));
  if (existing.length === 0) {
    const password =
      process.env.SEED_ADMIN_PASSWORD || opts.demoPassword || randomBytes(12).toString("base64url");
    await db.insert(s.users).values({
      email,
      name: "Admin",
      role: "admin",
      passwordHash: await bcrypt.hash(password, 12),
      mustChangePassword: !process.env.SEED_ADMIN_PASSWORD && !opts.demoPassword,
    });
    console.log(`\nAdmin user created: ${email}`);
    if (!process.env.SEED_ADMIN_PASSWORD) console.log(`Password: ${password}\n`);
  }

  console.log(`Seed done. ${inserted} products ${force ? "written" : "added"}.`);
}

if (process.argv[1]?.includes("seed")) {
  const conn = scriptDb();
  seedDatabase(conn)
    .then(() => conn.close())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
