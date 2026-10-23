// Database client for CLI scripts (migrate, seed). Not imported by the app.
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

config({ path: ".env.local" });
config();

export function scriptDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env.local first.");
    process.exit(1);
  }
  const sql = postgres(url, { max: 1, prepare: !url.includes(":6543"), onnotice: () => {} });
  return { sql, db: drizzle(sql, { schema }) };
}
