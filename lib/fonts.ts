import { Bagel_Fat_One, Pangolin } from "next/font/google";

// Display: Bagel Fat One (Latin, as in the approved design). Cyrillic and
// Armenian glyphs fall through to Sofia Sans and WM Hayk Sans at heavy weight,
// so one CSS stack works in all three languages. Body text is Sofia Sans.
// Those are self-hosted in public/fonts (see globals.css) and preloaded per language.
export const bagel = Bagel_Fat_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bagel",
  display: "swap",
  // The generated Arial fallback has Cyrillic glyphs and would stop the stack
  // before "YY Sofia"; without it, Cyrillic falls through to Sofia Sans as intended.
  adjustFontFallback: false,
});

// Handwritten accents ("what's in the window today"). Single weight, small files.
export const hand = Pangolin({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  variable: "--font-hand-face",
  display: "swap",
  preload: false,
});

export const fontVariables = [bagel, hand].map((f) => f.variable).join(" ");
