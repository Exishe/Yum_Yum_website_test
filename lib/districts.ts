import type { Localized } from "@/db/schema";

/** The 12 administrative districts of Yerevan. */
export const districts: Array<{ key: string; name: Localized }> = [
  { key: "ajapnyak", name: { hy: "Աջափնյակ", ru: "Ачапняк", en: "Ajapnyak" } },
  { key: "arabkir", name: { hy: "Արաբկիր", ru: "Арабкир", en: "Arabkir" } },
  { key: "avan", name: { hy: "Ավան", ru: "Аван", en: "Avan" } },
  { key: "davtashen", name: { hy: "Դավթաշեն", ru: "Давташен", en: "Davtashen" } },
  { key: "erebuni", name: { hy: "Էրեբունի", ru: "Эребуни", en: "Erebuni" } },
  { key: "kanaker-zeytun", name: { hy: "Քանաքեռ-Զեյթուն", ru: "Канакер-Зейтун", en: "Kanaker-Zeytun" } },
  { key: "kentron", name: { hy: "Կենտրոն", ru: "Кентрон", en: "Kentron" } },
  { key: "malatia-sebastia", name: { hy: "Մալաթիա-Սեբաստիա", ru: "Малатия-Себастия", en: "Malatia-Sebastia" } },
  { key: "nor-nork", name: { hy: "Նոր Նորք", ru: "Нор Норк", en: "Nor Nork" } },
  { key: "nork-marash", name: { hy: "Նորք-Մարաշ", ru: "Норк-Мараш", en: "Nork-Marash" } },
  { key: "nubarashen", name: { hy: "Նուբարաշեն", ru: "Нубарашен", en: "Nubarashen" } },
  { key: "shengavit", name: { hy: "Շենգավիթ", ru: "Шенгавит", en: "Shengavit" } },
];

export const districtKeys = districts.map((d) => d.key) as [string, ...string[]];
