import type { Localized } from "@/db/schema";

/**
 * What each bouquet is made of, as its shop photo shows it. The donut counts
 * match the shop's prices on buy.am (1,200 AMD per donut).
 */
const donuts = (n: number): Localized => ({
  hy: `${n} դոնաթ՝ ձեր գրություններով`,
  ru: `${n} ${n === 1 ? "донат" : n < 5 ? "доната" : "донатов"} с вашими надписями`,
  en: `${n} ${n === 1 ? "donut" : "donuts"} with your messages`,
});
const wrap: Localized = {
  hy: "գունավոր թուղթ և ժապավեն",
  ru: "цветная бумага и лента",
  en: "coloured paper and a ribbon",
};

export const BOUQUET_PARTS: Record<string, Localized[]> = {
  "bouquet-n1": [donuts(1), wrap],
  "bouquet-n4": [donuts(4), wrap],
  "bouquet-n2": [donuts(5), wrap],
  "bouquet-n6": [donuts(6), wrap],
  "bouquet-n3": [donuts(7), wrap],
  "composition-n2": [
    { hy: "փափուկ արջուկ", ru: "плюшевый мишка", en: "a teddy bear" },
    { hy: "վարդագույն դոնաթներ", ru: "розовые донаты", en: "pink donuts" },
    { hy: "տուփ՝ մեծ ժապավենով", ru: "коробка с большим бантом", en: "a box with a big bow" },
  ],
  "composition-n1": [
    {
      hy: "դոնաթներ՝ ձեր գրություններով",
      ru: "донаты с вашими надписями",
      en: "donuts with your messages",
    },
    { hy: "մարշմելոու և կոնֆետներ", ru: "маршмеллоу и конфеты", en: "marshmallows and sweets" },
    {
      hy: "տուփ՝ փոքրիկ ծաղիկներով",
      ru: "коробка с маленькими цветами",
      en: "a box with little flowers",
    },
  ],
};
