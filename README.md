# YUM-YUM Donuts — website, ordering and admin

The website of YUM-YUM Donuts, Yerevan's donut and coffee shop since 1997.
Three languages (Armenian, Russian, English), a menu with prices from the
database, pickup and delivery orders, gift builder, and an admin panel for the
shop staff.

- Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · next-intl · Drizzle ORM · PostgreSQL (Supabase) · Vercel
- Everything is free-tier. See [docs/TECH-STACK.md](docs/TECH-STACK.md).
- What the client still has to confirm: [docs/CLIENT-TODO.md](docs/CLIENT-TODO.md).

| Page                                       | Path (Armenian / Russian / English)              |
| ------------------------------------------ | ------------------------------------------------ |
| Home                                       | `/hy` · `/ru` · `/en`                            |
| Menu & prices                              | `/hy/menu` · `/ru/menu` · `/en/menu`             |
| Gifts (box builder, name donuts, bouquets) | `/hy/nverner` · `/ru/podarki` · `/en/gifts`      |
| Our story                                  | `/hy/mer-masin` · `/ru/o-nas` · `/en/our-story`  |
| Shops                                      | `/hy/khanutner` · `/ru/adresa` · `/en/shops`     |
| Checkout                                   | `/hy/patver` · `/ru/oformlenie` · `/en/checkout` |
| Order status                               | `/{lang}/order/{id}`                             |
| Admin                                      | `/admin`                                         |

---

## Quick look: run the website in 3 commands (no database to install)

You need Node.js 22 and Git. In PowerShell (Windows) or Terminal (macOS):

```powershell
git clone -b claude/stoic-dijkstra-kmom5z https://github.com/Exishe/Yum_Yum_website_test.git
cd Yum_Yum_website_test
corepack enable
pnpm install
pnpm demo
```

Then open **http://localhost:3000/hy** (also `/ru` and `/en`). The first page takes about 10 seconds to appear while it compiles; after that it is fast.

- Admin panel: **http://localhost:3000/admin** — `admin@yumyum.local` / `yumyum-demo-2026`
- Everything works: menu, basket, checkout, order tracking, admin. Orders are saved in a built-in database in the `.pglocal` folder (PGlite: real PostgreSQL in WebAssembly), so there is nothing else to install.
- Stop with `Ctrl+C`. Start again with `pnpm demo` (your test orders are kept). Start from scratch with `pnpm demo:reset`.

Demo mode is used automatically whenever `DATABASE_URL` is not set, and only outside production. For the real setup with PostgreSQL, follow sections 1–7.

---

## On a Mac: double-click launchers

After cloning into your home folder (`~/Yum_Yum_website_test`), copy the launchers to the Desktop once:
`cp ~/Yum_Yum_website_test/YumYum-*.command ~/Desktop/`

- **YumYum-Start.command** pulls the latest code, installs packages, builds the fast version and opens the browser.
- **YumYum-Telegram.command** connects order notifications to your Telegram (the token stays in `.env.local`).

---

## Share a preview link (temporary, from your PC)

1. In PowerShell, in the project folder: `npx.cmd -y pnpm@10.28.0 share` (or `pnpm share`). It builds the fast production version and serves it on http://localhost:3000 with the demo database. Search engines are told not to index it.
2. Install Cloudflare's tunnel once: `winget install --id Cloudflare.cloudflared -e` (macOS: `brew install cloudflared`). Close and reopen PowerShell.
3. In a **second** PowerShell window: `cloudflared tunnel --url http://localhost:3000`
4. It prints a link like `https://random-words.trycloudflare.com`. Send people that link with `/hy`, `/ru` or `/en` at the end.

The link works only while both windows stay open and the PC is awake, and changes every time. For a permanent link, deploy (section 7).

---

## 1. Install the tools (once per computer)

You need **Node.js 22 LTS**, **pnpm 10**, **Git**, and a **PostgreSQL 16** database
(Docker is the easiest way to get one locally).

### Windows 11 (PowerShell)

Open **PowerShell** (Start → type "PowerShell"). Run:

```powershell
winget install --id OpenJS.NodeJS.LTS -e        # Node.js 22 LTS
winget install --id Git.Git -e                   # Git
winget install --id Docker.DockerDesktop -e      # Docker Desktop (for the local database)
```

Close PowerShell and open it again so the new commands are found. Then:

```powershell
corepack enable                 # turns on pnpm, which ships with Node
corepack prepare pnpm@10.28.0 --activate
node -v                         # expect v22.x
pnpm -v                         # expect 10.x
git --version
```

Start **Docker Desktop** once from the Start menu and wait until it says "Engine running".

