import { and, asc, eq, type SQL } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  Flash,
  PageHeader,
  SubmitButton,
  btn,
  sp,
  type SearchParams,
} from "@/components/admin/ui";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { adminT } from "@/lib/admin-lang";
import { requireUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { confirmAllPricesAction, quickProductAction } from "../../actions";

export async function generateMetadata() {
  return { title: (await adminT())("Products & prices") };
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const q = await searchParams;
  const t = await adminT();
  const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  const c = Number(sp(q.c)) || null;
  const where: SQL[] = [];
  if (c) where.push(eq(products.categoryId, c));
  if (sp(q.sample)) where.push(eq(products.priceIsSample, true));
  const rows = await db
    .select()
    .from(products)
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(products.categoryId), asc(products.sortOrder));
  const sampleCount = rows.filter((r) => r.priceIsSample).length;

  return (
    <>
      <PageHeader title={t("Products & prices")}>
        <Link href="/admin/products/new" className={btn.primary}>
          {t("New product")}
        </Link>
      </PageHeader>
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      {sampleCount > 0 ? (
        <Card className="mb-5 bg-sun-soft">
          <p className="text-sm">
            <strong>{t("{n} prices are not confirmed yet.", { n: sampleCount })}</strong>{" "}
            {t(
              "They come from buy.am and the shop menu boards (October 2026). Check each one; saving a new price marks it confirmed.",
            )}
          </p>
          {user.role === "admin" ? (
            <form action={confirmAllPricesAction} className="mt-3">
              <SubmitButton
                confirm={t("Mark every price as confirmed by the shop?")}
                className="bg-plum"
              >
                {t("All prices are correct")}
              </SubmitButton>
            </form>
          ) : null}
        </Card>
      ) : null}
      <nav aria-label={t("Categories")} className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        <Link
          href="/admin/products"
          className={cn(btn.ghost, !c && !sp(q.sample) && "border-plum")}
        >
          {t("All")}
        </Link>
        {cats.map((cat) => (
          <Link
            key={cat.id}
            href={`/admin/products?c=${cat.id}`}
            className={cn(btn.ghost, c === cat.id && "border-plum")}
          >
            {cat.name[t.lang] || cat.name.en}
          </Link>
        ))}
        <Link
          href="/admin/products?sample=1"
          className={cn(btn.ghost, sp(q.sample) && "border-plum")}
        >
          {t("Unconfirmed prices")}
        </Link>
      </nav>
      <Card className="p-0">
        <ul className="divide-y divide-line">
          {rows.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-magenta-soft">
                {p.image ? (
                  <Image src={p.image} alt="" fill sizes="48px" className="object-cover" />
                ) : null}
              </span>
              <Link
                href={`/admin/products/${p.id}`}
                className="min-w-40 flex-1 hover:text-magenta-ink"
              >
                <span className="block font-semibold">{p.name[t.lang] || p.name.en}</span>
                <span className="block text-xs text-muted">
                  {t.lang === "hy" ? `${p.name.ru} · ${p.name.en}` : `${p.name.hy} · ${p.name.ru}`}
                  {!p.isPublished ? ` · ${t("hidden")}` : ""}
                  {p.priceOnRequest ? ` · ${t("price on request")}` : ""}
                </span>
              </Link>
              <form action={quickProductAction} className="flex items-center gap-3">
                <input type="hidden" name="id" value={p.id} />
                <label className="flex items-center gap-1 text-sm">
                  <span className="sr-only">
                    {t("Price for {name}", { name: p.name[t.lang] || p.name.en })}
                  </span>
                  <input
                    name="priceAmd"
                    type="number"
                    min={0}
                    step={10}
                    defaultValue={p.priceAmd}
                    className={cn(
                      "h-10 w-24 rounded-lg border-2 px-2 text-right",
                      p.priceIsSample ? "border-sun bg-sun-soft" : "border-line",
                    )}
                  />
                  ֏
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    defaultChecked={p.isAvailable}
                    className="size-4 accent-magenta"
                  />{" "}
                  {t("in stock")}
                </label>
                <SubmitButton className="h-10 px-4">{t("Save")}</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
