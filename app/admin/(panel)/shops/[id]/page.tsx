import { eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Card,
  Check,
  Field,
  Flash,
  LocalizedField,
  PageHeader,
  SubmitButton,
  inputCls,
  sp,
  type SearchParams,
} from "@/components/admin/ui";
import { db } from "@/db";
import { shops, type Shop } from "@/db/schema";
import { PhotoInput } from "@/components/admin/PhotoInput";
import { adminT } from "@/lib/admin-lang";
import { requireUser } from "@/lib/auth";
import { districts } from "@/lib/districts";
import { saveShopAction } from "../../../actions";

export async function generateMetadata() {
  return { title: (await adminT())("Edit shop") };
}
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function EditShop({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  await requireUser(["admin"]);
  const { id } = await params;
  const q = await searchParams;
  const t = await adminT();
  let s: Shop | undefined;
  if (id !== "new") {
    const n = Number(id);
    if (!Number.isInteger(n)) notFound();
    [s] = await db.select().from(shops).where(eq(shops.id, n)).limit(1);
    if (!s) notFound();
  }
  return (
    <>
      <PageHeader title={s ? s.name[t.lang] || s.name.en : t("New shop")} />
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <form action={saveShopAction} className="flex flex-col gap-5">
        <input type="hidden" name="id" value={s?.id ?? ""} />
        <Card className="flex flex-col gap-4">
          <LocalizedField label={t("Name")} name="name" value={s?.name} />
          <LocalizedField label={t("Address")} name="address" value={s?.address} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <label className="text-sm font-semibold">
              {t("District")}
              <select name="district" defaultValue={s?.district ?? "kentron"} className={inputCls}>
                {districts.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.name[t.lang] || d.name.en}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label={t("Phone")}
              name="phone"
              defaultValue={s?.phone}
              placeholder="+37433301574"
            />
            <Field label={t("Latitude")} name="lat" defaultValue={s?.lat} />
            <Field label={t("Longitude")} name="lng" defaultValue={s?.lng} />
            <Field
              label={t("Google Maps link")}
              name="googleMapsUrl"
              defaultValue={s?.googleMapsUrl}
              className="md:col-span-2"
            />
            <Field
              label={t("Yandex Maps link")}
              name="yandexMapsUrl"
              defaultValue={s?.yandexMapsUrl}
              className="md:col-span-2"
            />
            <Field
              label="2GIS link"
              name="twoGisUrl"
              defaultValue={s?.twoGisUrl}
              className="md:col-span-2"
            />
            <Field
              label={t("Sort order")}
              name="sortOrder"
              type="number"
              defaultValue={s?.sortOrder ?? 0}
            />
          </div>
          <div className="flex flex-wrap gap-x-6">
            <Check
              label={t("On the website")}
              name="isActive"
              defaultChecked={s?.isActive ?? true}
            />
            <Check
              label={t("Pickup orders allowed")}
              name="pickupEnabled"
              defaultChecked={s?.pickupEnabled ?? true}
            />
            <Check
              label={t("Confirmed open by the client")}
              name="isConfirmed"
              defaultChecked={s?.isConfirmed}
            />
          </div>
        </Card>
        <Card className="flex flex-col gap-3">
          <h2 className="text-xl">{t("Opening hours (Yerevan time)")}</h2>
          <Check
            label={t("Inside a mall: follows the mall's hours")}
            name="isMall"
            defaultChecked={s?.isMall}
            hint={t("When ticked, the hours below are ignored.")}
          />
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {DAYS.map((d, i) => {
              const h = s?.hours?.[i] ?? (s?.hours ? null : { open: "09:00", close: "22:00" });
              return (
                <div
                  key={d}
                  className="flex flex-wrap items-center gap-3 rounded-xl bg-blush px-3 py-2"
                >
                  <span className="w-24 text-sm font-semibold">{t(d)}</span>
                  <input
                    aria-label={t("{day}: opens", { day: t(d) })}
                    name={`open.${i}`}
                    type="time"
                    defaultValue={h?.open ?? "09:00"}
                    className="h-10 rounded-lg border-2 border-line px-2"
                  />
                  <span>–</span>
                  <input
                    aria-label={t("{day}: closes", { day: t(d) })}
                    name={`close.${i}`}
                    type="time"
                    defaultValue={h?.close ?? "22:00"}
                    className="h-10 rounded-lg border-2 border-line px-2"
                  />
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      name={`closed.${i}`}
                      defaultChecked={!!s?.hours && !h}
                      className="accent-magenta"
                    />{" "}
                    {t("closed")}
                  </label>
                </div>
              );
            })}
          </div>
          <LocalizedField
            label={t("Hours note (e.g. mall hours)")}
            name="hoursNote"
            value={s?.hoursNote}
          />
        </Card>
        <Card className="flex flex-wrap items-center gap-5">
          <span className="relative h-32 w-48 overflow-hidden rounded-2xl bg-magenta-soft">
            {s?.image ? (
              <Image src={s.image} alt="" fill sizes="192px" className="object-cover" />
            ) : null}
          </span>
          <PhotoInput label={t("New photo")} />
        </Card>
        <div>
          <SubmitButton className="h-12 px-8">{t("Save shop")}</SubmitButton>
        </div>
      </form>
    </>
  );
}
