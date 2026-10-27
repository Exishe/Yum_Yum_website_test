/*
 * Seed data for YUM-YUM Donuts. Every fact here comes from a public source
 * listed in docs/RESEARCH.md. Prices come from buy.am (October 2026) and the
 * drink menu boards photographed in the shops; they are stored with
 * priceIsSample = true until the client confirms them in the admin panel.
 *
 * Armenian and Russian product names: REVIEW(native) — see docs/REVIEW-NATIVE.md.
 */
import type { Localized, WeekHours } from "./schema";

const L = (hy: string, ru: string, en: string): Localized => ({ hy, ru, en });
const P = "/images/source";

export const seedCategories = [
  {
    slug: "donuts",
    name: L("Դոնաթներ", "Донаты", "Donuts"),
    description: L(
      "Դասական և հեղինակային դոնաթներ՝ գլազուրով և միջուկով։",
      "Классические и авторские донаты с глазурью и начинками.",
      "Classic and signature donuts, glazed and filled.",
    ),
    image: `${P}/tomsarkgh/yumyum-19.jpg`,
    sortOrder: 1,
  },
  {
    slug: "iced",
    name: L("Սառը ըմպելիքներ", "Холодные напитки", "Iced drinks"),
    description: L(
      "Սառը սուրճ, ֆրապուչինո և շեյքեր։",
      "Айс-кофе, фраппучино и шейки.",
      "Iced coffee, frappuccino and shakes.",
    ),
    image: `${P}/tomsarkgh/yumyum-18.jpg`,
    sortOrder: 2,
  },
  {
    slug: "coffee",
    name: L("Սուրճ և թեյ", "Кофе и чай", "Coffee & tea"),
    description: L(
      "Էսպրեսոյից մինչև ռաֆ, նաև տաք շոկոլադ։",
      "От эспрессо до рафа, плюс горячий шоколад.",
      "Espresso to raf, plus hot chocolate.",
    ),
    image: `${P}/tomsarkgh/yumyum-22.jpg`,
    sortOrder: 3,
  },
  {
    slug: "bakes",
    name: L("Թխվածքներ և տորթեր", "Выпечка и десерты", "Cakes & bakes"),
    description: L(
      "Կրուասաններ, մաֆիններ, տարտեր և աղի կարկանդակներ։",
      "Круассаны, маффины, тарты и пирожки.",
      "Croissants, muffins, tarts and savoury pies.",
    ),
    image: `${P}/tomsarkgh/yumyum-16.jpg`,
    sortOrder: 4,
  },
  {
    slug: "gifts",
    name: L("Նվերներ", "Подарки", "Gifts"),
    description: L(
      "Դոնաթե ծաղկեփնջեր, տուփեր և անուններով դոնաթներ։",
      "Букеты из донатов, коробки и донаты с именами.",
      "Donut bouquets, boxes and name donuts.",
    ),
    image: `${P}/tomsarkgh/yumyum-26.jpg`,
    sortOrder: 5,
  },
] as const;

type SeedOption = {
  kind: "size" | "syrup" | "filling" | "text" | "extra";
  name: Localized;
  priceDeltaAmd: number;
  isDefault?: boolean;
  maxLength?: number;
};

export type SeedProduct = {
  slug: string;
  category: (typeof seedCategories)[number]["slug"];
  name: Localized;
  description?: Localized;
  priceAmd: number;
  image?: string;
  tags?: string[];
  badges?: string[];
  isFeatured?: boolean;
  leadTimeDays?: number;
  boxSize?: number;
  source: string;
  options?: SeedOption[];
};

const BUYAM = "buy.am, Oct 2026";
const BOARD = "in-shop menu board (Yandex Maps photos), 2025–2026";
export const SAMPLE = "placeholder — no public price";

/** "Regular / XL" sizes from the drink menu boards. */
const sizes = (xlDelta: number): SeedOption[] => [
  { kind: "size", name: L("Սովորական", "Обычный", "Regular"), priceDeltaAmd: 0, isDefault: true },
  { kind: "size", name: L("XL", "XL", "XL"), priceDeltaAmd: xlDelta },
];

const syrups: SeedOption[] = [
  { kind: "syrup", name: L("Կարամել", "Карамель", "Caramel"), priceDeltaAmd: 200 },
  { kind: "syrup", name: L("Վանիլ", "Ваниль", "Vanilla"), priceDeltaAmd: 200 },
  { kind: "syrup", name: L("Պնդուկ", "Лесной орех", "Hazelnut"), priceDeltaAmd: 200 },
];

const donut = (
  slug: string,
  name: Localized,
  description: Localized,
  priceAmd: number,
  tags: string[],
  extra: Partial<SeedProduct> = {},
): SeedProduct => ({
  slug,
  category: "donuts",
  name,
  description,
  priceAmd,
  image: `${P}/buyam/${slug}.jpg`,
  tags,
  source: BUYAM,
  ...extra,
});

