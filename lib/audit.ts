import "server-only";
import { db } from "@/db";
import { auditLog } from "@/db/schema";

export async function audit(
  user: { id: number; email: string } | null,
  action: string,
  entity: string,
  entityId?: string | number | null,
  changes?: unknown,
) {
  await db.insert(auditLog).values({
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    action,
    entity,
    entityId: entityId == null ? null : String(entityId),
    changes: changes ?? null,
  });
}

/** Only the fields that changed, as { field: [before, after] }. */
export function diff<T extends Record<string, unknown>>(before: T, after: Partial<T>) {
  const out: Record<string, [unknown, unknown]> = {};
  for (const [k, v] of Object.entries(after)) {
    if (k === "updatedAt" || k === "passwordHash") continue;
    if (JSON.stringify(before[k]) !== JSON.stringify(v)) out[k] = [before[k], v];
  }
  return out;
}
