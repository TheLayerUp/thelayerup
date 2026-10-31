# Roadmap

What is built, what changed from the [original product plan](product-plan.md), and what to build next.

## Status (updated 31 Oct 2026)

**Phase 1 is production-ready and Phase 2 is mostly done.** Everything below was verified end to end, including a **real Razorpay test-mode payment**: register → cart → coupon → Razorpay Netbanking → order paid → admin ships → delivered → verified review → review shows on the homepage. Also verified:

- the webhook accepts a signed replay without double-counting stock, and rejects a forged signature
- `npm run build` passes
- 19 unit tests pass
- a misconfigured production server refuses to start

| Phase | Item | Status |
|---|---|---|
| 1 | Project setup, schema + migrations, seed data, CI | ✅ |
| 1 | Homepage, catalogue (search / category / material / sort / in-stock), product page | ✅ |
| 1 | Cart drawer + cart page, free-shipping progress | ✅ |
| 1 | Auth — email/password, forgot/reset password, Google (when keys are set) | ✅ |
| 1 | Checkout → Razorpay → signature verify → webhook backup (amount-checked) | ✅ tested with test keys |
| 1 | Order confirmation page + email; store-owner notification email | ✅ (needs `RESEND_API_KEY`) |
| 1 | Responsive, light + dark theme, error pages | ✅ |
| 2 | Admin dashboard (KPIs, 14-day revenue chart, low stock, recent orders) | ✅ |
| 2 | Product management (create / edit / archive, validated image URLs) | ✅ |
| 2 | Order management (status, courier/AWB, customer emails, stock returned on cancel) | ✅ |
| 2 | Order tracking page (order # + email, rate limited) | ✅ |
| 2 | Inventory — stock decrement on payment, low-stock alerts, sold-out handling | ✅ |
| 2 | Shiprocket — pincode delivery check on product pages (live ETA when `SHIPROCKET_*` is set, standard promise otherwise) | ✅ |
| 2 | Shiprocket — book courier + AWB from the admin order page, print label, live courier scans on `/track` | ✅ built; contract-tested against the documented API (`shiprocket.test.ts`: login + token reuse, serviceability, adhoc order payload, AWB assignment, tracking, error handling). **Live API login and delivery serviceability verified on 31 Oct 2026** using the configured API user and pickup location. Shipment booking, AWB, label and tracking remain pending; wallet balance is ₹0. |
| 3 | Custom print request form → admin inbox with quote/status | ✅ (file **link**, not upload) |
| 3 | Coupon system (%, flat, min order, max discount, usage limit, expiry) | ✅ |
| 3 | Account — order history, order detail, saved addresses | ✅ |
| 3 | Verified-purchase reviews (from delivered orders) → product page + homepage | ✅ |
| 3 | Related products, About, Contact (+ WhatsApp), policy pages | ✅ |
| 3 | SEO — metadata, Product JSON-LD, sitemap, robots | ✅ |
| 3 | Wishlist (heart on product pages, `/account/wishlist`) | ✅ |
| 3 | Autocomplete search in the navbar (`/api/search`, keyboard navigable) | ✅ |
| 3 | Analytics page — revenue, AOV, checkout→paid, returning buyers, top products, states, categories (7/30/90 days) | ✅ `/admin/analytics` |
| 3 | Review moderation — hide / publish / delete, filters | ✅ `/admin/reviews` |
| — | Mobile-first refresh: floating pill navbar (hides on scroll down), floating contact button (WhatsApp, Instagram, Telegram, call) | ✅ |
| — | Landing page: heyclicky-style hero with floating windows playing the shop’s Instagram reels (lamp, One Piece coasters, gopuram, wavy clock, name sign), cut to 3–7 s loops at 50–450 KB each; only fetched while on screen, never on Save-Data / reduced motion | ✅ add reels with `npm run reels:compress` (originals in git-ignored `media-src/reels/`) |
| 4 | PWA — installable (web manifest, Apple web-app meta) | ✅ offline support not included |
| 4 | 3D model viewer — optional .glb per product, "View in 3D" loads the viewer on demand | ✅ |
| 4 | Instant STL quote — size, volume, weight and price per material, computed in the browser | ✅ `/custom-order`; rates in `src/config/quote.ts` |
| 4 | Bulk / corporate orders page (requests tagged BULK in the admin inbox) | ✅ `/bulk-orders` |
| 4 | Blog / guides (3 posts, Article JSON-LD, in sitemap) | ✅ `/blog`; posts in `src/content/blog.ts` |
| 4 | Referral program — share link, friend gets a welcome coupon, referrer a thank-you coupon after the friend's first paid/delivered order | ✅ amounts in `site.referral` |
| 4 | Push notifications for order updates (service worker + web push) | ✅ needs VAPID keys (`npx web-push generate-vapid-keys`) |
| 4 | Hindi (EN / हिं switch) — whole storefront chrome and shopping path, Hindi product names/descriptions (admin fields, shown when entered) and category names, and customer emails in the language the shopper used | ✅ blog posts and policy pages are English |
| 4 | Cash on delivery — fee + cap, WhatsApp confirmation, paid on delivery | ✅ fee/cap in `site.cod` |
| 4 | Returns — damage/defect reports within 48 h of delivery (matches the refund policy), admin inbox with customer emails | ✅ `/admin/returns` |
| 4 | Telegram catalogue bot (see below) | 📝 planned |

### Production hardening done

- **Security**
  - Postgres-backed rate limits on login (per IP and per account), sign-up, password reset, forms, tracking and checkout.
  - Honeypots on public forms.
  - Hashed, single-use, 1-hour reset tokens; the reset request doesn't reveal whether an email has an account.
  - Admin role re-checked in the DB on every admin page and action.
  - Removed Google auto account-linking, which was an account-takeover risk.
  - Security headers (HSTS, clickjacking, nosniff, Permissions-Policy).
  - Admin image URLs restricted to allow-listed hosts.
- **Payments:** the webhook checks the amount paid against the order total. Customer phone and email are prefilled in Razorpay Checkout (fixed a bug where the phone wasn't prefilled). Paise conversion refuses non-integer amounts.
- **Operations**
  - The server validates the production env at boot and logs errors as structured JSON.
  - Storefront and admin error boundaries, plus a global error page.
  - The store owner is emailed on new orders, custom requests and contact messages.
  - The seed refuses weak admin passwords and skips sample products on production DBs.
  - `vercel-build` runs migrations on deploy.
- **Quality:** unit tests for the money rules, signature checks, validators and the image allowlist. GitHub Actions CI runs lint, typecheck, tests and a build against Postgres.
- **Honesty:** removed made-up testimonials and the "500+ orders" stats. The homepage now shows real verified reviews only, and hides the section until there are some.

### Changes to the original plan

1. **Brand is TheLayerUp** on warm cream + `#fe5a35`, with a matching dark mode. Name, contact details (WhatsApp +91 63832 71769, Chennai) and shipping rules live in `src/config/site.ts`.
2. **Next.js 16, not 15**, with Cache Components. Catalogue reads are cached and tagged; session-dependent UI streams behind `<Suspense>`.
3. **Prisma 6.19, not 7/8.** This machine has Node 20.11. Upgrade Node to 22 LTS, then move to Prisma 7.
4. **Local DB is PGlite** (`npm run db:local`). Production uses Neon, with a pooled URL for the app and a direct URL for migrations.
5. **Money is `Int` rupees.** **Prices are re-computed on the server** at checkout.
6. **Order snapshots.** Orders store the address and line items; the `Order → Address` foreign key was dropped.
7. **Idempotent payment confirmation** via `markOrderPaid` (client verify and webhook). Stock and coupon usage update in the same transaction.
8. **Readable order numbers** (`TLU-7K3QX9`). Guest tracking needs order number **and** email.
9. **Policy pages** (`/policies/shipping|refunds|privacy|terms`) for Razorpay KYC. ⚠️ Templates, so have them reviewed.

### Before launch (your checklist)

1. Create Neon (Singapore region) + Vercel + Resend accounts and set the env vars listed in the [deployment guide](deployment.md), including `CRON_SECRET` and `STORE_NOTIFY_EMAIL`. Verify `thelayerup.in` in Resend (SPF/DKIM) so emails don't land in spam.
2. Create the Razorpay webhook and set `RAZORPAY_WEBHOOK_SECRET`.
3. Seed production once with a strong admin password, then add real products and photos.
4. Replace the placeholder email (`hello@thelayerup.in`) in `site.ts` if it differs. Instagram is set to @thelayerup.in.
5. Get the policy pages reviewed, complete Razorpay KYC, then switch to `rzp_live_` keys.
6. **Rotate the Razorpay test secret.** It was shared in a chat; test keys can't move real money, but it's good hygiene.
7. Point an uptime monitor (Better Stack / UptimeRobot) at `https://thelayerup.in/api/health`.

---

## Suggested improvements (prioritised)

Ordered by impact for a new Indian D2C store.

**Conversion and revenue**
1. **Guest checkout** (biggest win). Forced sign-up loses a large share of mobile buyers. Ask for email + phone at checkout and offer "save your details" after payment.
2. ✅ **Cash on Delivery should move from Phase 4 to Phase 2.** A large share of Indian D2C orders are COD. Add a small COD fee and confirm COD orders by WhatsApp/OTP to cut fake orders and RTO (return-to-origin) losses.
3. **WhatsApp order updates** alongside email (WATI / Interakt / Gupshup). Indian customers read WhatsApp, not email. This matters more than web push (Phase 4).
4. **Product variants** (colour, size). The schema stores one colour per product; customers will want to pick. Add a `ProductVariant` table with its own stock and price delta.
5. **Personalisation fields** (name to print, colour choice) as structured inputs on the product page. Order notes are easy to miss.
6. **Abandoned-cart recovery.** Unpaid `PENDING` orders already hold email + cart; send a reminder after a few hours.

**Operations**
7. **GST invoices.** If you're GST-registered, every order needs a tax invoice (HSN code, GSTIN, CGST/SGST vs IGST by state). Add a PDF invoice per order. If not registered yet, note it in the policies.
8. **Shiprocket before analytics.** Manual AWB entry won't scale past ~10 orders a day. Real pincode serviceability at checkout also stops orders you can't deliver.
9. **Production queue in admin.** For a print-to-order business, a "print queue" view (paid orders grouped by product/material/colour, with estimated print time) is more useful than a revenue chart.
10. **Direct uploads** (Cloudinary) for product photos and customer STL files, with size and type limits. Cloudinary handles image resizing and WebP too.

**Platform**
11. **Error monitoring + analytics:** Sentry (free tier) for errors, and Vercel Analytics or PostHog for funnels (product view → cart → checkout → paid).
12. **Upgrade Node to 22 and Prisma to 7** in one PR, then drop PGlite for `prisma dev`.
13. **Email verification on sign-up**, once Resend is live.
14. **Review moderation** in admin (publish / hide), and photo reviews later.
15. **Drop "Instagram feed embed" from the homepage plan.** The embeds are slow and break often; link to Instagram instead. ✅ Done: the homepage reels wall plays self-hosted clips from `src/config/showcase.ts`, so nothing loads from Instagram.

---

## Planned: update the catalogue from Telegram

**Goal:** the owner adds or edits a product by sending a photo and a short message to a private Telegram bot, with no admin form on a phone.

**Flow**

1. Owner sends the bot one or more photos with a caption, e.g.

   ```
   Moon Lamp Mini
   ₹899 (was ₹1099)
   Lamps · PLA · stock 12
   Warm LED moon, 10 cm, USB-C.
   ```

2. The bot replies with a **preview** (name, price, category, stock, photos) and buttons: ✅ Publish · ✏️ Edit · 💾 Save as draft · ❌ Cancel.
3. On publish the product is created and made active, photos are uploaded, the catalogue cache tags are refreshed, and the bot replies with the product link.
4. Quick commands for later edits: `/stock moon-lamp-mini 5`, `/price moon-lamp-mini 799`, `/hide moon-lamp-mini`, `/feature moon-lamp-mini`.

**How to build it**

- **Webhook route** `POST /api/telegram/webhook`. Register it with Telegram's `setWebhook` and `secret_token`; the route rejects any request whose `X-Telegram-Bot-Api-Secret-Token` header doesn't match `TELEGRAM_WEBHOOK_SECRET`.
- **Who can use it:** only Telegram user IDs in `TELEGRAM_ADMIN_IDS` (allowlist). Check them against an ADMIN user in the DB too, matching the admin pages ([ADR-0010](adr/0010-jwt-sessions-with-db-role-check.md)).
- **Parsing:** a forgiving parser for the caption format above. Optionally, an AI SDK `generateObject` call (via AI Gateway) with the existing Zod `productSchema`, so free-form captions work. Then always show the preview before saving.
- **Photos:** `getFile` → download from Telegram → upload to Cloudinary or Vercel Blob → store that URL. This needs the image upload work from item 10 first; Telegram file URLs expire and must not be stored.
- **Albums:** Telegram sends album photos as separate updates with a shared `media_group_id`. Buffer them for a few seconds (DB row keyed by group id) before building the preview.
- **Reuse:** call the same server-side save logic as `saveProduct` in `src/server/actions/admin.ts` (extract it into a `src/server/services/products.ts` service first), so validation, slugging and cache refresh (`updateTag("products")`) stay identical.
- **Library:** grammY, or Vercel's Chat SDK (Telegram adapter) if Slack/WhatsApp come later. Make it idempotent on `update_id`, since Telegram retries.
- **Env:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ADMIN_IDS`.
- **Nice later:** new-order and custom-request alerts to the same chat, plus "mark shipped + AWB" replies.


## Engineering backlog

| Item | Why | Notes |
|---|---|---|
| Upgrade local Node to 22 → Prisma 7 | Prisma 6 is the previous major | `prisma.config.ts`, driver adapter (`@prisma/adapter-pg` / Neon), replace PGlite with `prisma dev` — [ADR-0003](adr/0003-prisma-6-on-node-20.md) |
| Stock reservation at checkout | Stop overselling before it happens | Today an oversell is caught at payment (stock clamped at 0, store alerted). Reserving for ~15 min on `startCheckout` would prevent it |
| Full Content-Security-Policy | Defence against injected scripts | Nonce-based; allow `checkout.razorpay.com` |
| Sentry (or similar) | Alerting on errors | Wire into `onRequestError` in `src/instrumentation.ts` |
| Email verification on sign-up | Trust in account emails | Then revisit [ADR-0009](adr/0009-no-oauth-account-linking.md) |
| Cloudinary uploads | Admins paste URLs today | Signed uploads from the admin; add host in `src/config/images.ts` |
| Shiprocket shipment verification | Live API login and serviceability pass; booking is still unverified | Local API credentials and verified pickup are configured. Fund the Shiprocket wallet and select a real parcel, then verify booking/AWB/label/tracking |
| Admin 2FA / audit log | Protect the highest-privilege account | TOTP via Auth.js or an auth provider |
