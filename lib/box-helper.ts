/*
 * What the YUM-YUM donut says while the visitor packs a gift box. One line
 * per donut, written from each donut's own menu description (no invented
 * facts), and a few lines for the box itself. {name} is filled in.
 */
type Lines = { hy: string; ru: string; en: string };

export const DONUT_LINES: Record<string, Lines> = {
  "donut-chocolate": {
    hy: "Մեզ մոտ ամենաշատը շոկոլադեն են գնում։ Իսկական դասական է։",
    ru: "Шоколадный — наш бестселлер. Классика!",
    en: "The chocolate one is our bestseller. A classic!",
  },
  "donut-chocolate-rainbow": {
    hy: "Շոկոլադ ու գունավոր ցողիկներ․ տուփն արդեն տոնական է։",
    ru: "Шоколад и цветная посыпка — коробка сразу стала праздничной.",
    en: "Chocolate and rainbow sprinkles: the box just turned festive.",
  },
  "donut-caramel": {
    hy: "Կարամելային գլազուրով է՝ փափուկ ու քաղցր։",
    ru: "Карамельная глазурь — мягко и сладко.",
    en: "Caramel glaze: soft and sweet.",
  },
  "donut-white-chocolate": {
    hy: "Սպիտակ շոկոլադ․ նուրբ համ սիրողների ընտրությունը։",
    ru: "Белый шоколад — нежный выбор.",
    en: "White chocolate: the gentle choice.",
  },
  "donut-strawberry-rainbow": {
    hy: "Ելակի վարդագույն գլազուր ու ցողիկներ․ տուփն ավելի վառ դարձավ։",
    ru: "Розовая клубника с посыпкой — в коробке стало ярче.",
    en: "Pink strawberry with sprinkles: the box just got brighter.",
  },
  "donut-peach-rainbow": {
    hy: "Դեղձի գլազուր․ ամառը հենց տուփի մեջ է։",
    ru: "Персиковая глазурь — лето в коробке.",
    en: "Peach glaze: summer in a box.",
  },
  "donut-blue-bali-rainbow": {
    hy: "«Բլյու Բալին» մեր դոնաթներից ամենակապույտն է։",
    ru: "«Блю Бали» — самый голубой из наших донатов.",
    en: "Blue Bali is the bluest donut we make.",
  },
  "donut-bubble-rainbow": {
    hy: "«Բաբլը» մաստակի համ ունի։ Արդեն փորձե՞լ եք։",
    ru: "«Бабл» со вкусом жвачки. Уже пробовали?",
    en: "Bubble tastes like bubble gum. Tried it yet?",
  },
  "donut-lemon": {
    hy: "Կիտրոնային է, մի քիչ թթվաշ։ Սուրճի հետ շատ համով է։",
    ru: "Лимонный, с лёгкой кислинкой. Отлично с кофе.",
    en: "Lemon, with a little tang. Lovely with coffee.",
  },
  "donut-nutella": {
    hy: "Նուտելլա։ Էլ ի՞նչ ասեմ։",
    ru: "Нутелла. Тут и добавить нечего.",
    en: "Nutella. Nothing more to say.",
  },
  "donut-banana-nutella": {
    hy: "Բանան ու Նուտելլա․ սրանք իրար համար են ստեղծված։",
    ru: "Банан и Нутелла — беспроигрышная пара.",
    en: "Banana and Nutella: a winning pair.",
  },
  "donut-oreo": {
    hy: "Օրեոյի փշրանքով է՝ խրթխրթան։",
    ru: "С крошкой Oreo — хрустит!",
    en: "Oreo crumbs on top: crunchy!",
  },
  "donut-american-flag": {
    hy: "Գլազուրից աստղեր ու շերտեր։ Շատ տոնական է։",
    ru: "Звёзды и полосы из глазури. Очень празднично.",
    en: "Stars and stripes in glaze. Very festive.",
  },
  "donut-kinder-bueno": {
    hy: "Վրան Կինդեր Բուենո է՝ քաղցրասերների համար։",
    ru: "Киндер Буэно сверху — для сладкоежек.",
    en: "Kinder Bueno on top, for the sweet tooth.",
  },
  "donut-lotus": {
    hy: "Լոտուս թխվածքաբլիթով է՝ կարամելային ու խրթխրթան։",
    ru: "Печенье Lotus — карамельный хруст.",
    en: "Lotus biscuit: that caramel crunch.",
  },
  "donut-pistachio-king": {
    hy: "Պիստակի կրեմ։ Իզուր չէ, որ արքա է։",
    ru: "Фисташковый крем. Король и есть!",
    en: "Pistachio cream. A true king.",
  },
  "donut-caramel-latte": {
    hy: "Սուրճ ու կարամել՝ դոնաթի տեսքով։",
    ru: "Кофе и карамель в виде доната.",
    en: "Coffee and caramel, in donut form.",
  },
  "donut-frowny": {
    hy: "Կեսը բրաունի է, կեսը՝ դոնաթ։ Ընտրելու կարիք չկա։",
    ru: "Наполовину брауни, наполовину донат. Зачем выбирать?",
    en: "Half brownie, half donut. Why choose?",
  },
  "yum-donut-bavarian-chocolate": {
    hy: "Ներսում բավարական կրեմ է, վրան՝ շոկոլադ։",
    ru: "Внутри баварский крем, сверху шоколад.",
    en: "Bavarian cream inside, chocolate on top.",
  },
  "yum-donut-bavarian-caramel": {
    hy: "Ներսում բավարական կրեմ է, վրան՝ կարամել։",
    ru: "Внутри баварский крем, сверху карамель.",
    en: "Bavarian cream inside, caramel on top.",
  },
  "yum-donut-cherry": {
    hy: "Բալով Յամ դոնաթ․ և՛ թթվաշ է, և՛ քաղցր։",
    ru: "Ям-донат с вишней: чуть кисло, чуть сладко.",
    en: "Cherry Yum donut: a little tart, a little sweet.",
  },
  "yum-donut-white-chocolate-strawberry": {
    hy: "Սպիտակ շոկոլադ ու ելակ․ նուրբ համադրություն է։",
    ru: "Белый шоколад и клубника — нежное сочетание.",
    en: "White chocolate and strawberry: a gentle pair.",
  },
  "yum-donut-chocolate-caramel": {
    hy: "Շոկոլադե միջուկ ու կարամել։ Սա արդեն լուրջ է։",
    ru: "Шоколадная начинка и карамель. Тяжёлая артиллерия.",
    en: "Chocolate filling and caramel. The heavy hitter.",
  },
  "yum-donut-double-chocolate": {
    hy: "Շոկոլադ՝ և՛ ներսում, և՛ դրսում։ Շոկոլադասերների համար է։",
    ru: "Шоколад внутри и снаружи — для шоколадоголиков.",
    en: "Chocolate inside and out, for chocolate lovers.",
  },
  "long-john-bavarian-chocolate": {
    hy: "Լոնգ ջոնը երկար է, ներսն էլ լիքը կրեմ է։",
    ru: "Лонг-джон: длинный и с кремом.",
    en: "Long John: long and full of cream.",
  },
  "long-john-chocolate-caramel": {
    hy: "Լոնգ ջոն՝ շոկոլադով ու կարամելով։",
    ru: "Лонг-джон с шоколадом и карамелью.",
    en: "Long John with chocolate and caramel.",
  },
};

