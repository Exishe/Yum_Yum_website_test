import { asc } from "drizzle-orm";
import {
  Card,
  Check,
  Field,
  Flash,
  PageHeader,
  SubmitButton,
  inputCls,
  sp,
  type SearchParams,
} from "@/components/admin/ui";
import { db } from "@/db";
import { reviews, type Review } from "@/db/schema";
import { adminT } from "@/lib/admin-lang";
import { requireUser } from "@/lib/auth";
import { deleteReviewAction, saveReviewAction } from "../../actions";

export async function generateMetadata() {
  return { title: (await adminT())("Reviews") };
}

async function ReviewForm({ r }: { r?: Review }) {
  const t = await adminT();
  return (
    <form action={saveReviewAction} className="grid grid-cols-1 gap-3 md:grid-cols-4">
      <input type="hidden" name="id" value={r?.id ?? ""} />
      <label className="block text-sm font-semibold md:col-span-4">
        {t("Quote, exactly as written")}
        <textarea
          name="quote"
          rows={2}
          defaultValue={r?.quote}
          required
          className={`${inputCls} h-auto py-2`}
        />
      </label>
      <Field
        label={t("Author (as shown on the platform)")}
        name="author"
        defaultValue={r?.author}
        required
      />
      <Field
        label={t("Platform")}
        name="platform"
        defaultValue={r?.platform}
        placeholder={t("Google, Tripadvisor…")}
        required
      />
      <Field label={t("Link to the review")} name="url" defaultValue={r?.url} />
      <Field
        label={t("Stars (1–5)")}
        name="rating"
        type="number"
        min={1}
        max={5}
        defaultValue={r?.rating ?? ""}
      />
      <label className="text-sm font-semibold">
        {t("Language of the quote")}
        <select name="quoteLocale" defaultValue={r?.quoteLocale ?? "en"} className={inputCls}>
          <option value="hy">{t("Armenian")}</option>
          <option value="ru">{t("Russian")}</option>
          <option value="en">{t("English")}</option>
        </select>
      </label>
      <Field
        label={t("Date")}
        name="reviewDate"
        defaultValue={r?.reviewDate}
        placeholder="2025-11"
      />
      <Field label={t("Sort")} name="sortOrder" type="number" defaultValue={r?.sortOrder ?? 0} />
      <div className="flex items-end gap-4">
        <Check label={t("Show on the website")} name="isApproved" defaultChecked={r?.isApproved} />
        <SubmitButton>{r ? t("Save") : t("Add")}</SubmitButton>
      </div>
    </form>
  );
}

export default async function ReviewsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser(["admin"]);
  const q = await searchParams;
  const t = await adminT();
  const rows = await db.select().from(reviews).orderBy(asc(reviews.sortOrder));
  return (
    <>
      <PageHeader title={t("Reviews")} />
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <p className="mb-4 max-w-2xl text-sm text-muted">
        {t(
          "Only real reviews, copied word for word, with the reviewer’s name as the platform shows it. Never edit or invent a quote.",
        )}
      </p>
      <div className="flex flex-col gap-4">
        {rows.map((r) => (
          <Card key={r.id}>
            <ReviewForm r={r} />
            <form action={deleteReviewAction} className="mt-2">
              <input type="hidden" name="id" value={r.id} />
              <SubmitButton
                confirm={t("Delete this review?")}
                className="h-9 bg-transparent px-0 text-magenta-ink underline hover:bg-transparent"
              >
                {t("Delete")}
              </SubmitButton>
            </form>
          </Card>
        ))}
        <Card className="border-2 border-dashed border-line bg-blush">
          <h2 className="mb-3 text-xl">{t("Add a review")}</h2>
          <ReviewForm />
        </Card>
      </div>
    </>
  );
}