> If `corepack enable` says "access denied", run PowerShell as Administrator once
> (right-click → Run as administrator), run `corepack enable`, then go back to a normal window.

### macOS (MacBook Air M2, Terminal)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"   # Homebrew, if missing
brew install node@22 git
brew install --cask docker        # Docker Desktop; open it once from Applications
corepack enable && corepack prepare pnpm@10.28.0 --activate
node -v && pnpm -v
```

---

## 2. Get the code and install packages

```powershell
git clone https://github.com/Exishe/Yum_Yum_website_test.git
cd Yum_Yum_website_test
pnpm install
```

(Same commands on macOS.)

## 3. Create your `.env.local`

Windows:

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

macOS:

```bash
cp .env.example .env.local
open -e .env.local
```

For local development you only need to set three values:

| Variable              | What it is                                        | Where to get it                                                                                             |
| --------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | Address of the Postgres database                  | Leave the default if you use `docker compose` below                                                         |
| `APP_SECRET`          | Long random text used to hash IPs and sign tokens | Windows: `[Convert]::ToBase64String((1..48 \| % {Get-Random -Max 256}))` · macOS: `openssl rand -base64 48` |
| `SEED_ADMIN_PASSWORD` | Password for the first admin account              | Choose one (12+ characters) or leave empty to get a random one printed                                      |

Every other variable is explained inside [`.env.example`](.env.example). They switch on
optional services (Turnstile, Telegram, email, photo uploads) and can stay empty locally.

## 4. Start the database, create the tables, add the real menu

```powershell
docker compose up -d        # starts Postgres 16 on localhost:5432
pnpm db:migrate             # creates tables and row-level security
pnpm db:seed                # adds YUM-YUM's real menu, shops, zones, settings and the first admin
```

The seed prints the admin email (and the temporary password if you left it empty).
Seeding is safe to run again: it never overwrites prices you changed in the admin panel.

**Without Docker?** Install PostgreSQL 16 directly (Windows: `winget install PostgreSQL.PostgreSQL.16`;
macOS: `brew install postgresql@16 && brew services start postgresql@16`), create a database
called `yumyum`, and put its address in `DATABASE_URL`.

**Using a Supabase project instead?** Put its connection string (Project settings → Database →
Connection string → _Transaction pooler_, port 6543) in `DATABASE_URL` and run the same two
commands. The Supabase CLI local stack also works (`supabase start`, then use the DB URL it prints).

## 5. Run the site

```powershell
pnpm dev
```

Open **http://localhost:3000/hy** (Armenian; `/ru` and `/en` for the others).
The admin panel is at **http://localhost:3000/admin** — sign in with the seeded admin.
On first sign-in with a temporary password you are asked to choose your own.

Need another staff account? Use _Users_ in the admin panel, or:

```powershell
pnpm admin:create staff@example.com "Ani" staff
```

## 6. Tests and checks

```powershell
pnpm lint          # ESLint
pnpm typecheck     # TypeScript, strict
pnpm test          # unit tests (Vitest): time slots, prices, validation
pnpm build         # production build
pnpm start         # serve the production build on :3000
pnpm test:e2e      # browser tests (Playwright): orders in 3 languages + admin, desktop and phone
```

The browser tests need Chromium once: `pnpm exec playwright install chromium`.
They expect the seeded admin password `donut-give-up-2026`, or set
`E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`. For many test orders in a row, set
`ORDER_RATE_LIMIT_PER_HOUR=500` in `.env.local` (the default 8 per hour protects production).

Every push runs the same checks on GitHub Actions (`.github/workflows/ci.yml`).

---

## 7. Put it online: Vercel (with Neon and Blob inside it)

Everything is created from one Vercel account and billed there: the site, the database
(Neon, from the Vercel Marketplace) and photo storage (Vercel Blob).

### 7.1 Vercel project

1. **vercel.com** → _Add New → Project_ → import the GitHub repository.
2. Framework preset: Next.js (detected). Install command: `pnpm install`.
3. Do not deploy yet: first add the database and photo storage below.

### 7.2 Database (Neon) and photo storage (Blob)

1. Project → _Storage → Create Database → Neon_. Region: **Frankfurt** (closest to Yerevan).
   Connect it to the project. Vercel adds `DATABASE_URL` to the project's environment variables.
2. Project → _Storage → Create → Blob_, connect it to the project. Vercel adds
   `BLOB_READ_WRITE_TOKEN`. Photos uploaded in the admin are stored there.
3. On your computer, create the tables and the menu once. Copy `DATABASE_URL` from
   _Settings → Environment Variables_ (or `vercel env pull`), then:

   ```powershell
   $env:DATABASE_URL="postgresql://…neon.tech/neondb?sslmode=require"
   $env:SEED_ADMIN_EMAIL="owner@yumyum.am"; $env:SEED_ADMIN_PASSWORD=""
   pnpm db:migrate; pnpm db:seed
   ```

   macOS: `DATABASE_URL="…" SEED_ADMIN_EMAIL="owner@yumyum.am" pnpm db:migrate && pnpm db:seed`

Any other Postgres works too (for example Supabase: use its transaction pooler URL as
`DATABASE_URL`).

### 7.3 Cloudflare Turnstile (anti-spam)

dash.cloudflare.com → _Turnstile_ → _Add site_ → your domain (and `*.vercel.app` while testing),
widget mode _Managed_. Copy the site key and secret key.

### 7.4 Environment variables and deploy

1. _Settings → Environment Variables_: besides `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN`
   (added by Vercel), add at minimum `NEXT_PUBLIC_SITE_URL` (e.g. `https://yumyum.am`),
   `APP_SECRET`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `CRON_SECRET`,
   and one notification channel. See `.env.example`.
