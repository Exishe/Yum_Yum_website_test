# Security

## Summary

| Area             | What is in place                                                                                                                                                                                                                                                                                                                                              | Where                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Database access  | RLS enabled on every table; no policies for the public except read-only on published catalogue rows. The app uses the owner role from the server only.                                                                                                                                                                                                        | `db/policies.sql`, applied by `pnpm db:migrate` |
| Secrets          | Only in environment variables. `.env*` is git-ignored; `.env.example` documents every key. Service-role and API keys are read only in server modules (`import "server-only"`).                                                                                                                                                                                | `lib/env.ts`                                    |
| Input validation | Zod schemas shared by browser and server; the server re-validates everything. Text is trimmed, control and bidi characters removed, lengths limited. Phones must be valid Armenian numbers; dates and time slots are recomputed on the server from opening hours.                                                                                             | `lib/validation.ts`, `lib/ordering.ts`          |
| Prices           | The server recalculates every line from the database. Prices from the browser are ignored.                                                                                                                                                                                                                                                                    | `lib/pricing.ts`, `lib/orders.ts`               |
| Abuse            | Cloudflare Turnstile on order and contact forms; honeypot field on all public forms; rate limits: orders 8/hour per IP and 5/hour per phone, contact 5/hour, newsletter 5/hour, sign-in 20 attempts/15 min per IP.                                                                                                                                            | `lib/security.ts`, `lib/actions.ts`             |
| Order privacy    | Customers see orders only by a random 16-character public ID (96 bits); the database UUID is never exposed. Order pages are `noindex`.                                                                                                                                                                                                                        | `lib/order-view.ts`                             |
| HTTP headers     | Per-request nonce CSP (`script-src 'self' 'nonce-…' 'strict-dynamic'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`), HSTS (2 years, preload), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, `COOP`. Admin pages add `X-Robots-Tag: noindex` and `Cache-Control: no-store`. | `proxy.ts`, `next.config.ts`                    |
| Staff sign-in    | bcrypt (cost 12); timing-safe dummy compare for unknown emails; lockout after 5 wrong passwords (15 min); session token is 256 random bits, only its SHA-256 is stored; cookie `__Host-yy_admin`, httpOnly, Secure, SameSite=Strict, 12 h; "sign out everywhere" when a user is switched off or their password is reset; temporary passwords must be changed. | `lib/auth.ts`                                   |
| Roles            | `admin` (everything) and `staff` (orders, products and prices, messages). Checked in every page **and** every server action, never only in the UI.                                                                                                                                                                                                            | `requireUser()`                                 |
| Audit            | Every admin change is logged with user, time and a before/after diff.                                                                                                                                                                                                                                                                                         | `lib/audit.ts`, Admin → Audit log               |
| Uploads          | Admin only; JPEG/PNG/WebP/AVIF; ≤ 5 MB; ≤ 50 MP; re-encoded to WebP (strips metadata and any non-image payload); random file names.                                                                                                                                                                                                                           | `lib/storage.ts`                                |
| CSV export       | Cells starting with `= + - @` are prefixed to stop spreadsheet formula injection.                                                                                                                                                                                                                                                                             | `app/admin/export/route.ts`                     |
| Server actions   | Files marked `"use server"` export only actions meant to be called; internal jobs (privacy clean-up) live in server-only modules and run via an authenticated cron route.                                                                                                                                                                                     | `lib/retention.ts`, `app/api/cron/retention`    |
| Dependencies     | `pnpm audit` in CI (fails on high), Dependabot weekly, lockfile committed, only allow-listed packages may run install scripts.                                                                                                                                                                                                                                | `.github/`                                      |
| Privacy          | No tracking cookies. Consent banner; optional analytics load only after "Allow". IPs stored only as salted HMAC.                                                                                                                                                                                                                                              | `components/layout/CookieConsent.tsx`           |

## Data retention

- Every night (Vercel Cron, `vercel.json`) `/api/cron/retention` removes the name, phone,
  address, comments and IP hash from orders older than `DATA_RETENTION_DAYS` (default 90).
  The order lines and totals stay for accounting.
- Contact messages older than the same period are deleted.
- Newsletter emails stay until the person unsubscribes.
- Admins can also run the clean-up from the dashboard.

## Backups and restore

**Supabase** (free tier) takes daily backups but keeps them only briefly and restore needs
a paid plan, so also take your own:

```powershell
# Windows / macOS — needs the PostgreSQL client tools (pg_dump/pg_restore 16)
pg_dump "$env:DATABASE_URL" --format=custom --no-owner --file yumyum-$(Get-Date -Format yyyy-MM-dd).dump
```

macOS: `pg_dump "$DATABASE_URL" -Fc --no-owner -f yumyum-$(date +%F).dump`

Use the _direct_ connection string (port 5432) for `pg_dump`, not the pooler. Keep weekly
dumps somewhere private (e.g. an encrypted cloud folder). Dumps contain customer data.

Restore into an empty database:

```powershell
pg_restore --no-owner --dbname "$env:DATABASE_URL" yumyum-2026-10-23.dump
pnpm db:migrate     # re-applies row level security policies
```

Photos in Supabase Storage can be downloaded from the dashboard (Storage → bucket → select → Download).

## Before launch checklist

- [ ] `APP_SECRET`, `CRON_SECRET` set to long random values in Vercel.
- [ ] Turnstile keys set (forms refuse submissions in production without them).
- [ ] The seeded admin password changed; extra staff accounts created with the _staff_ role.
- [ ] `DATABASE_URL` in Vercel uses the pooler; the database password is not reused anywhere.
- [ ] Supabase: Settings → API → "Data API" can stay on; RLS protects every table. Check that `select * from orders` with the anon key returns nothing.
- [ ] Domain on HTTPS; `NEXT_PUBLIC_SITE_URL` updated.
- [ ] A first backup taken.

## Reporting a problem

Write to the developer privately; do not open a public GitHub issue for security problems.
