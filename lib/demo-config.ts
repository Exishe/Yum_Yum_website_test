/*
 * Concept-demo settings: the Wiymood badge, hiding the site from search
 * engines and Vercel Web Analytics. Set `enabled: false` before the real
 * launch and all three switch off together.
 */
import type { Metadata } from "next";

export const DEMO = {
  enabled: true,

  team: "Wiymood",
  client: "YUM-YUM",
  telegram: "https://t.me/sroondz",
  phone: "+374 91 707407",
  /** A collapsed badge opens again after this many seconds. */
  reopenAfterSeconds: 30,

  /** {team} and {client} are filled in from above. */
  texts: {
    hy: {
      label: "Փորձնական տարբերակ",
      title: "Այս կայքը {client}-ի համար պատրաստել է {team} թիմը։",
      button: "Գրեք մեզ Telegram-ով",
      collapse: "Փոքրացնել",
    },
    ru: {
      label: "Концепт сайта",
      title: "Этот сайт для {client} сделала команда {team}",
      button: "Написать разработчикам",
      collapse: "Свернуть",
    },
    en: {
      label: "Website concept",
      title: "The {team} team built this site for {client}",
      button: "Message the developers",
      collapse: "Minimise",
    },
  },
} as const;

export type DemoLocale = keyof typeof DEMO.texts;

/** Badge texts for one language, with the team and client names filled in. */
export function demoTexts(locale: string) {
  const t = DEMO.texts[(locale in DEMO.texts ? locale : "en") as DemoLocale];
  return {
    ...t,
    title: t.title.replace("{team}", DEMO.team).replace("{client}", DEMO.client),
  };
}

/** True while the site must stay out of search results (demo, or a `pnpm share` preview). */
export const hiddenFromSearch = DEMO.enabled || process.env.PREVIEW_NOINDEX === "1";

/** A page's own robots rule, unless the whole site is hidden from search. */
export function robotsFor(page: Metadata["robots"]): Metadata["robots"] {
  return hiddenFromSearch ? { index: false, follow: false } : page;
}
