/*
 * Prepares the site for a quick local look: `pnpm demo`.
 * Without DATABASE_URL it uses the built-in database in .pglocal/ (nothing to
 * install), creates the tables, loads the real menu and a demo admin account.
 * Running it again keeps your test orders and edits.
 */
import { migrateDatabase } from "../db/migrate";
import { seedDatabase } from "../db/seed";
import { scriptDb } from "../db/script-client";

// Demo login shown to clients: demo / demo123. Never use it for the real shop.
const DEMO_LOGIN = "demo";
const DEMO_PASSWORD = "demo123";

async function main() {
  process.env.SEED_ADMIN_EMAIL ??= DEMO_LOGIN;
  const conn = scriptDb();
  await migrateDatabase(conn);
  await seedDatabase(conn, { demoPassword: DEMO_PASSWORD });
  await conn.close();
  const pw = process.env.SEED_ADMIN_PASSWORD || DEMO_PASSWORD;
  const email = process.env.SEED_ADMIN_EMAIL ?? DEMO_LOGIN;
  console.log(`
  ┌──────────────────────────────────────────────────────────┐
  │  YUM-YUM Donuts is starting…                              │
  │                                                          │
  │  Website:  http://localhost:3000/hy   (/ru  /en)          │
  │  Admin:    http://localhost:3000/admin                    │
  │            ${email.padEnd(22)} / ${pw.padEnd(20)}│
  │                                                          │
  │  Stop with Ctrl+C. Start again with: pnpm demo            │
  └──────────────────────────────────────────────────────────┘
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
