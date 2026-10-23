// Wipes the local database. Refuses to run against anything that is not local.
import { rmSync } from "node:fs";
import { DEMO_DATA_DIR } from "./connect";
import { scriptDb } from "./script-client";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) {
    rmSync(DEMO_DATA_DIR, { recursive: true, force: true });
    console.log("Built-in demo database removed.");
    return;
  }
  if (!/localhost|127\.0\.0\.1|host\.docker\.internal/.test(url)) {
    console.error("db:reset only runs against a local database. DATABASE_URL points elsewhere.");
    process.exit(1);
  }
  const conn = scriptDb();
  await conn.exec(
    `DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;`,
  );
  await conn.close();
  console.log("Local database wiped.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
