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
import { adminT } from "@/lib/admin-lang";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveSettingsAction } from "../../actions";

export async function generateMetadata() {
  return { title: (await adminT())("Settings") };
}
export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser(["admin"]);
  const q = await searchParams;
  const t = await adminT();
  const s = await getSettings();
  const ext = [
    ...s.externalDelivery,
    ...Array(4).fill({ name: "", url: "", enabled: false }),
  ].slice(0, 4);
  return (
    <>
      <PageHeader title={t("Settings")} />
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <div className="flex flex-col gap-5">
        <Card>
          <h2 className="mb-3 text-xl">{t("Demo notes")}</h2>
          <form action={saveSettingsAction} className="flex flex-col gap-3">
            <input type="hidden" name="key" value="demoNotes" />
            <Check
              label={t(
                "Show “example, to be discussed” next to delivery terms and other values you have not confirmed yet",
              )}
              name="enabled"
              defaultChecked={s.demoNotes.enabled}
            />
            <div>
              <SubmitButton>{t("Save")}</SubmitButton>
            </div>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 text-xl">{t("“Today in the window” banner")}</h2>
          <form action={saveSettingsAction} className="flex flex-col gap-3">
            <input type="hidden" name="key" value="banner" />
            <Check
              label={t("Show the banner at the top of every page")}
              name="enabled"
              defaultChecked={s.banner.enabled}
            />
            <LocalizedField label={t("Text")} name="text" value={s.banner.text} />
            <div>
              <SubmitButton>{t("Save banner")}</SubmitButton>
            </div>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 text-xl">{t("Ordering")}</h2>
          <form action={saveSettingsAction} className="flex flex-col gap-3">
            <input type="hidden" name="key" value="ordering" />
            <div className="flex flex-wrap gap-x-6">
              <Check
                label={t("Pickup orders on")}
                name="pickupEnabled"
                defaultChecked={s.ordering.pickupEnabled}
              />
              <Check
                label={t("Delivery orders on")}
                name="deliveryEnabled"
                defaultChecked={s.ordering.deliveryEnabled}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <Field
                label={t("Delivery from")}
                name="deliveryOpen"
                type="time"
                defaultValue={s.ordering.deliveryHours.open}
              />
              <Field
                label={t("Delivery until")}
                name="deliveryClose"
                type="time"
                defaultValue={s.ordering.deliveryHours.close}
              />
              <Field
                label={t("Pickup slot, min")}
                name="pickupSlotMinutes"
                type="number"
                defaultValue={s.ordering.pickupSlotMinutes}
              />
              <Field
                label={t("Delivery slot, min")}
                name="deliverySlotMinutes"
                type="number"
                defaultValue={s.ordering.deliverySlotMinutes}
              />
              <Field
                label={t("Earliest, min from now")}
                name="minLeadMinutes"
                type="number"
                defaultValue={s.ordering.minLeadMinutes}
              />
              <Field
                label={t("Days ahead allowed")}
                name="maxDaysAhead"
                type="number"
                defaultValue={s.ordering.maxDaysAhead}
              />
            </div>
            <div>
              <SubmitButton>{t("Save ordering")}</SubmitButton>
            </div>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 text-xl">{t("Contacts and social media")}</h2>
          <form action={saveSettingsAction} className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="hidden" name="key" value="contact" />
            <Field
              label={t("Phones (+374…, comma-separated)")}
              name="phones"
              defaultValue={s.contact.phones.join(", ")}
              className="md:col-span-2"
            />
            <Field
              label={t("WhatsApp number (374…)")}
              name="whatsapp"
              defaultValue={s.contact.whatsapp}
            />
            <Field
              label={t("Instagram handle")}
              name="instagram"
              defaultValue={s.contact.instagram}
            />
            <Field label={t("Facebook page")} name="facebook" defaultValue={s.contact.facebook} />
            <Field label={t("TikTok handle")} name="tiktok" defaultValue={s.contact.tiktok} />
            <Field label={t("Public email")} name="email" defaultValue={s.contact.email} />
            <Check
              label={t("WhatsApp number confirmed by the client")}
              name="whatsappConfirmed"
              defaultChecked={s.contact.whatsappConfirmed}
            />
            <div className="md:col-span-3">
              <SubmitButton>{t("Save contacts")}</SubmitButton>
            </div>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 text-xl">{t("Delivery apps")}</h2>
          <form action={saveSettingsAction} className="flex flex-col gap-3">
            <input type="hidden" name="key" value="externalDelivery" />
            {ext.map((d, i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-3 md:grid-cols-[180px_1fr_auto] md:items-end"
              >
                <Field label={t("Name")} name={`name.${i}`} defaultValue={d.name} />
                <Field
                  label={t("Link to the YUM-YUM page (https://…)")}
                  name={`url.${i}`}
                  defaultValue={d.url}
                />
                <Check label={t("Show")} name={`enabled.${i}`} defaultChecked={d.enabled} />
              </div>
            ))}
            <div>
              <SubmitButton>{t("Save delivery apps")}</SubmitButton>
            </div>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 text-xl">{t("Company details (footer)")}</h2>
          <form action={saveSettingsAction} className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="hidden" name="key" value="legal" />
            <Field label={t("Legal name")} name="companyName" defaultValue={s.legal.companyName} />
            <Field label={t("Tax ID (ՀՎՀՀ)")} name="taxId" defaultValue={s.legal.taxId} />
            <Field label={t("Registered address")} name="address" defaultValue={s.legal.address} />
            <div className="md:col-span-3">
              <SubmitButton>{t("Save company details")}</SubmitButton>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
