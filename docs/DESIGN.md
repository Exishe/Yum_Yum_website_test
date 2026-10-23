# Design tokens

Defined once in `app/globals.css` (`@theme`). Approved canvas: "YUM YUM Website — Desktop & Phone".

## Colours

| Token | Hex | Use |
| --- | --- | --- |
| magenta | `#DE1281` | Logo magenta; big headlines, buttons with white text |
| magenta-ink | `#B30C68` | Magenta for small text on light backgrounds |
| pink-glow | `#FF6FB5` | Magenta-family text on plum |
| magenta-soft | `#FFD3E7` | Tiles, placeholders |
| yellow | `#FFEC01` | Logo yellow (logo only) |
| sun | `#FFE14D` | Gifts section, order button, "+" buttons |
| sun-soft | `#FFF4B8` | Notes, tiles |
| plum | `#2B0A24` | Text, footer, dark buttons |
| cream | `#FFF8F2` | Page background |
| black | `#000000` | Header bar |

## Contrast (WCAG 2.1)

| Pair | Ratio | Result |
| --- | --- | --- |
| White on magenta `#DE1281` | 4.66 : 1 | AA |
| Magenta `#DE1281` on cream | 4.43 : 1 | AA large text only — used only for headlines ≥ 24 px |
| magenta-ink `#B30C68` on cream | 6.30 : 1 | AA |
| magenta-ink on sun | 5.09 : 1 | AA |
| Plum on sun `#FFE14D` | 13.77 : 1 | AAA |
| Plum on cream | 17+ : 1 | AAA |
| White on plum | 17.92 : 1 | AAA |
| Sun on plum | 13.77 : 1 | AAA |
| muted `#6A4A62` on cream | 7.21 : 1 | AAA |

Lighthouse accessibility: 100 on all public pages tested.

## Type

See DECISIONS.md G2. Headings: Bagel Fat One → Rubik 800 → Noto Sans Armenian 800.
Body: Onest → Noto Sans Armenian. Accents: Pangolin.

## Radius, shadow, motion

- Cards 20 px, large panels 28 px, pills fully round.
- Shadows: `card` (resting), `lift` (hover, floating cards).
- Motion: only `transform` and `opacity`, except the hero blobs (border-radius morph, started after idle). `prefers-reduced-motion` stops all of it.
- Tap targets ≥ 44 px.
