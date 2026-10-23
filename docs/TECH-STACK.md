# Tech stack

Everything below is open source or has a free tier that covers a shop of this size.

## Runtime libraries

| Package | Version | What for | Why this one | Licence |
| --- | --- | --- | --- | --- |
| next | 16.4.2 | Framework: pages, server rendering, server actions, image optimisation | Brief; best Vercel fit | MIT |
| react, react-dom | 19.3.1 | UI | — | MIT |
| next-intl | 4.14.9 | Three languages, translated URLs, plurals, locale detection | Built for the App Router; ICU plurals for Russian | MIT |
| drizzle-orm | 0.45.4 | Type-safe SQL and migrations | Small, no binary engine, fast cold starts | Apache-2.0 |
| postgres | 3.4.9 | Postgres driver | Fast, works with Supabase pooler | Unlicense |
| zod | 4.6.7 | Validation shared by browser and server | — | MIT |
| react-hook-form, @hookform/resolvers | 7.90 / 6.0 | Checkout form | Few re-renders on phones | MIT |
| radix-ui | 1.8.1 | Accessible dialogs (basket, quick view, cookie settings) | Unstyled, keyboard and screen-reader correct | MIT |
| @phosphor-icons/react | 2.1.10 | Utility icons (arrows, close, plus) | Consistent, human-designed set | MIT |
| sharp | 0.35.5 | Re-encoding uploaded photos; image tooling | — | Apache-2.0 |
| bcryptjs | 3.0.3 | Staff password hashing | Pure JS, no Windows build tools needed | BSD-3-Clause |
| clsx, server-only | — | Class names; guard against importing server code in the browser | — | MIT |

## Development tools

| Package | Version | Licence |
| --- | --- | --- |
| typescript | 5.9.3 | Apache-2.0 |
| tailwindcss, @tailwindcss/postcss | 4.3.3 | MIT |
| eslint, eslint-config-next | 9.39 / 16.4.2 | MIT |
| prettier, prettier-plugin-tailwindcss | 3.9 / 0.8 | MIT |
| husky, lint-staged | 9.1 / 17.6 | MIT |
| vitest | 5.0.5 | MIT |
| @playwright/test | 1.56.1 | Apache-2.0 |
| drizzle-kit | 0.31.11 | MIT |
| tsx, dotenv | 4.23 / 18.0 | MIT / BSD-2-Clause |

## Fonts (self-hosted through `next/font`, no requests to Google from visitors)

| Font | Use | Licence |
| --- | --- | --- |
| Bagel Fat One | Display, Latin | SIL OFL 1.1 |
| Rubik (700, 800) | Display, Cyrillic | SIL OFL 1.1 |
| Noto Sans Armenian | Display and body, Armenian | SIL OFL 1.1 |
| Onest | Body, Latin and Cyrillic | SIL OFL 1.1 |
| Pangolin | Handwritten accents | SIL OFL 1.1 |

## Services

| Service | Use | Cost | Needed? |
| --- | --- | --- | --- |
| Vercel (Hobby) | Hosting, image optimisation, cron | Free. Note: Hobby is for non-commercial use; for a business Vercel's terms ask for Pro ($20/month). Alternative: Netlify or Cloudflare free tiers, or a €5/month VPS. **Decide before launch.** | Yes |
| Supabase (Free) | PostgreSQL, photo storage | Free: 500 MB DB, 1 GB storage. Free projects pause after 7 days without traffic (a live site never idles). | Yes |
| Cloudflare Turnstile | Anti-spam on forms | Free | Yes in production |
| Telegram Bot API | Order alerts to the shop's group | Free | One of Telegram / email |
| Resend | Order alerts by email, newsletter confirmations | Free: 3 000 emails/month | Optional |
| Plausible / Umami | Privacy-friendly visit counts | Plausible paid; Umami self-hosted free | Optional |
| GitHub Actions | CI | Free for public repos; 2 000 min/month private | Yes |
