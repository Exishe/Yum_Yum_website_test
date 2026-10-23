# Architecture

```
 Phone / desktop browser
        │  HTTPS
        ▼
 ┌──────────────────────────── Vercel ────────────────────────────┐
 │ proxy.ts  → locale routing (hy/ru/en), nonce CSP, admin no-index │
 │                                                                  │
 │ app/[locale]/…   Server Components render pages from the DB      │
 │   └ small Client Components: header, hero chips, catalogue tabs, │
 │     basket (localStorage), checkout form, box builder            │
 │ lib/actions.ts   Server Actions: placeOrder, sendContact,        │
 │                  subscribeNewsletter (Zod + Turnstile + limits)   │
 │ app/admin/…      Admin pages + server actions (role-checked)      │
 │ app/api/cron/retention   nightly privacy clean-up (Vercel Cron)   │
 └───────────────┬───────────────────────────┬──────────────────────┘
                 │ SQL (owner role, server only)│ after() → notify
                 ▼                              ▼
     ┌──────── Supabase ────────┐      Telegram bot / Resend email
     │ PostgreSQL + RLS          │
     │ Storage: product-images   │
     └───────────────────────────┘
```

## Request flow: placing an order

1. The basket lives in `localStorage` (`lib/cart-store.ts`).
2. Checkout validates in the browser with the shared Zod schema, then calls the
   `placeOrder` server action.
3. The server re-validates, checks the honeypot, rate limits by IP and phone, verifies Turnstile.
4. `lib/orders.ts` loads the menu from the database, **reprices every line**
   (`lib/pricing.ts`), checks the shop or delivery zone, recomputes the allowed
   time slots in Yerevan time (`lib/ordering.ts`, `lib/time.ts`) and inserts the
   order, items and first status row in one transaction.
5. The customer is sent to `/{lang}/order/{publicId}`. That page refreshes itself
   every 30 s until the order is done.
6. After the response, `after()` sends the shop a Telegram/email message and logs it.

## Data model

```
categories 1─* products 1─* product_options
shops ─────────┐
delivery_zones ─┼─* orders 1─* order_items
                │        1─* order_status_history *─1 users
reviews, settings, site_texts, newsletter_subscribers, contact_messages
users 1─* sessions;  audit_log;  rate_limits;  notification_log
```

- Localised fields are JSON `{hy, ru, en}`.
- Prices are whole dram (`integer`).
- `orders.public_id` (random) is the only ID customers ever see.
- `settings` holds the banner, contacts, ordering rules, delivery-app links and legal details.
- `site_texts` overrides any string in `messages/*.json` (Admin → Site texts).

## Caching

Catalogue, shops, zones, reviews, settings and text overrides are cached on the server
(`unstable_cache` with tags). Admin actions call `updateTag(...)`, so changes appear on
the site immediately. Pages are rendered per request (needed for the CSP nonce), which is
cheap because the data comes from the cache.

## Sitemap

| Public                                                                                                                                 | Admin                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home · Menu & prices · Gifts · Our story · Shops · Contact · Privacy · Terms · Checkout · Order status · Newsletter confirmation · 404 | Dashboard · Orders (list, detail, print, CSV) · Products & prices · Categories · Shops · Delivery zones · Reviews · Site texts · Settings · Messages & subscribers · Users · Audit log · My account |

## Main components

| Area      | Components                                                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout    | `Header` (pills, mega-menu, phone panel), `LanguageSwitch`, `OrderButton`, `CartDrawer` (lazy), `StickyOrderBar`, `Footer`, `NewsletterForm`, `CookieConsent`, `Banner` |
| Home      | `Hero`, `PhotoStrip`, `Perks`, `Catalog` (home mode), `GiftsSection`, `StorySection`, `Ticker`, `Spotted`, `Reviews`, `ShopPicker`                                      |
| Catalogue | `Catalog` (tabs, filters, search, featured, menu board), `QuickView` (lazy)                                                                                             |
| Gifts     | `BoxBuilder`, `NameDonut`, `GiftGrid`                                                                                                                                   |
| Checkout  | `CheckoutForm`, `Turnstile`                                                                                                                                             |
| Admin     | `ui.tsx` kit, `ProductForm`, `OptionsEditor`, `SubmitButton`                                                                                                            |
