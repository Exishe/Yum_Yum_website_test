import { eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Card, Check, Field, Flash, LocalizedField, PageHeader, SubmitButton, inputCls, sp, type SearchParams } from "@/components/admin/ui";
import { db } from "@/db";
import { shops, type Shop } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { districts } from "@/lib/districts";
import { saveShopAction } from "../../../actions";

export const metadata = { title: "Edit shop" };
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function EditShop({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  await requireUser(["admin"]);
  const { id } = await params;
  const q = await searchParams;
  let s: Shop | undefined;
  if (id !== "new") {
    const n = Number(id);
    if (!Number.isInteger(n)) notFound();
    [s] = await db.select().from(shops).where(eq(shops.id, n)).limit(1);
    if (!s) notFound();
  }
  return (
    <>
      <PageHeader title={s ? s.name.en : "New shop"} />
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <form action={saveShopAction} className="flex flex-col gap-5">
        <input type="hidden" name="id" value={s?.id ?? ""} />
        <Card className="flex flex-col gap-4">
          <LocalizedField label="Name" name="name" value={s?.name} />
          <LocalizedField label="Address" name="address" value={s?.address} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <label className="text-sm font-semibold">
              District
              <select name="district" defaultValue={s?.district ?? "kentron"} className={inputCls}>
                {districts.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.name.en}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Phone" name="phone" defaultValue={s?.phone} placeholder="+37433301574" />
            <Field label="Latitude" name="lat" defaultValue={s?.lat} />
            <Field label="Longitude" name="lng" defaultValue={s?.lng} />
            <Field label="Google Maps link" name="googleMapsUrl" defaultValue={s?.googleMapsUrl} className="md:col-span-2" />
            <Field label="Yandex Maps link" name="yandexMapsUrl" defaultValue={s?.yandexMapsUrl} className="md:col-span-2" />
            <Field label="2GIS link" name="twoGisUrl" defaultValue={s?.twoGisUrl} className="md:col-span-2" />
            <Field label="Sort order" name="sortOrder" type="number" defaultValue={s?.sortOrder ?? 0} />
          </div>
          <div className="flex flex-wrap gap-x-6">
            <Check label="On the website" name="isActive" defaultChecked={s?.isActive ?? true} />
            <Check label="Pickup orders allowed" name="pickupEnabled" defaultChecked={s?.pickupEnabled ?? true} />
            <Check label="Confirmed open by the client" name="isConfirmed" defaultChecked={s?.isConfirmed} />
          </div>
        </Card>
        <Card className="flex flex-col gap-3">
          <h2 className="text-xl">Opening hours (Yerevan time)</h2>
          <Check label="Inside a mall: follows the mall's hours" name="isMall" defaultChecked={s?.isMall} hint="When ticked, the hours below are ignored." />
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {DAYS.map((d, i) => {
              const h = s?.hours?.[i] ?? (s?.hours ? null : { open: "09:00", close: "22:00" });
              return (
                <div key={d} className="flex flex-wrap items-center gap-3 rounded-xl bg-blush px-3 py-2">
                  <span className="w-24 text-sm font-semibold">{d}</span>
                  <input aria-label={`${d} opens`} name={`open.${i}`} type="time" defaultValue={h?.open ?? "09:00"} className="h-10 rounded-lg border-2 border-line px-2" />
                  <span>–</span>
                  <input aria-label={`${d} closes`} name={`close.${i}`} type="time" defaultValue={h?.close ?? "22:00"} className="h-10 rounded-lg border-2 border-line px-2" />
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" name={`closed.${i}`} defaultChecked={!!s?.hours && !h} className="accent-magenta" /> closed
                  </label>
                </div>
              );
            })}
          </div>
          <LocalizedField label="Hours note (e.g. mall hours)" name="hoursNote" value={s?.hoursNote} />
        </Card>
        <Card className="flex flex-wrap items-center gap-5">
          <span className="relative h-32 w-48 overflow-hidden rounded-2xl bg-magenta-soft">
            {s?.image ? <Image src={s.image} alt="" fill sizes="192px" className="object-cover" /> : null}
          </span>
          <label className="text-sm font-semibold">
            New photo
            <input type="file" name="imageFile" accept="image/jpeg,image/png,image/webp,image/avif" className="mt-1 block text-sm" />
          </label>
        </Card>
        <div>
          <SubmitButton className="h-12 px-8">Save shop</SubmitButton>
        </div>
      </form>
    </>
  );
}
