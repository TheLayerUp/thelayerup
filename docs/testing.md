# Testing

| Layer | Tool | Where | Runs in CI | Command |
|---|---|---|---|---|
| Static checks | ESLint, TypeScript, Prettier | whole repo | ✅ | `npm run check` |
| Unit | Vitest | `src/**/*.test.ts` | ✅ | `npm test` |
| End-to-end | Playwright (Chrome) | `e2e/*.spec.ts` | ✅ | `npm run test:e2e` |
| Build/prerender | `next build` against seeded Postgres | — | ✅ | `npm run build` |
| Manual | checklist below | — | before releases | — |

## Unit tests (19)

Pure logic where a bug costs money or security:

| File | Covers |
|---|---|
| `src/lib/pricing.test.ts` | Coupon discount rounding, caps, subtotal floor; coupon eligibility (inactive, expired, used up, minimum order); shipping threshold; `toPaise` rejects fractions; phone/pincode validation; quantity cap; image-host allow-list |
| `src/server/payments/razorpay.test.ts` | Payment signature accept/reject, webhook HMAC tamper detection, test-payment mode disabled when keys exist |

`server-only` is stubbed for unit tests (`src/test/server-only-stub.ts`).

## End-to-end tests (15)

| Spec | Scenarios |
|---|---|
| `storefront.spec.ts` | Home renders (desktop + **mobile**), catalogue filter + search, product page JSON-LD, cart drawer quantities and free-shipping message, 404, security headers, checkout requires sign-in |
| `checkout.spec.ts` | **Full money path:** register → 2 products → `WELCOME10` → exact totals (₹848 − ₹84 + ₹79 = ₹843) → pay → success → cart cleared → account lists order → admin ships with AWB → delivers → guest tracking shows AWB but not the address → customer posts a verified review. Customer is blocked from `/admin`. |
| `auth.spec.ts` | Password reset end to end via the dev outbox (link single-use, old password rejected), no account enumeration, login rate limiting |
| `admin.spec.ts` | Dashboard KPIs + chart, product form rejects unsupported image hosts, coupons listed |

### How payment is handled in E2E

`pay()` in `e2e/helpers.ts` adapts to the server:
- **No Razorpay keys** (CI): clicks *Place test order* (local test-payment mode).
- **Razorpay test keys** (local): drives the real Razorpay Checkout iframe → Netbanking → bank →
  the simulated bank page's **Success** button. This exercises Razorpay's real test API and our
  signature verification.

### Running

```bash
npm run db:local          # if not running
npm run dev               # optional — Playwright starts it if needed
npm run test:e2e          # headless
npm run test:e2e:ui       # watch mode / time-travel debugger
npx playwright show-report
```

- Tests run serially (shared DB, shared localhost IP for rate limits).
- `e2e/global-setup.ts` clears rate-limit counters and **refuses to run against a non-local
  database**.
- Each run creates uniquely named users/orders; reset the local DB occasionally.
- The password-reset test needs `RESEND_API_KEY` **unset** (it reads the dev outbox).

## Manual release checklist

Run on the Vercel preview (test keys) before promoting to production:

- [ ] Home, catalogue filters, product page on a phone and a laptop, light + dark
- [ ] Register, sign out, sign in, forgot password (email arrives, link works)
- [ ] Buy with UPI (test: `success@razorpay`) and with a test card; confirmation email received
- [ ] Close the tab mid-payment, pay, confirm the webhook still marks it paid
- [ ] Apply an invalid coupon (error shown) and a valid one (totals update)
- [ ] Admin: change status to Shipped with AWB → customer email; Cancel → stock returns
- [ ] `/track` with order number + email
- [ ] Lighthouse on `/` and a product page: performance ≥ 90, accessibility ≥ 95, SEO 100

## Writing new tests

- Pure rule? Put it in `src/lib` or a service helper and unit-test it.
- User-visible flow? Add a Playwright spec using role/label selectors (`getByRole`, `getByLabel`) —
  they double as accessibility checks.
- Use `uniqueEmail()` / `randomPassword()`; never hard-code credentials other than the seeded admin
  from `.env`.
