# Decisions

Choices made while building, with the reason. Newest at the bottom of each section.

## Stack

| # | Decision | Why |
| --- | --- | --- |
| D1 | **Next.js 16 App Router, TypeScript strict, Tailwind 4, next-intl 4** as recommended. | Brief's default; all current stable versions. |
| D2 | **Drizzle ORM + `postgres` driver** (not Prisma). | No binary engine, tiny cold starts on Vercel, SQL-like and type-safe, works with Supabase's pooler (`prepare: false` on port 6543). |
| D3 | **Staff sign-in is our own** (bcrypt passwords, sessions stored in Postgres, httpOnly `__Host-` cookie, 12 h expiry, lockout after 5 failures for 15 min, IP rate limit) instead of Supabase Auth. | Works the same on a local Docker Postgres and on Supabase, so the whole app (including admin) can be developed and tested offline on Windows without the Supabase CLI. Roles are checked in every server action. Supabase Auth can be added later without changing the data model. Trade-off: no email-link sign-in; admins create staff with a one-time temporary password that must be changed on first sign-in. |
| D4 | **Row Level Security on every table, deny by default.** The app connects as the database owner from the server only; the public Supabase API (anon key) can read only published catalogue rows. | Meets "RLS on every table" and protects the database even if the anon key leaks. See SECURITY.md. |
| D5 | **Rate limiting in Postgres** (one atomic upsert per check) instead of Upstash. | One less service and account; volume is small. |
| D6 | **No animation library.** Motion/Framer was planned but every effect fits in CSS (transform/opacity keyframes) and a few lines of the Web Animations API. | Saves ~35 KB of JavaScript on every page. |
| D7 | **Nonce-based CSP** set in `proxy.ts` (Next 16's name for middleware). `style-src` allows `'unsafe-inline'` because inline style attributes are used for small layout variables. | Script injection is blocked; style injection cannot run code. |
| D8 | **Photo uploads** are re-encoded to WebP with sharp and stored in Supabase Storage; locally in `public/uploads`. | Strips EXIF/GPS and anything that is not an image. |

## Content and data

| # | Decision | Why |
| --- | --- | --- |
| C1 | Seed prices come from **buy.am (Oct 2026)** and the **drink menu boards** photographed in the shops, and are flagged `priceIsSample` until the client confirms. Items with no public price (birthday stack, name donut, box of 12, cake slices) carry placeholder prices, also flagged. | The brief said prices are not public; we found real ones, but only the client can confirm in-shop prices. The admin highlights unconfirmed prices and has an "All prices are correct" button. |
| C2 | **Seven shops shown** (Abovyan 25, Abovyan 2/5, Mashtots 35, Mashtots 48, Komitas 20, Megamall, Yerevan Mall) — the client's list. Mashtots 5 (Pak Shuka) and Moskovyan 10 from directories are seeded **hidden**. Tamanyan 6 is marked closed on Yandex and is not seeded. | Only show what the client confirmed; the rest is one tick away in the admin. |
| C3 | Mashtots 35 opens **10:00 on Sundays** (Google data via Wanderlog). Other shops 9:00–22:00 daily; mall shops "follow the mall's hours". | Source-backed. |
| C4 | **Shop photos** for shops other than Abovyan 25 are visitor photos from Yandex Maps; which photo belongs to which branch is a best guess. | TODO(client-confirm), listed in CLIENT-TODO. |
| C5 | **Reviews**: only the one verified quote ("Best donuts in the city!", Aram K., Tripadvisor). The section also shows real rating figures (Google 4.0 / 52, Yandex 4.9 / 78 for Mashtots 35, buy.am 4.7). Carousel arrows appear automatically when the client adds more real reviews. | Never invent a review. |
| C6 | **Delivery apps**: no Glovo or Yandex Eats listing was found in Oct 2026. The real delivery partner is **buy.am**, shown as "Order on buy.am". Glovo/Yandex Eats are seeded switched off with empty links. | Every button must work; no dead links. |
| C7 | **Delivery fees and zones** are placeholders (Centre 700 ֏, inner districts 1 000 ֏, outer 1 500 ֏; minimums 3–5 000 ֏). Delivery hours 11:00–21:00 follow buy.am's delivery window. | Client sets real values in the admin. |
| C8 | **Online payment** is not built (placeholder text). Cash or card on delivery/pickup. | Brief. |
| C9 | **Founding year 1997** (Instagram "since 1997" and the 2013 ԵՐԵՎԱՆ magazine article). Spyur says 1998. | Two sources agree on 1997. |
| C10 | Hero chip "today's pick" products: Chocolate rainbow / Iced latte / Bouquet N2 / Blackberry cake slice. | Each has a real matching photo. |

## Design

| # | Decision | Why |
| --- | --- | --- |
| G1 | **Brand colours from the 1080 px logo**: magenta `#DE1281`, yellow `#FFEC01`. A warmer `#FFE14D` is used for large yellow areas (as in the approved design), `#B30C68` for small magenta text (contrast), plum `#2B0A24`, cream `#FFF8F2`. | Re-sampled from the real logo. Contrast table in DESIGN.md. |
| G2 | **Type system**: one CSS stack for all languages — Bagel Fat One (Latin, as in the design) → Rubik 800 (Cyrillic) → Noto Sans Armenian 800 (Armenian). `font-synthesis: none` stops fake bold on Bagel. Body: Onest (Latin + Cyrillic) → Noto Sans Armenian. Handwritten accents: Pangolin. | Bagel has no Armenian or Cyrillic glyphs. Browsers fall through per glyph, so each script gets a heavy rounded face and mixed lines (e.g. "YUM-YUM" in Armenian text) still look right. Caveat was replaced by Pangolin: Caveat was 75 KB per script. |
| G3 | **Icons**: hand-drawn two-tone SVG brand icons (donut, pin, bag, card, flower, heart-with-donut-hole, phone, cup, gift) + Phosphor for utility icons. No emoji. | Brief §2. |
| G4 | Products without a real photo show a **typographic "photo coming soon" card**. | Never a fake picture. |
| G5 | The **phone bottom order bar** appears only once something is in the basket (the design showed it with "0"). | An empty bar takes 70 px of a small screen for nothing. |
| G6 | Decorative motion (morphing blobs, drifting sprinkles, rotating ring) **starts after the page is idle**, and all motion stops with `prefers-reduced-motion`. | The blob shape change repaints; delaying it keeps first paint fast on mid-range Android. |
| G7 | Language switch order **ՀԱՅ · РУС · EN** (Armenian first, the default). | Default locale first. |

## Language

| # | Decision | Why |
| --- | --- | --- |
| L1 | Default locale **hy**; `Accept-Language` detection and a `NEXT_LOCALE` cookie (1 year) via next-intl. Translated slugs for main pages (`/ru/podarki`, `/hy/nverner`…). | Brief §4–5. |
| L2 | Admin panel is **English only** for now. | Fewer strings to maintain; can be translated with next-intl later if staff prefer Russian or Armenian. |
| L3 | "DONUT GIVE UP" stays in English on the cup ring, footer and tagline; Russian and Armenian get their own headline. See COPY.md. | The pun only works in English. |
| L4 | Strings needing a native check are listed in REVIEW-NATIVE.md (JSON cannot hold `// REVIEW(native)` comments). | Brief §5. |

## Extras (brief §12)

| Idea | Status |
| --- | --- |
| "Today in the window" banner | **Built.** Admin → Settings. |
| Name-donut text preview | **Built** (Gifts page). |
| Live "open now / closes at" per shop in Yerevan time | **Built.** |
| PWA manifest (add to home screen) | **Built** (manifest + icons; no offline mode). |
| Privacy-friendly analytics | **Built as an option**: Plausible or Umami script loads only after consent and only if configured. |
| Digital stamp card "every 10th coffee free" | **Proposed, not built.** Idea: phone number + 6-digit SMS-free code shown at the till; staff tap "+1 stamp" in the admin on a tablet; 10 stamps = free coffee. Needs the client's approval and a decision on fraud rules. |
