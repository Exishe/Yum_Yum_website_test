import { Bagel_Fat_One, Noto_Sans_Armenian, Onest, Pangolin, Rubik } from "next/font/google";

// Display: Bagel Fat One (Latin, as in the approved design). Cyrillic and
// Armenian glyphs fall through to Rubik and Noto Sans Armenian at heavy weight,
// so one CSS stack works in all three languages. See docs/DECISIONS.md.
export const bagel = Bagel_Fat_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bagel",
  display: "swap",
});

export const rubik = Rubik({
  weight: ["700", "800"],
  subsets: ["cyrillic"],
  variable: "--font-rubik",
  display: "swap",
});

export const armenian = Noto_Sans_Armenian({
  weight: ["400", "500", "600", "800"],
  subsets: ["armenian"],
  variable: "--font-armenian",
  display: "swap",
});

// Body text. Latin is preloaded; Cyrillic loads on demand for Russian pages.
export const onest = Onest({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-onest",
  display: "swap",
});

export const onestCyrillic = Onest({
  weight: ["400", "500", "600", "700"],
  subsets: ["cyrillic"],
  variable: "--font-onest-cyr",
  display: "swap",
  preload: false,
});

// Handwritten accents ("what's in the window today"). Single weight, small files.
export const hand = Pangolin({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  variable: "--font-hand-face",
  display: "swap",
  preload: false,
});

export const fontVariables = [bagel, rubik, armenian, onest, onestCyrillic, hand]
  .map((f) => f.variable)
  .join(" ");
