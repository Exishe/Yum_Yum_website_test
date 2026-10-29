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
import { deliveryZones, type DeliveryZone } from "@/db/schema";
import { adminT } from "@/lib/admin-lang";
import { requireUser } from "@/lib/auth";
import { districts } from "@/lib/districts";
import { deleteZoneAction, saveZoneAction } from "../../actions";

export async function generateMetadata() {
  return { title: (await adminT())("Delivery zones") };
}

async function ZoneForm({ z }: { z?: DeliveryZone }) {
  const t = await adminT();
  return (
    <form action={saveZoneAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={z?.id ?? ""} />
      <LocalizedField label={t("Zone name")} name="name" value={z?.name} />
      <fieldset>
        <legend className="text-sm font-semibold">{t("Districts")}</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {districts.map((d) => (
            <label
              key={d.key}
              className="flex min-h-10 items-center gap-1 rounded-full bg-blush px-3 text-sm"
            >
              <input
                type="checkbox"
                name="districts"
                value={d.key}
                defaultChecked={z?.districts.includes(d.key)}
                className="accent-magenta"
              />
              {d.name[t.lang] || d.name.en}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Field
          label={t("Fee, ֏")}
          name="feeAmd"
          type="number"
          min={0}
          defaultValue={z?.feeAmd ?? 0}
        />
        <Field
          label={t("Minimum order, ֏")}
          name="minOrderAmd"
          type="number"
          min={0}
          defaultValue={z?.minOrderAmd ?? 0}
        />
        <Field
          label={t("Free from, ֏")}
          name="freeFromAmd"
          type="number"
          min={0}
          defaultValue={z?.freeFromAmd ?? ""}
          hint={t("Empty = never free")}
        />
        <Field
          label={t("Usual time, min")}
          name="etaMinutes"
          type="number"
          min={10}
          defaultValue={z?.etaMinutes ?? 60}
        />
        <Field label={t("Sort")} name="sortOrder" type="number" defaultValue={z?.sortOrder ?? 0} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Check label={t("Active")} name="isActive" defaultChecked={z?.isActive ?? true} />
        <SubmitButton>{z ? t("Save") : t("Add zone")}</SubmitButton>
      </div>
    </form>
  );
}

export default async function ZonesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser(["admin"]);
  const q = await searchParams;
  const t = await adminT();
  const rows = await db.select().from(deliveryZones).orderBy(asc(deliveryZones.sortOrder));
  return (
    <>
      <PageHeader title={t("Delivery zones and fees")} />
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <p className="mb-4 max-w-2xl text-sm text-muted">
        {t("The seed fees are placeholders. Set the real ones before launch.")}
      </p>
      <div className="flex flex-col gap-4">
        {rows.map((z) => (
          <Card key={z.id}>
            <ZoneForm z={z} />
            <form action={deleteZoneAction} className="mt-2">
              <input type="hidden" name="id" value={z.id} />
              <SubmitButton
                confirm={t("Delete this zone?")}
                className="h-9 bg-transparent px-0 text-magenta-ink underline hover:bg-transparent"
              >
                {t("Delete zone")}
              </SubmitButton>
            </form>
          </Card>
        ))}
        <Card className="border-2 border-dashed border-line bg-blush">
          <h2 className="mb-3 text-xl">{t("New zone")}</h2>
          <ZoneForm />
        </Card>
      </div>
    </>
  );
}
