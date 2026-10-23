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
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveSettingsAction } from "../../actions";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser(["admin"]);
  const q = await searchParams;
  const s = await getSettings();
  const ext = [
    ...s.externalDelivery,
    ...Array(4).fill({ name: "", url: "", enabled: false }),
  ].slice(0, 4);
  return (
    <>
      <PageHeader title="Settings" />
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <div className="flex flex-col gap-5">
        <Card>
          <h2 className="mb-3 text-xl">“Today in the window” banner</h2>
          <form action={saveSettingsAction} className="flex flex-col gap-3">
            <input type="hidden" name="key" value="banner" />
            <Check
              label="Show the banner at the top of every page"
              name="enabled"
              defaultChecked={s.banner.enabled}
            />
            <LocalizedField label="Text" name="text" value={s.banner.text} />
            <div>
              <SubmitButton>Save banner</SubmitButton>
            </div>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 text-xl">Ordering</h2>
          <form action={saveSettingsAction} className="flex flex-col gap-3">
            <input type="hidden" name="key" value="ordering" />
            <div className="flex flex-wrap gap-x-6">
              <Check
                label="Pickup orders on"
                name="pickupEnabled"
                defaultChecked={s.ordering.pickupEnabled}
              />
              <Check
                label="Delivery orders on"
                name="deliveryEnabled"
                defaultChecked={s.ordering.deliveryEnabled}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <Field
                label="Delivery from"
                name="deliveryOpen"
                type="time"
                defaultValue={s.ordering.deliveryHours.open}
              />
              <Field
                label="Delivery until"
                name="deliveryClose"
                type="time"
                defaultValue={s.ordering.deliveryHours.close}
              />
              <Field
                label="Pickup slot, min"
                name="pickupSlotMinutes"
                type="number"
                defaultValue={s.ordering.pickupSlotMinutes}
              />
              <Field
                label="Delivery slot, min"
                name="deliverySlotMinutes"
                type="number"
                defaultValue={s.ordering.deliverySlotMinutes}
              />
              <Field
                label="Earliest, min from now"
                name="minLeadMinutes"
                type="number"
                defaultValue={s.ordering.minLeadMinutes}
              />
              <Field
                label="Days ahead allowed"
                name="maxDaysAhead"
                type="number"
                defaultValue={s.ordering.maxDaysAhead}
              />
            </div>
            <div>
              <SubmitButton>Save ordering</SubmitButton>
            </div>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 text-xl">Contacts and social media</h2>
          <form action={saveSettingsAction} className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="hidden" name="key" value="contact" />
            <Field
              label="Phones (+374…, comma-separated)"
              name="phones"
              defaultValue={s.contact.phones.join(", ")}
              className="md:col-span-2"
            />
            <Field
              label="WhatsApp number (374…)"
              name="whatsapp"
              defaultValue={s.contact.whatsapp}
            />
            <Field label="Instagram handle" name="instagram" defaultValue={s.contact.instagram} />
            <Field label="Facebook page" name="facebook" defaultValue={s.contact.facebook} />
            <Field label="TikTok handle" name="tiktok" defaultValue={s.contact.tiktok} />
            <Field label="Public email" name="email" defaultValue={s.contact.email} />
            <Check
              label="WhatsApp number confirmed by the client"
              name="whatsappConfirmed"
              defaultChecked={s.contact.whatsappConfirmed}
            />
            <div className="md:col-span-3">
              <SubmitButton>Save contacts</SubmitButton>
            </div>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 text-xl">Delivery apps</h2>
          <form action={saveSettingsAction} className="flex flex-col gap-3">
            <input type="hidden" name="key" value="externalDelivery" />
            {ext.map((d, i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-3 md:grid-cols-[180px_1fr_auto] md:items-end"
              >
                <Field label="Name" name={`name.${i}`} defaultValue={d.name} />
                <Field
                  label="Link to the YUM-YUM page (https://…)"
                  name={`url.${i}`}
                  defaultValue={d.url}
                />
                <Check label="Show" name={`enabled.${i}`} defaultChecked={d.enabled} />
              </div>
            ))}
            <div>
              <SubmitButton>Save delivery apps</SubmitButton>
            </div>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 text-xl">Company details (footer)</h2>
          <form action={saveSettingsAction} className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="hidden" name="key" value="legal" />
            <Field label="Legal name" name="companyName" defaultValue={s.legal.companyName} />
            <Field label="Tax ID (ՀՎՀՀ)" name="taxId" defaultValue={s.legal.taxId} />
            <Field label="Registered address" name="address" defaultValue={s.legal.address} />
            <div className="md:col-span-3">
              <SubmitButton>Save company details</SubmitButton>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
