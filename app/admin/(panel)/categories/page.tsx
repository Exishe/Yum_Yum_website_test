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
import { PhotoInput } from "@/components/admin/PhotoInput";
import { adminT } from "@/lib/admin-lang";
import { requireUser } from "@/lib/auth";
import { saveCategoryAction } from "../../actions";

export async function generateMetadata() {
  return { title: (await adminT())("Categories") };
}

async function CategoryForm({ c }: { c?: Category }) {
  const t = await adminT();
  return (
    <form action={saveCategoryAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <LocalizedField label={t("Name")} name="name" value={c?.name} required />
      <LocalizedField label={t("Description")} name="description" value={c?.description} />
      <div className="flex flex-wrap items-end gap-4">
        <Field
          label={t("Sort order")}
          name="sortOrder"
          type="number"
          defaultValue={c?.sortOrder ?? 0}
          className="w-32"
        />
        <PhotoInput label={t("Photo")} />
        <Check label={t("Published")} name="isPublished" defaultChecked={c?.isPublished ?? true} />
        <Check
          label={t("In header menu & tabs")}
          name="inMenu"
          defaultChecked={c?.inMenu ?? true}
        />
        <SubmitButton>{c ? t("Save") : t("Add category")}</SubmitButton>
      </div>
    </form>
  );
}

export default async function CategoriesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser(["admin"]);
  const q = await searchParams;
  const t = await adminT();
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  return (
    <>
      <PageHeader title={t("Categories")} />
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <div className="flex flex-col gap-4">
        {rows.map((c) => (
          <Card key={c.id}>
            <CategoryForm c={c} />
          </Card>
        ))}
        <Card className="border-2 border-dashed border-line bg-blush">
          <h2 className="mb-3 text-xl">{t("New category")}</h2>
          <CategoryForm />
        </Card>
      </div>
    </>
  );
}