2. _Deploy_. The nightly privacy clean-up is scheduled by `vercel.json` and authenticated with `CRON_SECRET`.
3. While `DEMO.enabled` is true in `lib/demo-config.ts`, also turn on _Analytics_ in the
   project to see visits.

### 7.5 Custom domain

Vercel → Project → _Settings → Domains_ → add `yumyum.am` and `www.yumyum.am`. At the domain
registrar, add the DNS records Vercel shows (an `A` record `76.76.21.21` for the apex and a
`CNAME` `cname.vercel-dns.com` for `www`). HTTPS is automatic. Then update
`NEXT_PUBLIC_SITE_URL` and redeploy.

### 7.6 Order notifications

**Telegram (recommended, instant on the shop's phones):**

Easiest: run `node scripts/telegram-setup.mjs` in the project folder (on a Mac, double-click
`YumYum-Telegram.command`). It asks for the BotFather token, waits for a message to the bot,
sends a test message and writes the three variables below to `.env.local`. By hand:

1. In Telegram, open **@BotFather** → `/newbot` → follow the steps → copy the token → `TELEGRAM_BOT_TOKEN`.
2. Create a group for the shop staff and add the bot to it. Send any message in the group.
3. Open `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser and find `"chat":{"id":-100…}` → `TELEGRAM_CHAT_ID`.
4. `NOTIFY_CHANNELS=telegram`. Place a test order: the group receives it within seconds.

**Email (Resend free tier):** resend.com → verify your domain → _API keys_ → `RESEND_API_KEY`;
set `EMAIL_FROM` (an address on the verified domain) and `ORDER_EMAIL_TO`. Email is also used
for newsletter confirmations.

Every notification attempt is listed on the admin dashboard, so a failing channel is visible.

---

## 8. Troubleshooting on Windows

| Problem                                                       | Fix                                                                                                                                           |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm` is not recognised                                      | Run `corepack enable` again, then reopen PowerShell.                                                                                          |
| `running scripts is disabled on this system`                  | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, answer `Y`.                                                                            |
| `docker compose` fails, "cannot connect to the Docker daemon" | Start Docker Desktop and wait for "Engine running". If asked, enable WSL 2 (`wsl --install`) and restart Windows.                             |
| Port 5432 already in use                                      | Another Postgres is running. Stop it (Services → postgresql) or change the port in `docker-compose.yml` to `5433:5432` and in `DATABASE_URL`. |
| Port 3000 in use                                              | `pnpm dev -- -p 3001`, then open `http://localhost:3001/hy`.                                                                                  |
| `sharp` install errors                                        | `pnpm rebuild sharp`. Make sure Node is 64-bit (`node -p process.arch` → `x64`).                                                              |
| Line-ending warnings from Git                                 | `git config --global core.autocrlf true`.                                                                                                     |
| Armenian text shows as boxes in PowerShell output             | Only the console font; the website is fine. Use Windows Terminal.                                                                             |
| Long path errors                                              | `git config --global core.longpaths true`.                                                                                                    |

## 9. Where things are

```
app/[locale]/…        pages of the public site (hy, ru, en)
app/admin/…           admin panel and its server actions
app/api/…             newsletter confirmation, nightly clean-up
components/           UI (layout, home, catalog, gifts, checkout, admin)
lib/                  data access, pricing, time slots, auth, security, validation
db/                   schema, migrations, row-level security, real seed data
messages/             all interface text: hy.json, ru.json, en.json
public/images/source  original photos, untouched (see docs/CREDITS.md)
tests/unit, tests/e2e Vitest and Playwright tests
docs/                 decisions, security, copy, glossary, credits, research, client to-do
```
