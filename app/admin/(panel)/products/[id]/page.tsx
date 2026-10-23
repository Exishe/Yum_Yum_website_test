import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { Flash, PageHeader, SubmitButton, sp, type SearchParams } from "@/components/admin/ui";
import { db } from "@/db";
import { categories, productOptions, products } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { deleteProductAction } from "../../../actions";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  const user = await requireUser();
  const { id } = await params;
  const q = await searchParams;
  const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  if (id === "new") {
    return (
      <>
        <PageHeader title="New product" />
        <Flash ok={sp(q.ok)} error={sp(q.error)} />
        <ProductForm options={[]} categories={cats} />
      </>
    );
  }
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();
  const [product] = await db.select().from(products).where(eq(products.id, pid)).limit(1);
  if (!product) notFound();
  const options = await db.select().from(productOptions).where(eq(productOptions.productId, pid)).orderBy(asc(productOptions.sortOrder));
  return (
    <>
      <PageHeader title={product.name.en}>
        {user.role === "admin" ? (
          <form action={deleteProductAction}>
            <input type="hidden" name="id" value={product.id} />
            <SubmitButton confirm="Delete this product for good? Hiding it is usually better." className="bg-magenta-soft text-plum hover:bg-magenta hover:text-white">
              Delete
            </SubmitButton>
          </form>
        ) : null}
      </PageHeader>
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <ProductForm product={product} options={options} categories={cats} />
    </>
  );
}
