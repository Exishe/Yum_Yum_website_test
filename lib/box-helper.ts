/*
 * What the YUM-YUM donut says while the visitor packs a gift box. One line
 * per donut, written from each donut's own menu description (no invented
 * facts), and a few lines for the box itself. {name} is filled in.
 */
type Lines = { hy: string; ru: string; en: string };

export const DONUT_LINES: Record<string, Lines> = {
  "donut-chocolate": {
    hy: "Շոկոլադե դոնաթը մեր ամենավաճառվողն է։ Դասական ընտրություն։",
    ru: "Шоколадный — наш бестселлер. Классика!",
    en: "The chocolate one is our bestseller. A classic!",
  },
  "donut-chocolate-rainbow": {
    hy: "Շոկոլադ և գունավոր ցողիկներ. տուփը միանգամից տոնական դարձավ։",
    ru: "Шоколад и цветная посыпка — коробка сразу стала праздничной.",
    en: "Chocolate and rainbow sprinkles: the box just turned festive.",
  },
  "donut-caramel": {
    hy: "Կարամելային գլազուր՝ փափուկ ու քաղցր։",
    ru: "Карамельная глазурь — мягко и сладко.",
    en: "Caramel glaze: soft and sweet.",
  },
  "donut-white-chocolate": {
    hy: "Սպիտակ շոկոլադ. նուրբ ընտրություն։",
    ru: "Белый шоколад — нежный выбор.",
    en: "White chocolate: the gentle choice.",
  },
  "donut-strawberry-rainbow": {
    hy: "Վարդագույն ելակ և ցողիկներ. տուփը ավելի պայծառ դարձավ։",
    ru: "Розовая клубника с посыпкой — в коробке стало ярче.",
    en: "Pink strawberry with sprinkles: the box just got brighter.",
  },
  "donut-peach-rainbow": {
    hy: "Դեղձային գլազուր. ամառ՝ տուփի մեջ։",
    ru: "Персиковая глазурь — лето в коробке.",
    en: "Peach glaze: summer in a box.",
  },
  "donut-blue-bali-rainbow": {
    hy: "«Բլյու Բալին» մեր ամենակապույտ դոնաթն է։",
    ru: "«Блю Бали» — самый голубой из наших донатов.",
    en: "Blue Bali is the bluest donut we make.",
  },
  "donut-bubble-rainbow": {
    hy: "«Բաբլը» մաստակի համով է։ Արդեն փորձե՞լ եք։",
    ru: "«Бабл» со вкусом жвачки. Уже пробовали?",
    en: "Bubble tastes like bubble gum. Tried it yet?",
  },
  "donut-lemon": {
    hy: "Կիտրոնային՝ թեթև թթվաշությամբ։ Սուրճի հետ հիանալի է։",
    ru: "Лимонный, с лёгкой кислинкой. Отлично с кофе.",
    en: "Lemon, with a little tang. Lovely with coffee.",
  },
  "donut-nutella": {
    hy: "Նուտելլա։ Ավելացնելու բան չունեմ։",
    ru: "Нутелла. Тут и добавить нечего.",
    en: "Nutella. Nothing more to say.",
  },
  "donut-banana-nutella": {
    hy: "Բանան և Նուտելլա՝ անպարտելի զույգ։",
    ru: "Банан и Нутелла — беспроигрышная пара.",
    en: "Banana and Nutella: a winning pair.",
  },
  "donut-oreo": {
    hy: "Օրեոյի փշրանքով. խրթխրթան է։",
    ru: "С крошкой Oreo — хрустит!",
    en: "Oreo crumbs on top: crunchy!",
  },
  "donut-american-flag": {
    hy: "Աստղեր և գծեր՝ գլազուրով։ Տոնական տեսք ունի։",
    ru: "Звёзды и полосы из глазури. Очень празднично.",
    en: "Stars and stripes in glaze. Very festive.",
  },
  "donut-kinder-bueno": {
    hy: "Կինդեր Բուենո՝ վերևում։ Քաղցրասերների համար։",
    ru: "Киндер Буэно сверху — для сладкоежек.",
    en: "Kinder Bueno on top, for the sweet tooth.",
  },
  "donut-lotus": {
    hy: "Լոտուս թխվածքաբլիթ՝ կարամելային խրթխրթանով։",
    ru: "Печенье Lotus — карамельный хруст.",
    en: "Lotus biscuit: that caramel crunch.",
  },
  "donut-pistachio-king": {
    hy: "Պիստակի կրեմ։ Իսկական արքա է։",
    ru: "Фисташковый крем. Король и есть!",
    en: "Pistachio cream. A true king.",
  },
  "donut-caramel-latte": {
    hy: "Սուրճ և կարամել՝ դոնաթի տեսքով։",
    ru: "Кофе и карамель в виде доната.",
    en: "Coffee and caramel, in donut form.",
  },
  "donut-frowny": {
    hy: "Կեսը բրաունի, կեսը դոնաթ։ Ինչու՞ ընտրել։",
    ru: "Наполовину брауни, наполовину донат. Зачем выбирать?",
    en: "Half brownie, half donut. Why choose?",
  },
  "yum-donut-bavarian-chocolate": {
    hy: "Ներսում բավարական կրեմ, վերևում՝ շոկոլադ։",
    ru: "Внутри баварский крем, сверху шоколад.",
    en: "Bavarian cream inside, chocolate on top.",
  },
  "yum-donut-bavarian-caramel": {
    hy: "Ներսում բավարական կրեմ, վերևում՝ կարամել։",
    ru: "Внутри баварский крем, сверху карамель.",
    en: "Bavarian cream inside, caramel on top.",
  },
  "yum-donut-cherry": {
    hy: "Բալով Յամ դոնաթ. մի քիչ թթվաշ, մի քիչ քաղցր։",
    ru: "Ям-донат с вишней: чуть кисло, чуть сладко.",
    en: "Cherry Yum donut: a little tart, a little sweet.",
  },
  "yum-donut-white-chocolate-strawberry": {
    hy: "Սպիտակ շոկոլադ և ելակ՝ նուրբ համադրություն։",
    ru: "Белый шоколад и клубника — нежное сочетание.",
    en: "White chocolate and strawberry: a gentle pair.",
  },
  "yum-donut-chocolate-caramel": {
    hy: "Շոկոլադե միջուկ և կարամել։ Ծանր հրետանի։",
    ru: "Шоколадная начинка и карамель. Тяжёлая артиллерия.",
    en: "Chocolate filling and caramel. The heavy hitter.",
  },
  "yum-donut-double-chocolate": {
    hy: "Շոկոլադ ներսում և դրսում։ Շոկոլադասերների համար։",
    ru: "Шоколад внутри и снаружи — для шоколадоголиков.",
    en: "Chocolate inside and out, for chocolate lovers.",
  },
  "long-john-bavarian-chocolate": {
    hy: "Լոնգ ջոն՝ երկար ու կրեմով լի։",
    ru: "Лонг-джон: длинный и с кремом.",
    en: "Long John: long and full of cream.",
  },
  "long-john-chocolate-caramel": {
    hy: "Լոնգ ջոն՝ շոկոլադով և կարամելով։",
    ru: "Лонг-джон с шоколадом и карамелью.",
    en: "Long John with chocolate and caramel.",
  },
};

