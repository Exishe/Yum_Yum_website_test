"use client";

import { Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

type Opt = {
  kind: "size" | "syrup" | "filling" | "text" | "extra";
  name: { hy: string; ru: string; en: string };
  priceDeltaAmd: number;
  isDefault: boolean;
  maxLength: number | null;
};

const KINDS: Array<[Opt["kind"], string]> = [
  ["size", "Size"],
  ["syrup", "Syrup"],
  ["filling", "Filling"],
  ["extra", "Extra"],
  ["text", "Custom text"],
];

const cell = "h-10 w-full rounded-lg border-2 border-line bg-white px-2 text-sm focus:border-plum focus:outline-none";

/** Edits product options in place and sends them as JSON in a hidden field. */
export function OptionsEditor({ initial }: { initial: Opt[] }) {
  const [opts, setOpts] = useState<Opt[]>(initial);
  const update = (i: number, patch: Partial<Opt>) => setOpts((o) => o.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  return (
    <fieldset className="rounded-xl border border-line p-3">
      <legend className="px-1 text-sm font-semibold">Options (sizes, syrups, text in glaze)</legend>
      <input type="hidden" name="options" value={JSON.stringify(opts)} />
      <div className="space-y-3">
        {opts.map((o, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 rounded-xl bg-blush p-2 md:grid-cols-[110px_1fr_1fr_1fr_100px_80px_auto] md:items-center">
            <select aria-label="Type" value={o.kind} onChange={(e) => update(i, { kind: e.target.value as Opt["kind"] })} className={cell}>
              {KINDS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
            {(["hy", "ru", "en"] as const).map((l) => (
              <input key={l} aria-label={`Name ${l}`} placeholder={l.toUpperCase()} value={o.name[l]} lang={l} onChange={(e) => update(i, { name: { ...o.name, [l]: e.target.value } })} className={cell} />
            ))}
            {o.kind === "text" ? (
              <input aria-label="Max characters" type="number" min={1} max={200} placeholder="max chars" value={o.maxLength ?? ""} onChange={(e) => update(i, { maxLength: e.target.value ? Number(e.target.value) : null })} className={cell} />
            ) : (
              <input aria-label="Extra price, dram" type="number" placeholder="+ ֏" value={o.priceDeltaAmd} onChange={(e) => update(i, { priceDeltaAmd: Number(e.target.value) || 0 })} className={cell} />
            )}
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={o.isDefault} onChange={(e) => update(i, { isDefault: e.target.checked })} className="accent-magenta" /> default
            </label>
            <button type="button" aria-label="Remove option" onClick={() => setOpts((x) => x.filter((_, k) => k !== i))} className="grid size-10 place-items-center rounded-full hover:bg-magenta-soft">
              <Trash size={16} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpts((o) => [...o, { kind: "syrup", name: { hy: "", ru: "", en: "" }, priceDeltaAmd: 0, isDefault: false, maxLength: null }])}
        className="mt-3 inline-flex h-10 items-center gap-1 rounded-full bg-white px-4 text-sm font-semibold ring-2 ring-plum/15"
      >
        <Plus size={14} /> Add option
      </button>
    </fieldset>
  );
}
