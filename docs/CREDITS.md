# Credits: photos, icons, fonts, code

**No AI-generated images, illustrations or icons are used anywhere.**
All photos show real YUM-YUM products, shops or customers.

> ⚠️ **Photo rights must be confirmed by the client before launch.** The photos below were
> collected from public pages. They belong to YUM-YUM Donuts or to the people who took them.
> Before the site goes public, the client must confirm that YUM-YUM owns or may use each one,
> or supply their own. See CLIENT-TODO.md.

## Photos

| Folder                                                         | What                                                                                                                                                                                                                                                                                                                                                                                    | Source                                                                                                                                                                                                                                     | Rights holder                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `public/images/source/tomsarkgh/yumyum-13…26.jpg`              | Interior with donut wall (13), counter (14), muffins & espresso (15), blackberry cake (16), girl at donut wall (17), iced coffee in DONUT GIVE UP cup (18), donut close-up (19), woman with milkshake (20), birthday stack (21), coffee & chocolate cake (22), girl with donuts under neon (23), milkshake in hand (24), woman in pink sweater at mall counter (25), donut bouquet (26) | Tomsarkgh gallery, https://www.tomsarkgh.am/en/restro/show/2933/YumYum-Donuts (originals at `/thumbnails/Photo/original/{13…26}/90/10/…`), downloaded 22 Oct 2026. These are the same 15 photos the developer saved as `yumyum-12…26.jpg`. | YUM-YUM Donuts (published on their listing) — confirm            |
| `public/images/source/logo/yum-yum-logo-1080.jpg`              | Logo, 1080 px                                                                                                                                                                                                                                                                                                                                                                           | Tomsarkgh listing (photo 12)                                                                                                                                                                                                               | YUM-YUM Donuts                                                   |
| `public/images/source/logo/yum-yum-logo.svg`, `…-original.png` | Earlier vector redraw and 100 px original                                                                                                                                                                                                                                                                                                                                               | Repository research commit                                                                                                                                                                                                                 | YUM-YUM Donuts                                                   |
| `public/images/brand/*`                                        | Round logo, app icons, Open Graph image (photo 19 + logo)                                                                                                                                                                                                                                                                                                                               | Made from the files above with `scripts/make-brand-assets.mjs`                                                                                                                                                                             | YUM-YUM Donuts                                                   |
| `public/images/source/buyam/*.jpg/webp`                        | 65 product photos (≈400 px) used as catalogue thumbnails                                                                                                                                                                                                                                                                                                                                | buy.am restaurant page, https://buy.am/restaurants/yum-yum-donuts, downloaded 21 Oct 2026                                                                                                                                                  | YUM-YUM Donuts / buy.am — confirm                                |
| `public/images/source/yandex/**`                               | 43 visitor photos of storefronts, interiors, counters and menu boards (used for shop cards, the photo strip, and as the source of drink prices)                                                                                                                                                                                                                                         | Yandex Maps galleries of 6 branches, downloaded 21 Oct 2026                                                                                                                                                                                | The visitors who took them — **needs permission or replacement** |

Originals are kept untouched in `public/images/source/`; the site serves resized AVIF/WebP
versions through `next/image`.

## Icons

- **Brand icons** (donut, morning donut, pin, bag, card, flower, heart-with-donut-hole, phone,
  cup, gift): drawn by hand as SVG for this project — `components/icons/brand.tsx`.
- **Utility icons**: [Phosphor Icons](https://phosphoricons.com) — MIT.
- **Payment methods**: shown as text badges (VISA, Mastercard, ArCa). Official logos should
  be dropped in from the Visa, Mastercard and ArCa brand centres under their usage rules.

## Fonts

Bagel Fat One, Rubik, Noto Sans Armenian, Onest, Pangolin — all SIL Open Font License 1.1,
self-hosted: Bagel, Onest (Latin) and Pangolin through `next/font`; Rubik (Cyrillic), Noto Sans Armenian and Onest (Cyrillic) as files in `public/fonts/`, downloaded from Google Fonts.

## Text and facts

- History: «Դոնաթանոց», ԵՐԵՎԱՆ magazine no. 18 (2013), Lena Gevorgyan — https://evnmag.com/articles/donatanoc.html.
  Retold in our own words; no text copied.
- Ratings and hours: Wanderlog (Google data), Yandex Maps, buy.am, Tripadvisor.
- Review quotes, verbatim: "Best donuts in town" (Vartan, 25.10.2024) and "Very kind staff and delicious donuts!" (Gabo, 15.05.2025), Yandex Maps, Mashtots 35; "Best donuts in the city!" (Aram K., Tripadvisor, provided by the developer).

## Code

All third-party packages and their licences: [TECH-STACK.md](TECH-STACK.md).
No code was copied from other companies' websites.
