# Configuration

## Environment variables

Copy `.env.example` → `.env` for local development. In production set these in Vercel
(*Settings → Environment Variables*). "Boot check" = the server refuses to start in production
without it (`src/server/env.ts`).

| Variable | Required in prod | Boot check | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | ✅ | Postgres URL used by the app. Neon: the **pooled** URL with `&pgbouncer=true`. |
| `DIRECT_URL` | ✅ | ✅ | Direct (non-pooled) URL — used by `prisma migrate`. Locally the same as `DATABASE_URL`. |
| `AUTH_SECRET` | ✅ | ✅ (≥ 32 chars, not the dev value) | Signs session cookies. `npx auth secret`. Rotating it signs everyone out. |
| `AUTH_TRUST_HOST` | when not on Vercel | — | `true` when self-hosting behind a proxy. |
| `NEXT_PUBLIC_APP_URL` | ✅ | ✅ (https) | Canonical URL: `https://thelayerup.in`. Used in emails, sitemap, metadata. |
| `NEXT_PUBLIC_APP_NAME` | — | — | Brand name override (default `TheLayerUp`). |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | ✅ | ✅ | `rzp_test_…` or `rzp_live_…`. Public by design. |
| `RAZORPAY_KEY_SECRET` | ✅ | ✅ | Razorpay API secret. |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ | ✅ | Secret of the webhook you create in the Razorpay dashboard. |
| `RESEND_API_KEY` | strongly recommended | warns | Without it no emails are sent (order confirmations, password resets). |
| `EMAIL_FROM` | with Resend | — | e.g. `TheLayerUp <orders@thelayerup.in>`; domain must be verified in Resend. |
| `STORE_NOTIFY_EMAIL` | optional | — | Receives new orders, custom requests and contact messages. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | — | Enables "Continue with Google". Redirect URI: `https://thelayerup.in/api/auth/callback/google`. |
| `SHIPROCKET_*` | not yet used | — | Reserved for the Shiprocket integration. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | for `db:seed` only | — | Creates/promotes the admin. ≥ 12 chars on non-local DBs. |
| `SEED_SAMPLE_PRODUCTS` | — | — | `true` to seed the 12 sample products into a non-local DB. |

## Business configuration — `src/config/site.ts`

| Key | Purpose |
|---|---|
| `name`, `tagline`, `description` | Brand copy used in metadata and emails |
| `url` | From `NEXT_PUBLIC_APP_URL` |
| `orderPrefix` | `TLU` → `TLU-7K3QX9` |
| `contact.email / phone / whatsapp / city` | Footer, contact page, error page, emails |
| `social.instagram` | Footer link |
| `shipping.freeAbove / flatRate` | Shipping rule (₹999 / ₹79) — `shippingFor()` |

## Other configuration

| File | What it controls |
|---|---|
| `src/config/images.ts` | Hosts allowed for product images (also feeds `next.config.ts` `images.remotePatterns`). Add your Cloudinary host here. |
| `src/config/india.ts` | State list for the address form |
| `src/server/security/rate-limit.ts` → `RULES` | Rate-limit budgets |
| `src/app/globals.css` | Design tokens (colours for light/dark, fonts) |
| `next.config.ts` | Cache Components, security headers, image hosts |
| `prisma/data/catalog.ts` | Sample categories/products for seeding |
