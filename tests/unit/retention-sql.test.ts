import { lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { describe, expect, it } from "vitest";
import { contactMessages } from "@/db/schema";

// The admin "delete old data" button and the nightly cron crashed on Vercel:
// a raw sql`` parameter sent a JS Date, which the postgres driver rejects.
// Through the typed column the date goes out as text.
describe("retention purge query", () => {
  it("sends the cutoff date as a string, not a Date object", () => {
    const db = drizzle(postgres("postgres://user@127.0.0.1:1/none", { max: 1 }));
    const cutoff = new Date("2026-08-14T08:55:37Z");
    const q = db.delete(contactMessages).where(lt(contactMessages.createdAt, cutoff)).toSQL();
    expect(q.sql).toContain('delete from "contact_messages"');
    expect(q.params).toHaveLength(1);
    expect(typeof q.params[0]).toBe("string");
  });
});
