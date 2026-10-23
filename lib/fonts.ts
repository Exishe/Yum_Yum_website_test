import { Bagel_Fat_One, Caveat, Noto_Sans_Armenian, Onest, Rubik } from "next/font/google";

// Display: Bagel Fat One (Latin, as in the approved design). Cyrillic and
// Armenian glyphs fall through to Rubik and Noto Sans Armenian at heavy weight,
// so one CSS stack works in all three languages. See docs/DECISIONS.md.
export const bagel = Bagel_Fat_One({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-bagel",
  display: "swap",
});

export const rubik = Rubik({
  weight: ["700", "800"],
  subsets: ["cyrillic"],
  variable: "--font-rubik",
  display: "swap",
  preload: false,
});

export const armenian = Noto_Sans_Armenian({
  weight: ["400", "500", "600", "800"],
  subsets: ["armenian"],
  variable: "--font-armenian",
  display: "swap",
  preload: false,
});

export const onest = Onest({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
});

export const caveat = Caveat({
  weight: ["600", "700"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});

export const fontVariables = [bagel, rubik, armenian, onest, caveat].map((f) => f.variable).join(" ");
