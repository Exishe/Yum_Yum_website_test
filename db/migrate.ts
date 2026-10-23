import { readFileSync } from "node:fs";
import { join } from "node:path";
import { scriptDb } from "./script-client";

export async function migrateDatabase(conn: ReturnType<typeof scriptDb>) {
  console.log("Running migrations…");
  await conn.migrate(join(process.cwd(), "db/migrations"));
  console.log("Applying row level security policies…");
  await conn.exec(readFileSync(join(process.cwd(), "db/policies.sql"), "utf8"));
}

if (process.argv[1]?.includes("migrate")) {
  const conn = scriptDb();
  migrateDatabase(conn)
    .then(() => conn.close())
    .then(() => console.log("Database is up to date."))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
