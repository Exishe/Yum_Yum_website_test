import { desc, eq } from "drizzle-orm";
import {
  Card,
  Flash,
  PageHeader,
  SubmitButton,
  inputCls,
  sp,
  type SearchParams,
} from "@/components/admin/ui";
import { db } from "@/db";
import { blockedPhones, users } from "@/db/schema";
import { adminLocale } from "@/lib/admin-i18n";
import { adminT } from "@/lib/admin-lang";
import { requireUser } from "@/lib/auth";
import { formatPhone } from "@/lib/format";
import { blockPhoneAction, unblockPhoneAction } from "../../actions";

export async function generateMetadata() {
  return { title: (await adminT())("Blocked numbers") };
}

export default async function BlockedPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const q = await searchParams;
  const t = await adminT();
  const rows = await db
    .select({ b: blockedPhones, by: users.name })
    .from(blockedPhones)
    .leftJoin(users, eq(users.id, blockedPhones.blockedBy))
    .orderBy(desc(blockedPhones.createdAt));
  const fmt = new Intl.DateTimeFormat(adminLocale(t.lang), {
    timeZone: "Asia/Yerevan",
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <>
      <PageHeader title={t("Blocked numbers")} />
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <div className="flex flex-col gap-5">
        <Card>
          <p className="mb-3 text-sm text-muted">
            {t(
              "A blocked number cannot order online. The customer sees “please call us” and can still order by phone. Block from an order page, or add a number here.",
            )}
          </p>
          <form action={blockPhoneAction} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm font-semibold">
              {t("Phone")}
              <input
                name="phone"
                required
                placeholder="+374 94 12 34 56"
                className={`${inputCls} w-52`}
              />
            </label>
            <label className="flex min-w-60 flex-1 flex-col gap-1 text-sm font-semibold">
              {t("Reason (optional)")}
              <input name="reason" maxLength={200} className={inputCls} />
            </label>
            <SubmitButton confirm={t("Block this number?")}>{t("Block")}</SubmitButton>
          </form>
        </Card>
        <Card>
          {rows.length === 0 ? (
            <p className="text-muted">{t("No blocked numbers.")}</p>
          ) : (
            <ul className="divide-y divide-line">
              {rows.map(({ b, by }) => (
                <li key={b.phone} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="min-w-44 font-semibold tabular-nums">
                    {formatPhone(b.phone)}
                  </span>
                  <span className="flex-1 text-sm text-muted">
                    {b.reason ?? t("No reason given")} · {fmt.format(b.createdAt)}
                    {by ? ` · ${by}` : ""}
                  </span>
                  <form action={unblockPhoneAction}>
                    <input type="hidden" name="phone" value={b.phone} />
                    <SubmitButton variant="secondary" className="h-10 px-4">
                      {t("Unblock")}
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
