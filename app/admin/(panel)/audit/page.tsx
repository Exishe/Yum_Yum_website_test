import { desc } from "drizzle-orm";
import { Card, PageHeader } from "@/components/admin/ui";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Audit log" };

export default async function AuditPage() {
  await requireUser(["admin"]);
  const rows = await db.select().from(auditLog).orderBy(desc(auditLog.id)).limit(300);
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Yerevan", dateStyle: "short", timeStyle: "medium" });
  return (
    <>
      <PageHeader title="Audit log" />
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-blush text-left">
            <tr>
              {["When", "Who", "What", "Item", "Changes"].map((h) => (
                <th key={h} scope="col" className="px-4 py-2 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 whitespace-nowrap">{fmt.format(r.createdAt)}</td>
                <td className="px-4 py-2">{r.userEmail ?? "system"}</td>
                <td className="px-4 py-2">{r.action}</td>
                <td className="px-4 py-2">
                  {r.entity} {r.entityId}
                </td>
                <td className="max-w-md px-4 py-2 font-mono text-xs break-all text-muted">
                  {r.changes ? JSON.stringify(r.changes).slice(0, 300) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
