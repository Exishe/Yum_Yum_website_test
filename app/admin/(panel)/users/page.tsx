import { asc } from "drizzle-orm";
import { Card, Field, Flash, PageHeader, SubmitButton, inputCls, sp, type SearchParams } from "@/components/admin/ui";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { createUserAction, resetUserPasswordAction, toggleUserAction } from "../../actions";

export const metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  const me = await requireUser(["admin"]);
  const q = await searchParams;
  const rows = await db.select().from(users).orderBy(asc(users.id));
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Yerevan", dateStyle: "medium", timeStyle: "short" });
  return (
    <>
      <PageHeader title="Users" />
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <Card className="mb-5 p-0">
        <ul className="divide-y divide-line">
          {rows.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <span className="min-w-48 flex-1">
                <strong>{u.name}</strong> · {u.email}
                <span className="block text-xs text-muted">
                  {u.role} · {u.isActive ? "active" : "switched off"} · last sign-in {u.lastLoginAt ? fmt.format(u.lastLoginAt) : "never"}
                </span>
              </span>
              {u.id !== me.id ? (
                <>
                  <form action={resetUserPasswordAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <SubmitButton confirm={`Give ${u.email} a new temporary password?`} className="h-9 bg-white px-4 text-plum ring-2 ring-plum/15 hover:bg-blush">
                      New password
                    </SubmitButton>
                  </form>
                  <form action={toggleUserAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <SubmitButton className="h-9 px-4">{u.isActive ? "Switch off" : "Switch on"}</SubmitButton>
                  </form>
                </>
              ) : (
                <span className="text-xs text-muted">you</span>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="mb-3 text-xl">Add a staff member</h2>
        <form action={createUserAction} className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
          <Field label="Name" name="name" required />
          <Field label="Email" name="email" type="email" required />
          <label className="text-sm font-semibold">
            Role
            <select name="role" className={inputCls} defaultValue="staff">
              <option value="staff">Staff: orders, prices, stock</option>
              <option value="admin">Admin: everything</option>
            </select>
          </label>
          <SubmitButton>Create user</SubmitButton>
        </form>
        <p className="mt-3 text-xs text-muted">A temporary password is shown once. They must change it at first sign-in.</p>
      </Card>
    </>
  );
}
