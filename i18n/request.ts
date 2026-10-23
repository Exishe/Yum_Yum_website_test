import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { getTextOverrides } from "@/lib/site-texts";

type Messages = Record<string, unknown>;

/** Sets a value at a dotted path ("hero.lead") inside a nested messages object. */
function setPath(target: Messages, path: string, value: string) {
  const parts = path.split(".");
  let node: Messages = target;
  for (const part of parts.slice(0, -1)) {
    const next = node[part];
    if (!next || typeof next !== "object" || Array.isArray(next)) return;
    node = next as Messages;
  }
  const last = parts.at(-1)!;
  if (typeof node[last] === "string") node[last] = value;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const messages = structuredClone((await import(`../messages/${locale}.json`)).default) as Messages;

  // Texts edited by the client in the admin panel win over the files.
  try {
    const overrides = await getTextOverrides();
    for (const o of overrides) if (o.locale === locale) setPath(messages, o.key, o.value);
  } catch (err) {
    console.error("[i18n] could not load text overrides", err);
  }

  return { locale, messages, timeZone: "Asia/Yerevan" };
});
