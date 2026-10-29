import { asc } from "drizzle-orm";
import {
  Card,
  Field,
  Flash,
  PageHeader,
  SubmitButton,
  inputCls,
  sp,
  type SearchParams,
} from "@/components/admin/ui";
import { db } from "@/db";
import { users } from "@/db/schema";
import { adminLocale } from "@/lib/admin-i18n";
import { adminT } from "@/lib/admin-lang";
import { requireUser } from "@/lib/auth";
import { createUserAction, resetUserPasswordAction, toggleUserAction } from "../../actions";

export async function generateMetadata() {
  return { title: (await adminT())("Users") };
}

const passwordRules = { minLength: 12, maxLength: 200, autoComplete: "new-password" } as const;

export default async function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  const me = await requireUser(["admin"]);
  const q = await searchParams;
  const t = await adminT();
  const rows = await db.select().from(users).orderBy(asc(users.id));
  const fmt = new Intl.DateTimeFormat(adminLocale(t.lang), {
    timeZone: "Asia/Yerevan",
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <>
      <PageHeader title={t("Users")} />
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <Card className="mb-5 p-0">
        <ul className="divide-y divide-line">
          {rows.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <span className="min-w-48 flex-1">
                <strong>{u.name}</strong> · {t("login")}: <strong>{u.email}</strong>
                <span className="block text-xs text-muted">
                  {u.role === "admin" ? t("Admin") : t("Staff")} ·{" "}
                  {u.isActive ? t("active") : t("switched off")} ·{" "}
                  {t("last sign-in: {when}", {
                    when: u.lastLoginAt ? fmt.format(u.lastLoginAt) : t("never"),
                  })}
                </span>
              </span>
              {u.id !== me.id ? (
                <>
                  <details className="group">
                    <summary className="flex h-9 cursor-pointer list-none items-center rounded-full bg-white px-4 font-semibold text-plum ring-2 ring-plum/15 hover:bg-blush">
                      {t("New password")}
                    </summary>
                    <form
                      action={resetUserPasswordAction}
                      className="mt-2 flex flex-wrap items-end gap-2"
                    >
                      <input type="hidden" name="id" value={u.id} />
                      <Field
                        label={t("New password for {login}", { login: u.email })}
                        name="password"
                        type="text"
                        required
                        {...passwordRules}
                        className="w-64"
                      />
                      <SubmitButton className="h-11 px-4">{t("Set password")}</SubmitButton>
                    </form>
                  </details>
                  <form action={toggleUserAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <SubmitButton className="h-9 px-4">
                      {u.isActive ? t("Switch off") : t("Switch on")}
                    </SubmitButton>
                  </form>
                </>
              ) : (
                <span className="text-xs text-muted">{t("you")}</span>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="mb-1 text-xl">{t("Add a staff member")}</h2>
        <p className="mb-4 max-w-2xl text-sm text-muted">
          {t(
            "You choose the login and a first password, then pass them to the person yourself (in person or by message). No email is sent. At first sign-in they must replace the password with their own.",
          )}
        </p>
        <form action={createUserAction} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field
            label={t("Full name")}
            name="name"
            required
            hint={t("As colleagues call them, e.g. Anna")}
          />
          <Field
            label={t("Login")}
            name="login"
            required
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            pattern="[A-Za-z0-9][A-Za-z0-9._@\-]{1,59}"
            hint={t("Latin letters and numbers, e.g. anna or anna.kentron")}
          />
          <label className="text-sm font-semibold">
            {t("Role")}
            <select name="role" className={inputCls} defaultValue="staff">
              <option value="staff">{t("Staff: orders, prices, stock")}</option>
              <option value="admin">{t("Admin: everything, including users and settings")}</option>
            </select>
          </label>
          <Field
            label={t("First password")}
            name="password"
            type="text"
            required
            {...passwordRules}
            hint={t("At least 12 characters, with letters and at least one number.")}
          />
          <div className="md:col-span-2">
            <SubmitButton>{t("Create user")}</SubmitButton>
          </div>
        </form>
      </Card>
    </>
  );
}
