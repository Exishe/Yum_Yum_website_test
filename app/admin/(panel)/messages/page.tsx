import { desc } from "drizzle-orm";
import {
  Card,
  Flash,
  PageHeader,
  SubmitButton,
  sp,
  type SearchParams,
} from "@/components/admin/ui";
import { db } from "@/db";
import { contactMessages, newsletterSubscribers } from "@/db/schema";
import { adminLocale } from "@/lib/admin-i18n";
import { adminT } from "@/lib/admin-lang";
import { requireUser } from "@/lib/auth";
import { markMessageAction } from "../../actions";

export async function generateMetadata() {
  return { title: (await adminT())("Messages") };
}

export default async function MessagesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const q = await searchParams;
  const t = await adminT();
  const [msgs, subs] = await Promise.all([
    db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(100),
    user.role === "admin"
      ? db
          .select()
          .from(newsletterSubscribers)
          .orderBy(desc(newsletterSubscribers.createdAt))
          .limit(500)
      : [],
  ]);
  const fmt = new Intl.DateTimeFormat(adminLocale(t.lang), {
    timeZone: "Asia/Yerevan",
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <>
      <PageHeader title={t("Messages")} />
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <div className="flex flex-col gap-3">
        {msgs.map((m) => (
          <Card key={m.id} className={m.isHandled ? "opacity-60" : ""}>
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <p>
                <strong>{m.name}</strong> · {m.contact} · {m.locale.toUpperCase()}
              </p>
              <p className="text-muted">{fmt.format(m.createdAt)}</p>
            </div>
            <p className="mt-2 whitespace-pre-wrap">{m.message}</p>
            {!m.isHandled ? (
              <form action={markMessageAction} className="mt-3">
                <input type="hidden" name="id" value={m.id} />
                <SubmitButton className="h-9 px-4">{t("Mark as handled")}</SubmitButton>
              </form>
            ) : null}
          </Card>
        ))}
        {msgs.length === 0 ? <p className="text-muted">{t("No messages.")}</p> : null}
      </div>
      {user.role === "admin" ? (
        <>
          <h2 className="mt-10 mb-3 text-2xl">{t("Newsletter subscribers")}</h2>
          <p className="mb-3 text-sm text-muted">
            {t("{confirmed} confirmed, {pending} waiting for email confirmation.", {
              confirmed: subs.filter((s) => s.status === "confirmed").length,
              pending: subs.filter((s) => s.status === "pending").length,
            })}
          </p>
          <Card className="p-0">
            <ul className="divide-y divide-line text-sm">
              {subs.map((s) => (
                <li key={s.id} className="flex justify-between gap-3 px-4 py-2">
                  <span>{s.email}</span>
                  <span className="text-muted">
                    {s.locale.toUpperCase()} · {t(s.status)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : null}
    </>
  );
}