export const seedProducts: SeedProduct[] = [
  /* ── Donuts ── */
  donut(
    "donut-chocolate",
    L("Շոկոլադե դոնաթ", "Шоколадный донат", "Chocolate glazed"),
    L("Մուգ շոկոլադե գլազուր", "Тёмная шоколадная глазурь", "Dark chocolate glaze"),
    700,
    ["glazed", "chocolate"],
    { badges: ["bestseller"], isFeatured: true },
  ),
  donut(
    "donut-chocolate-rainbow",
    L("Շոկոլադե «Ծիածան»", "Шоколадный «Радуга»", "Chocolate rainbow"),
    L(
      "Շոկոլադե գլազուր և գունավոր ցողիկներ",
      "Шоколадная глазурь и цветная посыпка",
      "Chocolate glaze, rainbow sprinkles",
    ),
    700,
    ["glazed", "chocolate", "kids"],
    { badges: ["bestseller"] },
  ),
  donut(
    "donut-caramel",
    L("Կարամելային դոնաթ", "Донат с карамелью", "Caramel"),
    L("Կարամելային գլազուր", "Карамельная глазурь", "Caramel glaze"),
    700,
    ["glazed"],
  ),
  donut(
    "donut-white-chocolate",
    L("Սպիտակ շոկոլադով դոնաթ", "С белым шоколадом", "White chocolate"),
    L("Սպիտակ շոկոլադե գլազուր", "Глазурь из белого шоколада", "White chocolate glaze"),
    700,
    ["glazed", "chocolate"],
  ),
  donut(
    "donut-strawberry-rainbow",
    L("Ելակ «Ծիածան»", "Клубника «Радуга»", "Strawberry rainbow"),
    L("Վարդագույն ելակային գլազուր", "Розовая клубничная глазурь", "Pink strawberry glaze"),
    550,
    ["glazed", "fruity", "kids"],
  ),
  donut(
    "donut-peach-rainbow",
    L("Դեղձ «Ծիածան»", "Персик «Радуга»", "Peach rainbow"),
    L("Դեղձային գլազուր և ցողիկներ", "Персиковая глазурь и посыпка", "Peach glaze, sprinkles"),
    550,
    ["glazed", "fruity", "kids"],
  ),
  donut(
    "donut-blue-bali-rainbow",
    L("«Բլյու Բալի»", "«Блю Бали»", "Blue Bali rainbow"),
    L("Կապույտ գլազուր և ցողիկներ", "Голубая глазурь и посыпка", "Blue glaze, sprinkles"),
    550,
    ["glazed", "kids"],
  ),
  donut(
    "donut-bubble-rainbow",
    L("«Բաբլ»", "«Бабл»", "Bubble rainbow"),
    L("Մաստակի համով գլազուր", "Глазурь со вкусом жвачки", "Bubble-gum glaze"),
    550,
    ["glazed", "kids"],
  ),
  donut(
    "donut-lemon",
    L("Կիտրոնային դոնաթ", "Лимонный", "Lemon"),
    L("Կիտրոնային գլազուր", "Лимонная глазурь", "Lemon glaze"),
    600,
    ["glazed", "fruity"],
  ),
  donut(
    "donut-nutella",
    L("Նուտելլա", "Нутелла", "Nutella"),
    L("Նուտելլայով", "С Нутеллой", "Topped with Nutella"),
    700,
    ["chocolate"],
  ),
  donut(
    "donut-banana-nutella",
    L("Բանան-Նուտելլա", "Банан-Нутелла", "Banana Nutella"),
    L("Բանան և Նուտելլա", "Банан и Нутелла", "Banana and Nutella"),
    800,
    ["chocolate", "fruity"],
  ),
  donut(
    "donut-oreo",
    L("Օրեո", "Орео", "Oreo"),
    L("Օրեո թխվածքաբլիթի փշրանքով", "С крошкой печенья Oreo", "With Oreo cookie crumbs"),
    800,
    ["chocolate", "kids"],
  ),
  donut(
    "donut-american-flag",
    L("«Ամերիկյան դրոշ»", "«Флаг Америки»", "American flag"),
    L(
      "Ամերիկյան դրոշի գույներով",
      "В честь наших американских корней",
      "A nod to our New Jersey roots",
    ),
    700,
    ["glazed", "kids"],
  ),
  donut(
    "donut-kinder-bueno",
    L("Կինդեր Բուենո", "Киндер Буэно", "Kinder Bueno"),
    L("Կինդեր Բուենոյով", "С Киндер Буэно", "Topped with Kinder Bueno"),
    1000,
    ["chocolate", "kids"],
    { badges: ["new"] },
  ),
  donut(
    "donut-lotus",
    L("Լոտուս", "Лотус", "Lotus"),
    L("Լոտուս թխվածքաբլիթով", "С печеньем Lotus", "With Lotus biscuit"),
    1000,
    ["glazed"],
  ),
  donut(
    "donut-pistachio-king",
    L("Պիստաչո Քինգ", "Пистачо Кинг", "Pistachio King"),
    L("Պիստակի կրեմով", "С фисташковым кремом", "Pistachio cream"),
    1000,
    ["filled"],
    { badges: ["new"] },
  ),
  donut(
    "donut-caramel-latte",
    L("Կարամել լատտե", "Карамель латте", "Caramel latte"),
    L("Սուրճով և կարամելով", "С кофе и карамелью", "Coffee and caramel"),
    1000,
    ["glazed"],
  ),
  donut(
    "donut-frowny",
    L("Ֆրաունի", "Фрауни", "Frowny"),
    L("Բրաունիի և դոնաթի խառնուրդ", "Брауни и донат в одном", "Half brownie, half donut"),
    1000,
    ["chocolate"],
  ),
  donut(
    "yum-donut-bavarian-chocolate",
    L(
      "Յամ դոնաթ բավարական կրեմով և շոկոլադով",
      "Ям-донат с баварским кремом и шоколадом",
      "Yum donut, Bavarian cream",
    ),
    L(
      "Բավարական կրեմ ներսում, շոկոլադ վրան",
      "Баварский крем внутри, шоколад сверху",
      "Bavarian cream inside, chocolate on top",
    ),
    800,
    ["filled", "chocolate"],
    { badges: ["bestseller"] },
  ),
  donut(
    "yum-donut-bavarian-caramel",
    L(
      "Յամ դոնաթ բավարական կրեմով և կարամելով",
      "Ям-донат с баварским кремом и карамелью",
      "Yum donut, cream & caramel",
    ),
    L(
      "Բավարական կրեմ ներսում, կարամել վրան",
      "Баварский крем внутри, карамель сверху",
      "Bavarian cream inside, caramel on top",
    ),
    800,
    ["filled"],
  ),
  donut(
    "yum-donut-cherry",
    L("Յամ դոնաթ «Բալ»", "Ям-донат «Вишня»", "Yum donut, cherry"),
    L(
      "Բալի միջուկ, սպիտակ շոկոլադ",
      "Вишнёвая начинка, белый шоколад",
      "Cherry filling, white chocolate",
    ),
    800,
    ["filled", "fruity"],
  ),
  donut(
    "yum-donut-white-chocolate-strawberry",
    L("Յամ դոնաթ սպիտակ շոկոլադով և ելակով", "Ям-донат с клубникой", "Yum donut, strawberry"),
    L(
      "Ելակի միջուկ, սպիտակ շոկոլադ",
      "Клубничная начинка, белый шоколад",
      "Strawberry filling, white chocolate",
    ),
    800,
    ["filled", "fruity"],
  ),
  donut(
    "yum-donut-chocolate-caramel",
    L(
      "Յամ դոնաթ շոկոլադով և կարամելով",
      "Ям-донат шоколад-карамель",
      "Yum donut, chocolate caramel",
    ),
    L("Շոկոլադե միջուկ, կարամել", "Шоколадная начинка, карамель", "Chocolate filling, caramel"),
    800,
    ["filled", "chocolate"],
  ),
  donut(
    "yum-donut-double-chocolate",
    L("Յամ դոնաթ կրկնակի շոկոլադով", "Ям-донат «Шоколад-шоколад»", "Yum donut, double chocolate"),
    L("Շոկոլադ ներսում և դրսում", "Шоколад внутри и снаружи", "Chocolate inside and out"),
    800,
    ["filled", "chocolate"],
  ),
  donut(
    "long-john-bavarian-chocolate",
    L(
      "Լոնգ Ջոն բավարական կրեմով և շոկոլադով",
      "Лонг Джон с баварским кремом",
      "Long John, Bavarian cream",
    ),
    L(
      "Երկար դոնաթ, կրեմ և շոկոլադ",
      "Длинный донат, крем и шоколад",
      "Long donut, cream and chocolate",
    ),
    1000,
    ["filled", "chocolate"],
  ),
  donut(
    "long-john-chocolate-caramel",
    L(
      "Լոնգ Ջոն շոկոլադե միջուկով և կարամելով",
      "Лонг Джон шоколад-карамель",
      "Long John, chocolate caramel",
    ),
    L(
      "Շոկոլադե միջուկ, կարամելային գլազուր",
      "Шоколадная начинка, карамельная глазурь",
      "Chocolate filling, caramel glaze",
    ),
    1000,
    ["filled", "chocolate"],
  ),

  /* ── Iced drinks (menu board prices: regular / XL) ── */
  ...(
    [
      ["iced-latte", L("Սառը լատտե", "Айс латте", "Iced latte"), 700, 200, ["iced"]],
      [
        "iced-americano",
        L("Սառը ամերիկանո", "Айс американо", "Iced americano"),
        600,
        300,
        ["iced"],
      ],
      [
        "iced-cappuccino",
        L("Սառը կապուչինո", "Айс капучино", "Iced cappuccino"),
        700,
        200,
        ["iced"],
      ],
      [
        "caramel-frappuccino",
        L("Կարամելային ֆրապուչինո", "Карамельный фраппучино", "Caramel frappuccino"),
        900,
        300,
        ["iced"],
      ],
      [
        "donut-frappuccino",
        L("Դոնաթ ֆրապուչինո", "Донат-фраппучино", "Donut frappuccino"),
        1200,
        300,
        ["iced"],
      ],
      ["cafe-glace", L("Կաֆե գլասե", "Кофе гляссе", "Café glacé"), 700, 300, ["iced"]],
      [
        "iced-mocaccino",
        L("Սառը մոկաչինո", "Айс мокаччино", "Iced mocaccino"),
        900,
        300,
        ["iced", "chocolate"],
      ],
    ] as const
  ).map(([slug, name, price, xl, tags], i): SeedProduct => ({
    slug,
    category: "iced",
    name,
    priceAmd: price,
    tags: [...tags],
    source: BOARD,
    isFeatured: i === 0,
    image: i === 0 ? `${P}/tomsarkgh/yumyum-18.jpg` : undefined,
    options: [...sizes(xl), ...syrups],
  })),
  ...(
    [
      ["donut-shake", L("Դոնաթ շեյք", "Донат-шейк", "Donut shake"), `${P}/tomsarkgh/yumyum-24.jpg`],
      ["oreo-shake", L("Օրեո շեյք", "Орео-шейк", "Oreo shake"), undefined],
      [
        "strawberry-banana-shake",
        L("Ելակ-բանան շեյք", "Клубника-банан шейк", "Strawberry banana shake"),
        undefined,
      ],
      ["cookie-shake", L("Թխվածքաբլիթով շեյք", "Шейк с печеньем", "Cookie shake"), undefined],
      [
        "banana-nutella-shake",
        L("Բանան-Նուտելլա շեյք", "Банан-Нутелла шейк", "Banana Nutella shake"),
        undefined,
      ],
    ] as const
  ).map(([slug, name, image]): SeedProduct => ({
    slug,
    category: "iced",
    name,
    description: L(
      "Կաթնային շեյք հարած սերուցքով",
      "Молочный шейк со взбитыми сливками",
      "Milkshake with whipped cream",
    ),
    priceAmd: 1200,
    tags: ["iced", "kids"],
    source: BOARD,
    image,
  })),
  {
    slug: "iced-chocolate",
    category: "iced",
    name: L("Սառը շոկոլադ", "Холодный шоколад", "Iced chocolate"),
    priceAmd: 500,
    tags: ["iced", "chocolate", "kids"],
    source: BOARD,
  },
  {
    slug: "passion-rush",
    category: "iced",
    name: L("Փեշն Ռաշ", "Пэшн Раш", "Passion Rush"),
    description: L(
      "Սառը թեյ մարակույայով, XL",
      "Холодный чай с маракуйей, XL",
      "Passion-fruit iced tea, XL",
    ),
    priceAmd: 800,
    tags: ["iced", "fruity"],
    source: BOARD,
  },
  {
    slug: "lucky-cherry",
    category: "iced",
    name: L("Լաքի Չերի", "Лаки Черри", "Lucky Cherry"),
    description: L(
      "Սառը բալային ըմպելիք, XL",
      "Холодный вишнёвый напиток, XL",
      "Iced cherry drink, XL",
    ),
    priceAmd: 800,
    tags: ["iced", "fruity"],
    source: BOARD,
  },
  {
    slug: "coca-cola",
    category: "iced",
    name: L("Կոկա-Կոլա 0.25 լ", "Coca-Cola 0,25 л", "Coca-Cola 0.25 l"),
    priceAmd: 400,
    image: `${P}/buyam/coca-cola.webp`,
    tags: ["iced"],
    source: BUYAM,
  },
  {
    slug: "water-zulal",
    category: "iced",
    name: L("Ջուր «Զուլալ» 0.5 լ", "Вода «Зулал» 0,5 л", "Zulal water 0.5 l"),
    priceAmd: 300,
    image: `${P}/buyam/water-zulal.webp`,
    tags: ["iced"],
    source: BUYAM,
  },

  /* ── Coffee & tea ── */
  ...(
    [
      ["espresso", L("Էսպրեսո", "Эспрессо", "Espresso"), 600, 200, "buyam/americano.jpg"],
      ["americano", L("Ամերիկանո", "Американо", "Americano"), 600, 300, "buyam/americano.jpg"],
      ["cappuccino", L("Կապուչինո", "Капучино", "Cappuccino"), 700, 200, "buyam/cappuccino.jpg"],
      ["cafe-latte", L("Լատտե", "Латте", "Café latte"), 700, 200, undefined],
      [
        "salted-caramel-latte",
        L("Աղի կարամելով լատտե", "Латте с солёной карамелью", "Salted caramel latte"),
        900,
        300,
        undefined,
      ],
      ["raf-coffee", L("Ռաֆ", "Раф", "Raf coffee"), 900, 300, undefined],
      [
        "mac-coffee-nutella",
        L("Մակ Քոֆի Նուտելլա", "Мак Кофе Нутелла", "Mac Coffee Nutella"),
        600,
        300,
        undefined,
      ],
      ["nescafe", L("Նեսկաֆե", "Нескафе", "Nescafé"), 450, 200, "buyam/nescafe.jpg"],
    ] as const
  ).map(([slug, name, price, xl, image]): SeedProduct => ({
    slug,
    category: "coffee",
    name,
    priceAmd: price,
    tags: ["hot"],
    source: BOARD,
    isFeatured: slug === "cappuccino",
    image: image ? `${P}/${image}` : undefined,
    options: slug === "espresso" ? sizes(xl) : [...sizes(xl), ...syrups],
  })),
  {
    slug: "eastern-coffee",
    category: "coffee",
    name: L("Հայկական սուրճ", "Кофе по-восточному", "Armenian coffee"),
    description: L("Եփած ջազվեում", "Сваренный в джезве", "Brewed in a jazzve"),
    priceAmd: 500,
    tags: ["hot"],
    source: BOARD,
  },
  {
    slug: "mocaccino",
    category: "coffee",
    name: L("Մոկաչինո", "Мокаччино", "Mocaccino"),
    priceAmd: 1200,
    tags: ["hot", "chocolate"],
    source: BOARD,
  },
  {
    slug: "hot-chocolate",
    category: "coffee",
    name: L("Տաք շոկոլադ", "Горячий шоколад", "Hot chocolate"),
    priceAmd: 400,
    image: `${P}/buyam/hot-chocolate.jpg`,
    tags: ["hot", "chocolate", "kids"],
    source: BUYAM,
    options: [
      {
        kind: "extra",
        name: L("Մարշմելոուով", "С маршмеллоу", "With marshmallows"),
        priceDeltaAmd: 300,
      },
    ],
  },
  {
    slug: "tea",
    category: "coffee",
    name: L("Թեյ", "Чай", "Tea"),
    priceAmd: 400,
    image: `${P}/buyam/tea.jpg`,
    tags: ["hot"],
    source: BUYAM,
  },
  {
    slug: "honey-ginger-tea",
    category: "coffee",
    name: L("Մեղր-կոճապղպեղ թեյ", "Чай мёд-имбирь", "Honey ginger tea"),
    priceAmd: 800,
    tags: ["hot"],
    source: BOARD,
  },
  {
    slug: "berry-tea",
    category: "coffee",
    name: L("Հատապտղային թեյ", "Ягодный чай", "Berry tea"),
    priceAmd: 800,
    tags: ["hot", "fruity"],
    source: BOARD,
  },

  /* ── Cakes & bakes ── */
  ...(
    [
      [
        "croissant-almond",
        L("Կրուասան նուշով", "Круассан с миндалём", "Almond croissant"),
        900,
        [],
      ],
      [
        "croissant-nutella",
        L("Կրուասան Նուտելլայով", "Круассан с Нутеллой", "Nutella croissant"),
        1000,
        ["chocolate"],
      ],
      [
        "croissant-bueno",
        L("Կրուասան Բուենո", "Круассан Буэно", "Bueno croissant"),
        1000,
        ["chocolate"],
      ],
      [
        "croissant-pistachio",
        L("Կրուասան պիստակով", "Круассан с фисташкой", "Pistachio croissant"),
        1200,
        [],
      ],
      [
        "muffin-chocolate",
        L("Շոկոլադե մաֆին", "Шоколадный маффин", "Chocolate muffin"),
        600,
        ["chocolate", "kids"],
      ],
      ["muffin-pistachio", L("Պիստակով մաֆին", "Фисташковый маффин", "Pistachio muffin"), 600, []],
      [
        "muffin-apricot",
        L("Ծիրանով մաֆին", "Абрикосовый маффин", "Apricot muffin"),
        600,
        ["fruity"],
      ],
      [
        "cheesecake-cherry",
        L("Չիզքեյք բալով", "Чизкейк с вишней", "Cherry cheesecake"),
        1500,
        ["fruity"],
      ],
      [
        "tart-dubai-chocolate",
        L("«Դուբայական շոկոլադ» տարտ", "Тарт «Дубайский шоколад»", "Dubai chocolate tart"),
        1800,
        ["chocolate"],
      ],
      ["tart-pistachio", L("Պիստակով տարտ", "Фисташковый тарт", "Pistachio tart"), 1500, []],
      [
        "tart-chocolate-large",
        L("Շոկոլադե տարտ, մեծ", "Шоколадный тарт, большой", "Chocolate tart, large"),
        800,
        ["chocolate"],
      ],
      [
        "tart-danish-large",
        L("Դանիական տարտ, մեծ", "Тарт Даниш, большой", "Danish tart, large"),
        800,
        [],
      ],
      [
        "chocolate-verde",
        L("Շոկոլադ Վերդե", "Шоколад Верде", "Chocolate Verde"),
        1300,
        ["chocolate"],
      ],
      ["dessert-chocmanger", L("Շոկմանժե", "Шокманже", "Chocmanger"), 1200, ["chocolate"]],
      [
        "dessert-bounty",
        L("«Բաունտի» դեսերտ", "Десерт «Баунти»", "Bounty dessert"),
        1400,
        ["chocolate"],
      ],
      ["macaron", L("Մակարուն", "Макарон", "Macaron"), 450, ["kids"]],
      [
        "energy-ball-chocolate",
        L("Շոկոլադե էներջի-բոլ", "Энерджи-болл шоколадный", "Chocolate energy ball"),
        600,
        ["chocolate"],
      ],
      ["pie-chicken", L("Կարկանդակ հավով", "Пирожок с курицей", "Chicken pie"), 400, ["savoury"]],
      ["pie-cheese", L("Կարկանդակ պանրով", "Пирожок с сыром", "Cheese pie"), 350, ["savoury"]],
      [
        "pie-hot-dog",
        L("Հոթ-դոգ կարկանդակ", "Пирожок хот-дог", "Hot-dog pie"),
        300,
        ["savoury", "kids"],
      ],
    ] as const
  ).map(([slug, name, price, tags]): SeedProduct => ({
    slug,
    category: "bakes",
    name,
    priceAmd: price,
    image: `${P}/buyam/${slug}.jpg`,
    tags: [...tags],
    source: BUYAM,
  })),
  {
    slug: "blackberry-cake",
    category: "bakes",
    name: L("Մոշով տորթ, կտոր", "Торт с ежевикой, кусочек", "Blackberry layer cake, slice"),
    description: L(
      "Բիսկվիթ, սերուցքային կրեմ, թարմ մոշ",
      "Бисквит, сливочный крем, свежая ежевика",
      "Sponge, cream, fresh blackberries",
    ),
    priceAmd: 1500,
    image: `${P}/tomsarkgh/yumyum-16.jpg`,
    tags: ["fruity"],
    isFeatured: true,
    source: SAMPLE,
  },
  {
    slug: "chocolate-cake",
    category: "bakes",
    name: L("Շոկոլադե տորթ, կտոր", "Шоколадный торт, кусочек", "Chocolate cake, slice"),
    priceAmd: 1500,
    image: `${P}/tomsarkgh/yumyum-22.jpg`,
    tags: ["chocolate"],
    source: SAMPLE,
  },

  /* ── Gifts ── */
  {
    slug: "box-of-6",
    category: "gifts",
    name: L("6 հատանոց տուփ", "Коробка на 6 донатов", "Box of 6"),
    description: L(
      "Ընտրեք 6 դոնաթ, մենք կդասավորենք",
      "Выберите 6 донатов — мы красиво уложим",
      "Pick any six, we pack them",
    ),
    priceAmd: 200,
    image: `${P}/buyam/box.jpg`,
    tags: ["gifts"],
    boxSize: 6,
    source: BUYAM,
  },
  {
    slug: "box-of-12",
    category: "gifts",
    name: L("12 հատանոց տուփ", "Коробка на 12 донатов", "Box of 12"),
    description: L(
      "Գրասենյակի, ընկերների կամ մեծ ընտանիքի համար",
      "Для офиса, друзей или большой семьи",
      "For the office, the team or a big family",
    ),
    priceAmd: 400,
    image: `${P}/buyam/box.jpg`,
    tags: ["gifts"],
    boxSize: 12,
    source: SAMPLE,
  },
  {
    slug: "name-donut",
    category: "gifts",
    name: L("Անվանական դոնաթ", "Именной донат", "Name donut"),
    description: L(
      "Ցանկացած անուն կամ կարճ մաղթանք դոնաթի վրա",
      "Любое имя или слово, написанное глазурью",
      "Any name or word, written in glaze",
    ),
    priceAmd: 900,
    image: `${P}/tomsarkgh/yumyum-26.jpg`,
    tags: ["gifts", "glazed"],
    leadTimeDays: 1,
    isFeatured: true,
    source: SAMPLE,
    options: [
      {
        kind: "text",
        name: L("Գրությունը", "Надпись", "Your text"),
        priceDeltaAmd: 0,
        maxLength: 12,
      },
    ],
  },
  {
    slug: "birthday-stack",
    category: "gifts",
    name: L(
      "Դոնաթներից տորթ «Happy Birthday»",
      "Торт из донатов «Happy Birthday»",
      "Happy Birthday donut cake",
    ),
    description: L(
      "Ցողիկներով դոնաթներ՝ ոսկեգույն «Happy Birthday» զարդով",
      "Башня из донатов с топпером «Happy Birthday»",
      "A donut tower with a “Happy Birthday” topper",
    ),
    priceAmd: 9000,
    image: `${P}/tomsarkgh/yumyum-21.jpg`,
    tags: ["gifts", "kids"],
    leadTimeDays: 1,
    source: SAMPLE,
    options: [
      {
        kind: "text",
        name: L("Թիվը թոփերի վրա", "Цифра на топпере", "Number on the topper"),
        priceDeltaAmd: 0,
        maxLength: 3,
      },
    ],
  },
  ...(
    [
      ["bouquet-n1", "N1", 1700],
      ["bouquet-n4", "N4", 4800],
      ["bouquet-n2", "N2", 6000],
      ["bouquet-n6", "N6", 7200],
      ["bouquet-n3", "N3", 8400],
      ["composition-n2", "C2", 13000],
      ["composition-n1", "C1", 14000],
    ] as const
  ).map(([slug, code, price]): SeedProduct => {
    const isComposition = code.startsWith("C");
    const n = code.slice(1);
    return {
      slug,
      category: "gifts",
      name: isComposition
        ? L(`Դոնաթով կոմպոզիցիա N${n}`, `Композиция из донатов N${n}`, `Donut composition N${n}`)
        : L(`Դոնաթով փունջ N${n}`, `Букет из донатов N${n}`, `Donut bouquet N${n}`),
      description: L(
        "Վարդագույն թղթով, ձեր գրություններով",
        "В розовой бумаге, с вашими надписями",
        "Wrapped in pink, with your messages",
      ),
      priceAmd: price,
      image: `${P}/buyam/${slug}.jpg`,
      tags: ["gifts"],
      leadTimeDays: 1,
      isFeatured: slug === "bouquet-n2",
      source: BUYAM,
      options: [
        {
          kind: "text",
          name: L("Գրություն դոնաթների վրա", "Надписи на донатах", "Messages on the donuts"),
          priceDeltaAmd: 0,
          maxLength: 60,
        },
      ],
    };
  }),
];