export const BOX_LINES: Record<"hello" | "fallback" | "full" | "removed" | "moved", Lines> = {
  hello: {
    hy: "Ընտրեք դոնաթներ և տարեք տուփի մեջ։ Ես կպատմեմ յուրաքանչյուրի մասին։",
    ru: "Выбирайте донаты и несите в коробку — расскажу о каждом.",
    en: "Pick donuts and carry them into the box. I'll tell you about each one.",
  },
  fallback: {
    hy: "{name}՝ լավ ընտրություն է։",
    ru: "{name} — отличный выбор!",
    en: "{name}: good choice!",
  },
  full: {
    hy: "Տուփը լիքն է։ Ավելացրեք այն պատվերին։",
    ru: "Коробка полная! Добавляйте в заказ.",
    en: "The box is full! Add it to your order.",
  },
  removed: {
    hy: "Փոխեցի՞ք որոշումը։ Ոչ մի խնդիր։",
    ru: "Передумали? Без проблем.",
    en: "Changed your mind? No problem.",
  },
  moved: {
    hy: "Լավ տեղ է ընտրված։",
    ru: "Хорошее место!",
    en: "Nice spot!",
  },
};

export function donutLine(slug: string, name: string, locale: "hy" | "ru" | "en") {
  const line = DONUT_LINES[slug]?.[locale];
  return line ?? BOX_LINES.fallback[locale].replace("{name}", name);
}
