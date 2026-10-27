# Features

What the store does today, who it's for, and where it lives in the code. Status of unbuilt
features is in the [roadmap](roadmap.md).

## Customer storefront

| Feature | Route | Details | Code |
|---|---|---|---|
| Home | `/` | Hero, bento category grid, bestsellers (featured products), how it works, real customer reviews (hidden until there are some), custom-print CTA, newsletter signup. | `app/(storefront)/page.tsx`, `components/home/*` |
| Catalogue | `/products` | Search (`?q=`), category chips, material filter, sort (featured / newest / price ↑↓), in-stock toggle. Filters live in the URL so results are shareable and cacheable. | `app/(storefront)/products/page.tsx`, `components/catalog/CatalogFilters.tsx`, `server/queries/catalog.ts` |
| Product page | `/products/[slug]` | Gallery, price + compare-at price, discount badge, highlights, specs, quantity, **Add to cart** / **Buy now**, low-stock nudge, verified reviews with average rating, related products, Product JSON-LD for Google. | `app/(storefront)/products/[slug]/page.tsx`, `components/catalog/*` |
| Cart | drawer + `/cart` | Persisted in `localStorage`, quantity capped at stock (and 20), free-shipping progress bar. | `stores/cart-store.ts`, `components/layout/CartDrawer.tsx`, `components/checkout/CartView.tsx` |
| Checkout | `/checkout` | Sign-in required. Saved addresses or new address (Indian states, pincode/phone validation), optional save, order notes, coupon codes, live server-side pricing, Razorpay Checkout (UPI, cards, net banking, wallets). | `components/checkout/CheckoutForm.tsx`, `server/actions/checkout.ts` |
| Order confirmation | `/checkout/success?order=` | Status timeline, items, totals, address; confirmation email sent. | `components/orders/OrderView.tsx` |
| Account | `/account` | Order history, saved addresses (make default / remove), sign out. | `app/(storefront)/account/page.tsx` |
| Order detail + reviews | `/account/orders/[orderNumber]` | Full order view; once **delivered**, the customer can rate and review each item (verified purchase). | `components/orders/ReviewForm.tsx`, `server/actions/account.ts` |
| Order tracking | `/track` | Order number + email → status timeline, courier + AWB link. Address is hidden. Rate limited. | `app/(storefront)/track/page.tsx` |
| Custom print request | `/custom-order` | Description, material, quantity, budget, deadline, link to a 3D file. Store owner is notified. | `components/forms/InquiryForms.tsx` |
| Contact | `/contact` | Contact form (owner notified), email/phone/WhatsApp links. | same |
| About | `/about` | Story, values, process. | `app/(storefront)/about/page.tsx` |
| Policies | `/policies/shipping`, `/refunds`, `/privacy`, `/terms` | Shipping, refunds & cancellations, privacy, terms — required for Razorpay KYC. **Templates; get them reviewed.** | `app/(storefront)/policies/[slug]/page.tsx` |
| Dark mode | everywhere | Follows the OS by default, toggle in the header, no flash on load. | `app/layout.tsx`, `components/layout/ThemeToggle.tsx` |
| SEO | — | Per-page metadata, Open Graph, Product JSON-LD, `sitemap.xml`, `robots.txt` (private areas disallowed). | `app/sitemap.ts`, `app/robots.ts` |

## Accounts

| Feature | Route | Details |
|---|---|---|
| Register / sign in | `/register`, `/login` | Email + password (bcrypt). Redirects back to where the shopper was (e.g. checkout). |
| Google sign-in | same | Appears when `GOOGLE_CLIENT_ID/SECRET` are set. No automatic linking to password accounts ([ADR-0009](adr/0009-no-oauth-account-linking.md)). |
| Forgot / reset password | `/forgot-password`, `/reset-password` | Emailed single-use link, valid 1 hour. Same response whether or not the email exists. |
| Abuse protection | — | Rate limits on sign-in (per IP and per account), sign-up, reset, forms, tracking and checkout; honeypot fields on public forms. See [security](security.md). |

## Admin (`/admin`, ADMIN role only)

| Feature | Route | Details |
|---|---|---|
| Dashboard | `/admin` | Revenue today / 7 days, average order value, orders to fulfil, new custom requests, customers, 14-day daily revenue chart (IST), recent orders, low-stock list. |
| Orders | `/admin/orders` | Filter by status (abandoned checkouts hidden unless selected), search by order #, email, name or phone. |
| Order detail | `/admin/orders/[id]` | Full order, customer, payment ID. Update status; add courier, AWB and tracking link; optionally email the customer. Cancelling or refunding a paid order **returns stock**. |
| Products | `/admin/products`, `/admin/products/new`, `/admin/products/[id]` | Create / edit / archive. Price, compare-at price, stock, material, colour, dimensions, weight, highlights, images (validated URLs), live / featured toggles. Saving refreshes the cached storefront immediately. |
| Requests | `/admin/requests` | Custom print requests (status, quote, internal notes, reply by email) and contact messages (read / unread). |
| Coupons | `/admin/coupons` | Create % or flat coupons with minimum order, maximum discount, usage limit and expiry; enable / disable. |

## Emails

| Email | When | To |
|---|---|---|
| Order confirmed | payment verified | customer |
| Printing / shipped / delivered / cancelled | admin changes status with "Email the customer" ticked | customer |
| Password reset | reset requested | customer |
| New order / custom request / contact message | as they happen | `STORE_NOTIFY_EMAIL` |

Sent via Resend when `RESEND_API_KEY` is set; otherwise logged and written to the dev outbox.

## Business rules (edit in `src/config/site.ts`)

| Rule | Value |
|---|---|
| Free shipping | orders ≥ ₹999 (after discount) |
| Flat shipping | ₹79 below that |
| Max quantity per item | 20 (and never above stock) |
| Order number prefix | `TLU` |
| Seeded coupons | `WELCOME10` (10%, max ₹300), `FLAT150` (₹150 off ₹1,499+) |