/* ── Shops ── */
const daily = (open = "09:00", close = "22:00"): WeekHours =>
  Array.from({ length: 7 }, () => ({ open, close }));

const gmaps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Yum Yum Donuts, ${q}, Yerevan`)}`;
const ymaps = (id: string) => `https://yandex.com/maps/org/yum_yum_donuts/${id}/`;
const mallHours = L(
  "Առևտրի կենտրոնի ժամերով",
  "По часам работы торгового центра",
  "Follows the mall's hours",
);

export const seedShops = [
  {
    slug: "abovyan-25",
    name: L("Աբովյան 25", "Абовяна 25", "Abovyan 25"),
    address: L("Աբովյան փ. 25, Երևան", "ул. Абовяна, 25, Ереван", "25 Abovyan St, Yerevan"),
    district: "kentron",
    lat: 40.1849,
    lng: 44.5214,
    phone: "+37433301574",
    hours: daily(),
    image: `${P}/tomsarkgh/yumyum-13.jpg`,
    googleMapsUrl: gmaps("25 Abovyan St"),
    isConfirmed: true,
  },
  {
    slug: "abovyan-2-5",
    name: L("Աբովյան 2/5", "Абовяна 2/5", "Abovyan 2/5"),
    address: L("Աբովյան փ. 2/5, Երևան", "ул. Абовяна, 2/5, Ереван", "2/5 Abovyan St, Yerevan"),
    district: "kentron",
    lat: 40.1803,
    lng: 44.5163,
    phone: "+37433301574",
    hours: daily(),
    image: `${P}/yandex/storefront/storefront-02.jpg`,
    googleMapsUrl: gmaps("2/5 Abovyan St"),
    yandexMapsUrl: ymaps("124666695432"),
    isConfirmed: true,
  },
  {
    slug: "mashtots-35",
    name: L("Մաշտոց 35", "Маштоца 35", "Mashtots 35"),
    address: L("Մաշտոցի պող. 35, Երևան", "пр. Маштоца, 35, Ереван", "35 Mashtots Ave, Yerevan"),
    district: "kentron",
    lat: 40.185791,
    lng: 44.513184,
    phone: "+37494301574",
    // Wanderlog / Google: Sunday opens at 10:00.
    hours: [{ open: "10:00", close: "22:00" }, ...daily().slice(1)],
    image: `${P}/yandex/storefront/storefront-03.jpg`,
    googleMapsUrl: gmaps("35 Mashtots Ave"),
    yandexMapsUrl: ymaps("208544967391"),
    twoGisUrl: "https://2gis.am/yerevan/firm/70000001089219122",
    isConfirmed: true,
  },
  {
    slug: "mashtots-48",
    name: L("Մաշտոց 48", "Маштоца 48", "Mashtots 48"),
    address: L("Մաշտոցի պող. 48, Երևան", "пр. Маштоца, 48, Ереван", "48 Mashtots Ave, Yerevan"),
    district: "kentron",
    lat: 40.1874,
    lng: 44.5098,
    phone: "+37433301574",
    hours: daily(),
    image: `${P}/yandex/storefront/storefront-05.jpg`,
    googleMapsUrl: gmaps("48 Mashtots Ave"),
    isConfirmed: true,
  },
  {
    slug: "komitas-20",
    name: L("Կոմիտաս 20", "Комитаса 20", "Komitas 20"),
    address: L(
      "Կոմիտասի պող. 20/2, Երևան",
      "пр. Комитаса, 20/2, Ереван",
      "20/2 Komitas Ave, Yerevan",
    ),
    district: "arabkir",
    lat: 40.2055,
    lng: 44.5157,
    phone: "+37433301574",
    hours: daily(),
    image: `${P}/yandex/storefront/storefront-01.jpg`,
    googleMapsUrl: gmaps("20 Komitas Ave"),
    yandexMapsUrl: ymaps("68724638778"),
    isConfirmed: true,
  },
  {
    slug: "megamall",
    name: L("Մեգամոլ", "Мегамолл", "Megamall"),
    address: L(
      "Գայի պող. 16, Մեգամոլ, 2-րդ հարկ",
      "пр. Гая, 16, ТЦ Megamall, 2 этаж",
      "16 Gai Ave, Megamall, 2nd floor",
    ),
    district: "nor-nork",
    lat: 40.2093,
    lng: 44.5698,
    phone: "+37433301574",
    hours: null,
    hoursNote: mallHours,
    isMall: true,
    image: `${P}/yandex/interior/interior-06.jpg`,
    googleMapsUrl: gmaps("Megamall, 16 Gai Ave"),
    yandexMapsUrl: ymaps("224353467179"),
    isConfirmed: true,
  },
  {
    slug: "yerevan-mall",
    name: L("Երևան Մոլ", "Ереван Молл", "Yerevan Mall"),
    address: L(
      "Արշակունյաց պող. 34/3, Yerevan Mall, 2-րդ հարկ",
      "пр. Аршакуняц, 34/3, Yerevan Mall, 2 этаж",
      "34/3 Arshakunyats Ave, Yerevan Mall, 2nd floor",
    ),
    district: "shengavit",
    lat: 40.1583,
    lng: 44.4905,
    phone: "+37433301574",
    hours: null,
    hoursNote: mallHours,
    isMall: true,
    image: `${P}/yandex/interior/interior-05.jpg`,
    googleMapsUrl: gmaps("Yerevan Mall"),
    yandexMapsUrl: "https://yandex.com/maps/org/yum_yum/167468106235/",
    isConfirmed: true,
  },
  // Found in directories but not on the client's current list. Hidden until confirmed.
  {
    slug: "mashtots-5",
    name: L("Մաշտոց 5 (Պակ Շուկա)", "Маштоца 5 (Пак Шука)", "Mashtots 5 (Pak Shuka)"),
    address: L("Մաշտոցի պող. 5, 2-րդ հարկ", "пр. Маштоца, 5, 2 этаж", "5 Mashtots Ave, 2nd floor"),
    district: "kentron",
    lat: 40.1772,
    lng: 44.5076,
    hours: daily(),
    googleMapsUrl: gmaps("5 Mashtots Ave"),
    yandexMapsUrl: ymaps("3547950537"),
    isActive: false,
  },
  {
    slug: "moskovyan-10",
    name: L("Մոսկովյան 10", "Московяна 10", "Moskovyan 10"),
    address: L("Մոսկովյան փ. 10", "ул. Московяна, 10", "10 Moskovyan St"),
    district: "kentron",
    lat: 40.1866,
    lng: 44.5185,
    hours: daily(),
    googleMapsUrl: gmaps("10 Moskovyan St"),
    yandexMapsUrl: ymaps("225182203915"),
    isActive: false,
  },
] as const;

