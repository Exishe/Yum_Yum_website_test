import {
  Card,
  Field,
  Flash,
  PageHeader,
  SubmitButton,
  sp,
  type SearchParams,
} from "@/components/admin/ui";
import { adminT } from "@/lib/admin-lang";
import { requireUser } from "@/lib/auth";
import { changePasswordAction } from "../../actions";

export async function generateMetadata() {
  return { title: (await adminT())("My account") };
}

export default async function AccountPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const q = await searchParams;
  const t = await adminT();
  return (
    <>
      <PageHeader title={t("My account")} />
      <Flash
        ok={sp(q.ok)}
        error={
          sp(q.error) ??
          (sp(q.first) || user.mustChangePassword
            ? "Please choose your own password before you continue."
            : undefined)
        }
      />
      <Card className="max-w-md">
        <p className="mb-4 text-sm">
          {user.name} · {t("login")}: <strong>{user.email}</strong> ·{" "}
          {t(user.role === "admin" ? "Admin" : "Staff")}
        </p>
        <form action={changePasswordAction} className="flex flex-col gap-3">
          <Field
            label={t("Current password")}
            name="current"
            type="password"
            autoComplete="current-password"
            required
          />
          <Field
            label={t("New password")}
            name="next"
            type="password"
            autoComplete="new-password"
            required
            hint={t("At least 12 characters, letters and a number.")}
          />
          <Field
            label={t("New password again")}
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
          />
          <SubmitButton>{t("Change password")}</SubmitButton>
        </form>
      </Card>
    </>
  );
}
