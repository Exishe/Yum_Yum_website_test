# What we need from YUM-YUM before launch

Tick each item. Most can be done by the client directly in the admin panel.

## Must have

- [ ] **Photo rights.** Confirm YUM-YUM may use every photo in `docs/CREDITS.md`, especially the 43 visitor photos from Yandex Maps (or send your own shop photos — one per shop is enough).
- [ ] **Prices.** Check every price (Admin → Products & prices → _Unconfirmed prices_). Seed prices come from buy.am and the in-shop drink menu boards (Oct 2026). Items with no public price (birthday stack, name donut, box of 12, two cake slices) show **“price on request”** with call/WhatsApp buttons: open each one, type the price and untick _Price on request_. Then press _All prices are correct_.
- [ ] **Current shop list.** We show 7: Abovyan 25, Abovyan 2/5, Mashtots 35, Mashtots 48, Komitas 20, Megamall, Yerevan Mall. Directories also list Mashtots 5 (Pak Shuka), Moskovyan 10, Erebuni Mall, Garage Mall; Tamanyan 6 is shown as closed. Which are open today?
- [ ] **Hours per shop**, including Sunday (Mashtots 35 opens at 10:00 on Sundays according to Google), and the real mall hours.
- [ ] **Which photo is which shop** (Admin → Shops → photo). Our guesses are marked "not confirmed".
- [ ] **Phone numbers.** Directories show five different numbers (033 30 15 74, 094 30 15 74, 077 30 15 74, 011 50 55 50, 010 50 55 50). Which should the website show, and per shop?
- [ ] **WhatsApp number** — currently a placeholder (+374 94 30 15 74).
- [ ] **Instagram** — is `@yumyum_donut` the official account? Is there a TikTok? A public email?
- [ ] **Legal details for the footer**: company name, tax ID (ՀՎՀՀ), registered address.
- [ ] **Delivery**: zones, fees, minimum order, delivery hours, who delivers (own courier or buy.am only?). Current values are placeholders.
- [ ] **Delivery apps**: are you on Glovo or Yandex Eats? Send the links, or we keep only buy.am.
- [ ] **Who receives orders**: a Telegram group for the staff (preferred) and/or an email address. For the demo, `YumYum-Telegram.command` connects a bot in two minutes.
- [ ] **Turn off the demo notes** (Admin → Settings → _Demo notes_) once delivery terms, payment methods, lead time and the WhatsApp number are confirmed. Until then the site marks them “example, to confirm”.
- [ ] **Staff accounts**: names and emails of people who should manage orders and prices.
- [ ] **Privacy policy and terms**: have a lawyer check them against Armenian law.
- [ ] **Native-speaker check** of Armenian and Russian text: `docs/REVIEW-NATIVE.md`.

## Nice to have

- [ ] Larger product photos (ours are 400 px from buy.am) — ideally square, on a plain background.
- [ ] More real reviews you are happy to quote (with name and platform).
- [ ] Official Visa / Mastercard / ArCa logo files.
- [ ] A decision on the loyalty stamp card idea (DECISIONS.md → Extras).
- [ ] Domain name (e.g. yumyum.am) and who owns it.
- [ ] Hosting plan: Vercel Hobby is for non-commercial use; confirm the budget for Vercel Pro ($20/month) or choose a free alternative.

## Also for the developer

- [ ] Create the Supabase, Cloudflare Turnstile and Vercel accounts (README §7) — the client clicks sign-up; nothing has been created yet.