export const BOX_LINES: Record<"hello" | "fallback" | "full" | "removed" | "moved", Lines> = {
  hello: {
    hy: "Ընտրեք դոնաթներ ու դրեք տուփի մեջ, իսկ ես ամեն մեկի մասին կպատմեմ։",
    ru: "Выбирайте донаты и несите в коробку — расскажу о каждом.",
    en: "Pick donuts and carry them into the box. I'll tell you about each one.",
  },
  fallback: {
    hy: "{name}․ շատ լավ ընտրություն է։",
    ru: "{name} — отличный выбор!",
    en: "{name}: good choice!",
  },
  full: {
    hy: "Տուփը լցվեց։ Մնում է ավելացնել պատվերին։",
    ru: "Коробка полная! Добавляйте в заказ.",
    en: "The box is full! Add it to your order.",
  },
  removed: {
    hy: "Մտափոխվեցի՞ք։ Ոչինչ, պատահում է։",
    ru: "Передумали? Без проблем.",
    en: "Changed your mind? No problem.",
  },
  moved: {
    hy: "Լավ տեղ գտաք։",
    ru: "Хорошее место!",
    en: "Nice spot!",
  },
};

export function donutLine(slug: string, name: string, locale: "hy" | "ru" | "en") {
  const line = DONUT_LINES[slug]?.[locale];
  return line ?? BOX_LINES.fallback[locale].replace("{name}", name);
}
