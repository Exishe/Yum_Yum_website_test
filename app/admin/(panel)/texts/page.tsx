import { Card, Flash, PageHeader, SubmitButton, btn, inputCls, sp, type SearchParams } from "@/components/admin/ui";
import { db } from "@/db";
import { siteTexts } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import en from "@/messages/en.json";
import hy from "@/messages/hy.json";
import ru from "@/messages/ru.json";
import { saveTextAction } from "../../actions";

export const metadata = { title: "Site texts" };

type Tree = { [k: string]: unknown };
function flatten(obj: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[key] = v;
    else if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flatten(v as Tree, key));
  }
  return out;
}
const files = { hy: flatten(hy as Tree), ru: flatten(ru as Tree), en: flatten(en as Tree) };

export default async function TextsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser(["admin"]);
  const q = await searchParams;
  const search = (sp(q.q) ?? "").trim().toLowerCase();
  const overrides = await db.select().from(siteTexts);
  const over = new Map(overrides.map((o) => [`${o.locale}:${o.key}`, o.value]));
  const keys = Object.keys(files.en).filter((k) => {
    if (!search) return overrides.some((o) => o.key === k);
    return [k, files.en[k], files.ru[k], files.hy[k]].some((s) => s?.toLowerCase().includes(search));
  });

  return (
    <>
      <PageHeader title="Site texts" />
      <Flash ok={sp(q.ok)} error={sp(q.error)} />
      <p className="mb-4 max-w-2xl text-sm text-muted">
        Change any sentence on the website without a developer. Search for a word you see on the site. Clearing a field brings back the
        original text. Keep placeholders like {"{count}"} or {"{price}"} as they are.
      </p>
      <form method="get" className="mb-5 flex max-w-xl gap-2">
        <label className="sr-only" htmlFor="q">
          Search texts
        </label>
        <input id="q" name="q" defaultValue={sp(q.q)} placeholder="e.g. donut, hero, Абовяна" className={inputCls} />
        <button className={`${btn.primary} mt-1`}>Search</button>
      </form>
      {!search ? <p className="mb-3 text-sm font-semibold">Texts you have changed:</p> : null}
      <div className="flex flex-col gap-4">
        {keys.slice(0, 40).map((key) => (
          <Card key={key}>
            <form action={saveTextAction} className="flex flex-col gap-2">
              <input type="hidden" name="key" value={key} />
              <input type="hidden" name="q" value={search} />
              <p className="font-mono text-xs text-muted">{key}</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                {(["hy", "ru", "en"] as const).map((l) => (
                  <label key={l} className="text-xs font-semibold text-muted" lang={l}>
                    {l.toUpperCase()}
                    <input type="hidden" name={`original.${l}`} value={files[l][key] ?? ""} />
                    <textarea name={`value.${l}`} rows={2} defaultValue={over.get(`${l}:${key}`) ?? files[l][key] ?? ""} className={`${inputCls} h-auto py-2 text-plum`} />
                  </label>
                ))}
              </div>
              <div>
                <SubmitButton className="h-9 px-4">Save</SubmitButton>
              </div>
            </form>
          </Card>
        ))}
        {keys.length === 0 ? <p className="text-muted">{search ? "Nothing found." : "No changes yet."}</p> : null}
        {keys.length > 40 ? <p className="text-sm text-muted">Showing 40 of {keys.length}. Search more precisely.</p> : null}
      </div>
    </>
  );
}