/* ── Delivery ──
 * Yerevan has 12 administrative districts. Fees are placeholders until the
 * client sets their own in the admin panel.
 */
export const seedZones = [
  {
    name: L("Կենտրոն", "Центр", "Centre"),
    districts: ["kentron"],
    feeAmd: 700,
    minOrderAmd: 3000,
    freeFromAmd: 15000,
    etaMinutes: 45,
    sortOrder: 1,
  },
  {
    name: L("Մոտակա թաղամասեր", "Ближние районы", "Inner districts"),
    districts: [
      "arabkir",
      "kanaker-zeytun",
      "nork-marash",
      "ajapnyak",
      "malatia-sebastia",
      "shengavit",
      "erebuni",
    ],
    feeAmd: 1000,
    minOrderAmd: 4000,
    freeFromAmd: 20000,
    etaMinutes: 60,
    sortOrder: 2,
  },
  {
    name: L("Հեռավոր թաղամասեր", "Дальние районы", "Outer districts"),
    districts: ["avan", "davtashen", "nor-nork", "nubarashen"],
    feeAmd: 1500,
    minOrderAmd: 5000,
    freeFromAmd: null,
    etaMinutes: 75,
    sortOrder: 3,
  },
];

/** The same products on buy.am (checked October 2026). Keep in step with migration 0001. */
export const buyamProductUrls: Record<string, string> = {
  "donut-caramel": "https://buy.am/products/yum-yum-donuts/caramel-donut/f-45993",
  "donut-chocolate-rainbow":
    "https://buy.am/products/yum-yum-donuts/chocolate-donut-rainbow-yumyum-donuts/f-45995",
  "donut-chocolate": "https://buy.am/products/yum-yum-donuts/chocolate-donut-yumyum-donuts/f-45997",
  "donut-white-chocolate":
    "https://buy.am/products/yum-yum-donuts/white-chocolate-donut-yumyum-donuts/f-45998",
  "long-john-bavarian-chocolate":
    "https://buy.am/products/yum-yum-donuts/long-john-with-bavarian-filling-and-chocolate-yumyum-donuts/f-46000",
  "long-john-chocolate-caramel":
    "https://buy.am/products/yum-yum-donuts/chocolate-filled-long-john-topped-with-caramel-yumyum-donuts/f-46002",
  "yum-donut-cherry":
    "https://buy.am/products/yum-yum-donuts/yum-donut-with-white-chocolate-cherry-yumyum-donuts/f-46007",
  "yum-donut-bavarian-caramel":
    "https://buy.am/products/yum-yum-donuts/bavarian-cream-filled-yum-donut-topped-with-caramel-yumyum-donuts/f-46008",
  "yum-donut-bavarian-chocolate":
    "https://buy.am/products/yum-yum-donuts/bavarian-cream-filled-yum-donut-topped-with-chocolate-glaze-yumyum-donuts/f-46010",
  "yum-donut-white-chocolate-strawberry":
    "https://buy.am/products/yum-yum-donuts/yum-donut-with-white-chocolate-and-strawberry-yumyum-donuts/f-46012",
  "yum-donut-chocolate-caramel":
    "https://buy.am/products/yum-yum-donuts/yum-donut-with-chocolate-and-caramel-yumyum-donuts/f-46021",
  "yum-donut-double-chocolate":
    "https://buy.am/products/yum-yum-donuts/yum-donut-chocolate-with-chocolate/sw90315",
  "donut-frowny": "https://buy.am/products/yum-yum-donuts/donut-frawnie/SW105921",
  "donut-caramel-latte": "https://buy.am/products/yum-yum-donuts/donut-caramel-latte/SW105923",
  "donut-peach-rainbow": "https://buy.am/products/yum-yum-donuts/donut-peach-rainbow/SW105926",
  "donut-blue-bali-rainbow":
    "https://buy.am/products/yum-yum-donuts/donut-blue-bali-rainbow/SW105927",
  "donut-strawberry-rainbow":
    "https://buy.am/products/yum-yum-donuts/donut-strawberry-rainbow/SW105928",
  "donut-bubble-rainbow": "https://buy.am/products/yum-yum-donuts/donut-bubble-rainbow/SW105930",
  "donut-nutella": "https://buy.am/products/yum-yum-donuts/donut-nutella/SW105931",
  "donut-lemon": "https://buy.am/products/yum-yum-donuts/lemon-lemon-glaze/SW102789",
  "donut-banana-nutella": "https://buy.am/products/yum-yum-donuts/banan-nutella/SW102790",
  "donut-kinder-bueno": "https://buy.am/products/yum-yum-donuts/kinder-bueno/SW102792",
  "donut-lotus": "https://buy.am/products/yum-yum-donuts/lotus/SW102806",
  "donut-pistachio-king": "https://buy.am/products/yum-yum-donuts/pistachio-king/SW102807",
  "donut-american-flag": "https://buy.am/products/yum-yum-donuts/american-flag/SW102808",
  "donut-oreo": "https://buy.am/products/yum-yum-donuts/oreo/SW102809",
  "croissant-almond":
    "https://buy.am/products/yum-yum-donuts/croissant-with-almond-yumyum-donuts/sw32628",
  "croissant-nutella":
    "https://buy.am/products/yum-yum-donuts/croissant-with-nutella-yumyum-donuts/sw25466",
  "croissant-bueno": "https://buy.am/products/yum-yum-donuts/bueno-croissant-140-g/SW102812",
  "croissant-pistachio":
    "https://buy.am/products/yum-yum-donuts/pistachio-croissant-140-g/SW102813",
  macaron: "https://buy.am/products/yum-yum-donuts/fransiakan-makarun-1-hat-yamyam-donats/f-47065",
  "cheesecake-cherry": "https://buy.am/products/yum-yum-donuts/cake-cherry-cheesecake/sw80716",
  "chocolate-verde": "https://buy.am/products/yum-yum-donuts/chocolate-verde/sw80720",
  "dessert-chocmanger": "https://buy.am/products/yum-yum-donuts/dessert-shokmanje/sw80722",
  "dessert-bounty": "https://buy.am/products/yum-yum-donuts/dessert-bounty/sw80723",
  "muffin-chocolate": "https://buy.am/products/yum-yum-donuts/maffin-s-shokoladom/sw80747",
  "muffin-pistachio": "https://buy.am/products/yum-yum-donuts/pistachio-muffin/SW102810",
  "muffin-apricot": "https://buy.am/products/yum-yum-donuts/apricot-muffin/SW102811",
  "energy-ball-chocolate": "https://buy.am/products/yum-yum-donuts/hocolate-energy-ball/SW102814",
  "tart-dubai-chocolate": "https://buy.am/products/yum-yum-donuts/dubai-chocolate-tart/SW102816",
  "tart-chocolate-large": "https://buy.am/products/yum-yum-donuts/big-chocolate-tart/SW102817",
  "tart-pistachio": "https://buy.am/products/yum-yum-donuts/pistachio-tart/SW102819",
  "tart-danish-large": "https://buy.am/products/yum-yum-donuts/big-danish-tart/SW102820",
  "pie-chicken": "https://buy.am/products/yum-yum-donuts/chicken-pie/SW102823",
  "pie-cheese": "https://buy.am/products/yum-yum-donuts/cheese-pie/SW102824",
  "pie-hot-dog": "https://buy.am/products/yum-yum-donuts/hot-dog-pie/SW102825",
  "bouquet-n1": "https://buy.am/products/yum-yum-donuts/donut-bouquet-n1-yumyum-donuts/sw21342",
  "bouquet-n2": "https://buy.am/products/yum-yum-donuts/donut-bouquet-n2-yumyum-donuts/sw21343",
  "bouquet-n3": "https://buy.am/products/yum-yum-donuts/donut-bouquet-n3-yumyum-donuts/sw21344",
  "composition-n1":
    "https://buy.am/products/yum-yum-donuts/donut-composition-n1-yumyum-donuts/sw21345",
  "composition-n2":
    "https://buy.am/products/yum-yum-donuts/donut-composition-n2-yumyum-donuts/sw21346",
  "bouquet-n4": "https://buy.am/products/yum-yum-donuts/donut-bouquet-n4-yumyum-donuts/sw80751",
  "bouquet-n6": "https://buy.am/products/yum-yum-donuts/donut-bouquet-n6-yumyum-donuts/sw80752",
  americano: "https://buy.am/products/yum-yum-donuts/americano-yumyum-donuts/sw23080",
  cappuccino: "https://buy.am/products/yum-yum-donuts/cappuccino-yumyum-donuts/sw23081",
  nescafe: "https://buy.am/products/yum-yum-donuts/nescafe-yumyum-donuts/sw23082",
  "hot-chocolate": "https://buy.am/products/yum-yum-donuts/hot-chocolate-yumyum-donuts/sw23086",
  tea: "https://buy.am/products/yum-yum-donuts/tea-yumyum-donuts/sw23087",
  "coca-cola": "https://buy.am/products/yum-yum-donuts/soft-drink-cocacola-025l/sw28650",
  "water-zulal": "https://buy.am/products/yum-yum-donuts/spring-water-zulal-05l/sw80750",
  "box-of-6": "https://buy.am/products/yum-yum-donuts/box-6-pcs-yumyum-donuts/sw50331",
};

