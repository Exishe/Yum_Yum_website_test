import { asc } from "drizzle-orm";
import Link from "next/link";
import { Card, Flash, PageHeader, btn, sp, type SearchParams } from "@/components/admin/ui";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Shops" };

export default async function ShopsAdmin({ searchParams }: { searchParams: SearchParams }) {
  await requireUser(["admin"]);
  const q = await searchParams;
  const rows = await db.select().from(shops).orderBy(asc(shops.sortOrder));
  return (
    <>
      <PageHeader title="Shops">
        <Link href="/admin/shops/new" className={btn.primary}>
          New shop
        </Link>
      </PageHeader>
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <Card className="p-0">
        <ul className="divide-y divide-line">
          {rows.map((s) => (
            <li key={s.id}>
              <Link href={`/admin/shops/${s.id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-blush">
                <span>
                  <span className="font-semibold">{s.name.en}</span>
                  <span className="block text-xs text-muted">{s.address.en}</span>
                </span>
                <span className="text-xs">
                  {s.isActive ? "On the website" : "Hidden"} · {s.isConfirmed ? "confirmed" : "not confirmed by the client"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
