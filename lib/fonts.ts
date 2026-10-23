import { Bagel_Fat_One, Onest, Pangolin } from "next/font/google";

// Display: Bagel Fat One (Latin, as in the approved design). Cyrillic and
// Armenian glyphs fall through to Rubik and Noto Sans Armenian at heavy weight,
// so one CSS stack works in all three languages. Those two, and Onest's
// Cyrillic, are self-hosted in public/fonts and preloaded per language.
export const bagel = Bagel_Fat_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bagel",
  display: "swap",
  // The generated Arial fallback has Cyrillic glyphs and would stop the stack
  // before "YY Rubik"; without it, Cyrillic falls through to Rubik as intended.
  adjustFontFallback: false,
});

// Body text, Latin. Cyrillic: public/fonts (see globals.css).
export const onest = Onest({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-onest",
  display: "swap",
  adjustFontFallback: false, // same reason: let Cyrillic reach "YY Onest"
});

// Handwritten accents ("what's in the window today"). Single weight, small files.
export const hand = Pangolin({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  variable: "--font-hand-face",
  display: "swap",
  preload: false,
});

export const fontVariables = [bagel, onest, hand].map((f) => f.variable).join(" ");