/* ── Reviews: real, verbatim, attributed. Never invent one. ── */
export const seedReviews = [
  // Yandex Maps, Mashtots 35. Yandex does not show per-review stars, so no rating.
  {
    author: "Vartan",
    platform: "Yandex Maps",
    url: "https://yandex.com/maps/org/yum_yum_donuts/208544967391/reviews/",
    rating: null,
    quote: "Best donuts in town",
    quoteLocale: "en",
    reviewDate: "2024-10-25",
    isApproved: true,
    sortOrder: 1,
  },
  {
    author: "Gabo",
    platform: "Yandex Maps",
    url: "https://yandex.com/maps/org/yum_yum_donuts/208544967391/reviews/",
    rating: null,
    quote: "Very kind staff and delicious donuts!",
    quoteLocale: "en",
    reviewDate: "2025-05-15",
    isApproved: true,
    sortOrder: 2,
  },
  // Provided by the developer (Tripadvisor blocks scripts); the stars were not re-checked.
  {
    author: "Aram K.",
    platform: "Tripadvisor",
    url: "https://www.tripadvisor.com/Restaurant_Review-g293932-d13274463-Reviews-Yum_Yum_Donuts-Yerevan.html",
    rating: 5,
    quote: "Best donuts in the city!",
    quoteLocale: "en",
    isApproved: true,
    sortOrder: 3,
  },
];

