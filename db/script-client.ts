// Database connection for CLI scripts (migrate, seed, demo). Not imported by the app.
import { config } from "dotenv";
import { openDatabase } from "./connect";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

export function scriptDb() {
  const conn = openDatabase({ script: true });
  if (conn.kind === "pglite")
    console.log("No DATABASE_URL: using the built-in demo database in .pglocal/");
  return conn;
}
