# Handover and launch checklist

What has to happen to move the demo to YUM-YUM's own accounts and switch it on
for customers. Setup steps are in the README (§7); what we still need from the
client is in `CLIENT-TODO.md`; staff guides are in `docs/guide/` (the admin guide is also published as a page: https://claude.ai/artifact/M8pPeRP2dVsMfKvzPSjPyP).

## 1. Accounts the client must own

The client signs up; the developer is invited as a collaborator. Nothing should
stay only on the developer's personal accounts.

| What                         | Where                      | Notes                                                        |
| ---------------------------- | -------------------------- | ------------------------------------------------------------ |
| Code                         | GitHub repository          | Transfer the repo, or fork it into the client's organisation |
| Hosting                      | Vercel project             | Commercial use needs Vercel Pro ($20/month)                  |
| Database                     | Neon (inside Vercel)       | Created from the Vercel project; enable daily backups        |
| Photos uploaded in the admin | Vercel Blob                | Created from the Vercel project                              |
| Anti-spam                    | Cloudflare Turnstile       | Site key and secret into Vercel env                          |
| Order notifications          | Telegram bot (@BotFather)  | Bot owned by the shop; added to the staff group              |
| Email (optional)             | Resend + the domain        | For the newsletter and email copies of orders                |
| Domain                       | Registrar (e.g. yumyum.am) | Point to Vercel (README §7.5)                                |

## 2. Environment variables (Vercel → Settings → Environment Variables)

See `.env.example` for the full list. New in this version:

- `TELEGRAM_ALERT_CHAT_ID`: chat that receives **site error alerts**. Set it to
  the developer's own Telegram chat. Without it, alerts go to the order chat.

## 3. Switch on in the Vercel dashboard

- **Analytics → Web Analytics: Enable** (visits, pages, countries; cookieless).
- **Speed Insights: Enable** (real-user Core Web Vitals).
  The site already loads both scripts; they only count once enabled.

## 4. Before opening to customers

- [ ] All items in `CLIENT-TODO.md` → _Must have_ are confirmed.
- [ ] Admin → Settings → _Demo notes_: off.
- [ ] Remove the site password: delete `SITE_PASSWORD` in Vercel and redeploy.
- [ ] Demo mode off (`lib/demo-config.ts`, `enabled: false`): the Wiymood
      badge disappears and search engines may index the site. (If the client
      agrees to a "made by Wiymood" credit, add it to the footer.)
- [ ] Create staff accounts; give each person `docs/guide/STAFF-ONE-PAGE-hy.md`.
- [ ] Place one real order per shop and per delivery zone; check the Telegram
      message and the status page.
- [ ] Delete test orders and test staff accounts created during the demo.

## 5. After launch

- **Google Search Console:** add the domain, submit `/sitemap.xml`.
- **Google Business Profile:** one per shop, with the website link.
- **Uptime monitor (free):** UptimeRobot or Better Stack, checking the home
  page every 5 minutes, alerting the developer.
- **Backups:** confirm Neon point-in-time restore is on; restore once to a
  branch to make sure it works.

## 6. Quality checks already in place

- `pnpm test` (unit) and `npx playwright test` (end-to-end, phone + desktop):
  ordering, admin, 3D builder (all combinations and GPU loss), gift box
  drag-and-drop, the mascot, and an **axe accessibility check** of 6 pages.
- Lighthouse (local, Nov 2026), home page: phone 85, desktop 99; accessibility
  97–100; best practices 100. SEO shows 69 only because the demo is set to
  "noindex"; it becomes 100 when demo mode is turned off.
- Error alerts: browser and server errors reach Telegram, de-duplicated.
