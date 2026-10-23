import { Card, Field, Flash, PageHeader, SubmitButton, sp, type SearchParams } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { changePasswordAction } from "../../actions";

export const metadata = { title: "My account" };

export default async function AccountPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const q = await searchParams;
  return (
    <>
      <PageHeader title="My account" />
      <Flash
        ok={sp(q.ok)}
        error={sp(q.error) ?? (sp(q.first) || user.mustChangePassword ? "Please choose your own password before you continue." : undefined)}
      />
      <Card className="max-w-md">
        <p className="mb-4 text-sm">
          {user.name} · {user.email} · {user.role}
        </p>
        <form action={changePasswordAction} className="flex flex-col gap-3">
          <Field label="Current password" name="current" type="password" autoComplete="current-password" required />
          <Field label="New password" name="next" type="password" autoComplete="new-password" required hint="At least 12 characters, letters and a number." />
          <Field label="New password again" name="confirm" type="password" autoComplete="new-password" required />
          <SubmitButton>Change password</SubmitButton>
        </form>
      </Card>
    </>
  );
}
