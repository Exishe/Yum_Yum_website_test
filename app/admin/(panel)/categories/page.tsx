import { asc } from "drizzle-orm";
import {
  Card,
  Check,
  Field,
  Flash,
  LocalizedField,
  PageHeader,
  SubmitButton,
  sp,
  type SearchParams,
} from "@/components/admin/ui";
import { db } from "@/db";
import { categories, type Category } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { saveCategoryAction } from "../../actions";

export const metadata = { title: "Categories" };

function CategoryForm({ c }: { c?: Category }) {
  return (
    <form action={saveCategoryAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <LocalizedField label="Name" name="name" value={c?.name} required />
      <LocalizedField label="Description" name="description" value={c?.description} />
      <div className="flex flex-wrap items-end gap-4">
        <Field
          label="Sort order"
          name="sortOrder"
          type="number"
          defaultValue={c?.sortOrder ?? 0}
          className="w-32"
        />
        <label className="text-sm font-semibold">
          Photo
          <input
            type="file"
            name="imageFile"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="mt-1 block text-sm"
          />
        </label>
        <Check label="Published" name="isPublished" defaultChecked={c?.isPublished ?? true} />
        <Check label="In header menu & tabs" name="inMenu" defaultChecked={c?.inMenu ?? true} />
        <SubmitButton>{c ? "Save" : "Add category"}</SubmitButton>
      </div>
    </form>
  );
}

export default async function CategoriesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser(["admin"]);
  const q = await searchParams;
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  return (
    <>
      <PageHeader title="Categories" />
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <div className="flex flex-col gap-4">
        {rows.map((c) => (
          <Card key={c.id}>
            <CategoryForm c={c} />
          </Card>
        ))}
        <Card className="border-2 border-dashed border-line bg-blush">
          <h2 className="mb-3 text-xl">New category</h2>
          <CategoryForm />
        </Card>
      </div>
    </>
  );
}
