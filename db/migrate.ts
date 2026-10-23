import { readFileSync } from "node:fs";
import { join } from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { scriptDb } from "./script-client";

async function main() {
  const { db, sql } = scriptDb();
  console.log("Running migrations…");
  await migrate(db, { migrationsFolder: join(process.cwd(), "db/migrations") });
  console.log("Applying row level security policies…");
  await sql.unsafe(readFileSync(join(process.cwd(), "db/policies.sql"), "utf8"));
  await sql.end();
  console.log("Database is up to date.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
