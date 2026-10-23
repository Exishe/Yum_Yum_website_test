/*
 * Opens the database. With DATABASE_URL set it connects to PostgreSQL
 * (local Docker or Supabase). Without it, in development, it uses PGlite: a
 * real PostgreSQL compiled to WebAssembly that stores its data in the
 * `.pglocal` folder, so the site runs with no database to install ("demo mode").
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = ReturnType<typeof drizzlePostgres<typeof schema>>;

export type Connection = {
  kind: "postgres" | "pglite";
  db: Db;
  /** Runs a multi-statement SQL script (used for db/policies.sql). */
  exec: (sql: string) => Promise<void>;
  close: () => Promise<void>;
  migrate: (migrationsFolder: string) => Promise<void>;
};

export const DEMO_DATA_DIR = join(process.cwd(), ".pglocal");

export function isDemoDatabase() {
  return !process.env.DATABASE_URL;
}

export function openDatabase(opts: { script?: boolean } = {}): Connection {
  const url = process.env.DATABASE_URL;
  if (url) {
    const sql = postgres(url, {
      // Supabase's transaction pooler (port 6543) does not support prepared statements.
      prepare: !url.includes(":6543"),
      max: opts.script ? 1 : process.env.NODE_ENV === "production" ? 5 : 3,
      idle_timeout: 20,
      connect_timeout: 10,
      onnotice: () => {},
    });
    const db = drizzlePostgres(sql, { schema });
    return {
      kind: "postgres",
      db,
      exec: async (text) => void (await sql.unsafe(text)),
      close: () => sql.end(),
      migrate: async (folder) => {
        const { migrate } = await import("drizzle-orm/postgres-js/migrator");
        await migrate(db, { migrationsFolder: folder });
      },
    };
  }

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_DATABASE !== "1") {
    throw new Error(
      "DATABASE_URL is not set. Demo mode (built-in database) is for local use only.",
    );
  }
  // `next build` loads modules in several worker processes; give each a
  // throwaway in-memory database so they never touch the files at once.
  const building = process.env.NEXT_PHASE === "phase-production-build";
  if (!building) mkdirSync(DEMO_DATA_DIR, { recursive: true });
  const client = building ? new PGlite() : new PGlite(DEMO_DATA_DIR);
  const db = drizzlePglite(client, { schema }) as unknown as Db;
  return {
    kind: "pglite",
    db,
    exec: async (text) => void (await client.exec(text)),
    close: () => client.close(),
    migrate: async (folder) => {
      const { migrate } = await import("drizzle-orm/pglite/migrator");
      await migrate(db as never, { migrationsFolder: folder });
    },
  };
}

/** Rows from db.execute(): postgres-js returns an array, PGlite an object with `rows`. */
export function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  return ((result as { rows?: T[] }).rows ?? []) as T[];
}
