import "server-only";
import { openDatabase, type Connection } from "./connect";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { __yyConnection?: Connection };

// Reuse one connection (or one built-in demo database) across hot reloads.
const connection = globalForDb.__yyConnection ?? openDatabase();
globalForDb.__yyConnection = connection;

export const db = connection.db;
export const dbKind = connection.kind;
export { schema };
