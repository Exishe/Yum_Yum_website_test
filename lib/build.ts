/*
 * A donut made in the 3D builder on the home page. The customer pays for the
 * closest menu donut; the build (glaze, toppings, packaging) travels with the
 * order so the shop sees exactly what was made, in the admin order page and in
 * the staff message. Labels match messages/*.json → builder.
 */
import { z } from "zod";
import type { Localized } from "@/db/schema";

export const BUILD_FLAVOURS = [
  "chocolate",
  "caramel",
  "white",
  "strawberry",
  "peach",
  "blue",
  "lemon",
  "pistachio",
] as const;
export const BUILD_TOPPINGS = ["sprinkles", "chocolate", "white", "nuts"] as const;
export const BUILD_PACKS = ["paper", "box", "gift"] as const;

export const buildSchema = z.object({
  flavour: z.enum(BUILD_FLAVOURS),
  toppings: z.array(z.enum(BUILD_TOPPINGS)).max(BUILD_TOPPINGS.length),
  pack: z.enum(BUILD_PACKS),
});
export type DonutBuild = z.infer<typeof buildSchema>;

const FLAVOUR: Record<DonutBuild["flavour"], Localized> = {
  chocolate: { hy: "Շոկոլադ", ru: "Шоколад", en: "Chocolate" },
  caramel: { hy: "Կարամել", ru: "Карамель", en: "Caramel" },
  white: { hy: "Սպիտակ շոկոլադ", ru: "Белый шоколад", en: "White chocolate" },
  strawberry: { hy: "Ելակ", ru: "Клубника", en: "Strawberry" },
  peach: { hy: "Դեղձ", ru: "Персик", en: "Peach" },
  blue: { hy: "«Բլյու Բալի»", ru: "«Блю Бали»", en: "Blue Bali" },
  lemon: { hy: "Կիտրոն", ru: "Лимон", en: "Lemon" },
  pistachio: { hy: "Պիստակ", ru: "Фисташка", en: "Pistachio" },
};
const TOPPING: Record<DonutBuild["toppings"][number], Localized> = {
  sprinkles: { hy: "գունավոր ցողիկներ", ru: "цветная посыпка", en: "rainbow sprinkles" },
  chocolate: { hy: "շոկոլադե շիթ", ru: "шоколадная полоска", en: "chocolate drizzle" },
  white: {
    hy: "սպիտակ շոկոլադե շիթ",
    ru: "полоска белого шоколада",
    en: "white chocolate drizzle",
  },
  nuts: { hy: "մանրացված ընկույզ", ru: "дроблёные орехи", en: "crushed nuts" },
};
const PACK: Record<DonutBuild["pack"], Localized> = {
  paper: { hy: "թղթի վրա", ru: "на бумаге", en: "on paper" },
  box: { hy: "տուփով", ru: "в коробке", en: "in a box" },
  gift: { hy: "նվերի փաթեթով", ru: "в подарочной упаковке", en: "gift-wrapped" },
};
const NONE: Localized = { hy: "առանց զարդարանքի", ru: "без топпинга", en: "no toppings" };

/** "Շոկոլադ · գունավոր ցողիկներ · տուփով" in one language. */
export function buildText(b: DonutBuild, lang: keyof Localized): string {
  const tops = b.toppings.length ? b.toppings.map((k) => TOPPING[k][lang]).join(", ") : NONE[lang];
  return [FLAVOUR[b.flavour][lang], tops, PACK[b.pack][lang]].join(" · ");
}

/** The same in all three languages, for the cart snapshot. */
export function buildLabel(b: DonutBuild): Localized {
  return { hy: buildText(b, "hy"), ru: buildText(b, "ru"), en: buildText(b, "en") };
}
