/*
 * `pnpm share`: runs the fast production version of the site on
 * http://localhost:3000 with the built-in demo database, ready to be shared
 * through a temporary tunnel (see README → "Share a preview link").
 * Search engines are told not to index it.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

// Preview settings. DATABASE_URL is forced empty so the built-in database is used.
Object.assign(process.env, {
  DATABASE_URL: "",
  ALLOW_DEMO_DATABASE: "1",
  ALLOW_NO_TURNSTILE: "1",
  PREVIEW_NOINDEX: "1",
  ORDER_RATE_LIMIT_PER_HOUR: process.env.ORDER_RATE_LIMIT_PER_HOUR ?? "30",
});

const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");

function run(args: string[], env: NodeJS.ProcessEnv = process.env) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, ...args], { stdio: "inherit", env });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`next ${args[0]} failed (${code})`)),
    );
  });
}

async function main() {
  // Tables, menu and demo admin (same as `pnpm demo`).
  const { migrateDatabase } = await import("../db/migrate");
  const { seedDatabase } = await import("../db/seed");
  const { scriptDb } = await import("../db/script-client");
  const conn = scriptDb();
  await migrateDatabase(conn);
  await seedDatabase(conn, { demoPassword: "yumyum-demo-2026" });
  await conn.close();

  console.log("\nBuilding the production version (takes 1–3 minutes)…\n");
  await run(["build"]);
  console.log(`
  ┌───────────────────────────────────────────────────────────────┐
  │  Preview is running on http://localhost:3000/hy               │
  │                                                               │
  │  To share it, open a SECOND PowerShell window and run:        │
  │    cloudflared tunnel --url http://localhost:3000             │
  │  and send people the https://….trycloudflare.com link it      │
  │  prints (add /hy, /ru or /en at the end).                     │
  │                                                               │
  │  The link works while this window and that one stay open.     │
  └───────────────────────────────────────────────────────────────┘
`);
  await run(["start", "-p", "3000"], { ...process.env, NODE_ENV: "production" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
