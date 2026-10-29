import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hy } from "@/lib/admin-hy";
import { decodeFlash, encodeFlash, makeT } from "@/lib/admin-i18n";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(p) ? [p] : [];
  });
}

/** Every English text the admin shows: t("…") calls, nav labels and action messages. */
function adminTexts(): string[] {
  const out = new Set<string>();
  const add = (s: string, re: RegExp) => {
    for (const m of s.matchAll(re)) out.add(m[1]!);
  };
  for (const f of [...files("app/admin"), ...files("components/admin")]) {
    const s = readFileSync(f, "utf8");
    add(s, /\bt\(\s*"((?:[^"\\]|\\.)*)"/g);
    add(s, /\(await adminT\(\)\)\("([^"]+)"/g);
    add(s, /\blabel: "([^"]+)"/g);
    add(s, /back\(\s*[^,]+,\s*"(?:ok|error)",\s*"((?:[^"\\]|\\.)*)"/g);
    add(s, /\berror: "([^"]+)"/g);
  }
  for (const f of ["lib/auth.ts", "lib/storage.ts"]) {
    add(readFileSync(f, "utf8"), /(?:error: |new Error\()"([^"]+\.)"/g);
  }
  return [...out];
}

describe("admin Armenian", () => {
  it("has an Armenian line for every admin text", () => {
    const missing = adminTexts().filter((k) => !hy[k]);
    expect(missing).toEqual([]);
  });

  it("keeps every {placeholder}", () => {
    const names = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const broken = Object.entries(hy).filter(([en, am]) => names(en).join() !== names(am).join());
    expect(broken).toEqual([]);
  });

  it("translates with parameters and falls back to English", () => {
    expect(makeT("hy")("Order #{code}", { code: "AB12" })).toBe("Պատվեր #AB12");
    expect(makeT("en")("Order #{code}", { code: "AB12" })).toBe("Order #AB12");
    expect(makeT("hy")("not in the dictionary")).toBe("not in the dictionary");
  });

  it("round-trips flash messages with parameters", () => {
    expect(decodeFlash(encodeFlash("Saved “{key}”.", { key: "home.title" }))).toEqual([
      "Saved “{key}”.",
      { key: "home.title" },
    ]);
    expect(decodeFlash("Saved.")).toEqual(["Saved.", undefined]);
  });
});
