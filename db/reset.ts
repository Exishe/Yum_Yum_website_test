// Drops every table in the local database. Refuses to run against anything
// that does not look like a local database.
import { scriptDb } from "./script-client";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/localhost|127\.0\.0\.1|host\.docker\.internal/.test(url)) {
    console.error("db:reset only runs against a local database. DATABASE_URL points elsewhere.");
    process.exit(1);
  }
  const { sql } = scriptDb();
  await sql.unsafe(
    `DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public;`,
  );
  await sql.end();
  console.log("Local database wiped.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