export const seedSettings: Record<string, unknown> = {
  contact: {
    phones: ["+37433301574", "+37494301574"],
    // TODO(client-confirm): WhatsApp number is a placeholder.
    whatsapp: "37494301574",
    whatsappConfirmed: false,
    instagram: "yumyum_donut",
    facebook: "YumYumYerevan",
    tiktok: null,
    email: null,
  },
  banner: {
    enabled: false,
    text: L(
      "Այսօր ցուցափեղկում՝ պիստակով դոնաթներ",
      "Сегодня на витрине — фисташковые донаты",
      "In the window today: pistachio donuts",
    ),
  },
  ordering: {
    pickupEnabled: true,
    deliveryEnabled: true,
    deliveryHours: { open: "11:00", close: "21:00" },
    pickupSlotMinutes: 30,
    deliverySlotMinutes: 60,
    minLeadMinutes: 45,
    maxDaysAhead: 7,
  },
  externalDelivery: [
    { name: "buy.am", url: "https://buy.am/restaurants/yum-yum-donuts", enabled: true },
    // TODO(client-confirm): no Glovo or Yandex Eats listing was found in October 2026.
    { name: "Glovo", url: "", enabled: false },
    { name: "Yandex Eats", url: "", enabled: false },
  ],
  ratings: {
    google: { rating: 4.0, count: 52, label: "Mashtots 35" },
    yandex: { rating: 4.9, count: 78, label: "Mashtots 35" },
    buyam: { rating: 4.7 },
  },
  // TODO(client-confirm): legal entity name, tax ID (ՀՎՀՀ) and registered address.
  legal: { companyName: null, taxId: null, address: null },
  // Turn off in Admin → Settings once the client has confirmed delivery terms and prices.
  demoNotes: { enabled: true },
  foundedYear: 1997,
};
