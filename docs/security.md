# Security

What we protect, against whom, and how. Report vulnerabilities as described in
[SECURITY.md](../SECURITY.md).

## Assets and threats

| Asset | Main threats | Controls |
|---|---|---|
| Payments / revenue | price tampering, forged payment confirmations, replayed webhooks | server-side pricing, Razorpay signature + webhook HMAC (constant-time), idempotent `markOrderPaid`, amount check |
| Customer accounts | credential stuffing, brute force, account takeover | bcrypt (cost 12), per-IP **and** per-account login rate limits, no OAuth auto-linking, hashed single-use reset tokens |
| Customer data (names, addresses, phones) | IDOR, enumeration, leakage | every query scoped by `userId`; tracking needs order # **and** email and hides the address; reset doesn't reveal account existence; private pages `noindex` + disallowed in robots |
| Admin area | privilege escalation, stale privileges | `requireAdmin` / `assertAdmin` on every page **and** action, role re-read from the DB, non-admins get 404 |
| Store availability / inbox | form spam, scripted abuse | rate limits + honeypot fields; limiter fails open so outages don't block shoppers |
| Storefront integrity | XSS, clickjacking, broken pages | React escaping, JSON-LD `<` escaped, email HTML escaped, `X-Frame-Options`/`frame-ancestors`, admin image URLs allow-listed |

## Controls in detail

### Authentication (Auth.js v5)
- JWT sessions (required for credentials sign-in), signed with `AUTH_SECRET`; HTTP-only, secure
  cookies on HTTPS.
- Passwords: min 8 chars, bcrypt cost 12.
- Google sign-in has **no** automatic account linking: email/password sign-up doesn't verify email,
  so linking would let someone who pre-registered a victim's email capture their later Google
  sign-in. ([ADR-0009](adr/0009-no-oauth-account-linking.md))
- Password reset: 32-byte random token, only its SHA-256 is stored, 1-hour expiry, deleted on use,
  previous tokens invalidated on a new request.

### Authorisation
- Pages: `requireUser(callbackUrl)` / `requireAdmin()` in `server/session.ts`.
- Actions: `getSession()` + ownership checks, or `assertAdmin()`.
- Next.js layouts don't re-run on client navigation, so **every admin page calls `requireAdmin()`
  itself** — the layout check is defence in depth only.

### Rate limits (`server/security/rate-limit.ts`)

| Action | Limit | Key |
|---|---|---|
| Login | 10 / 15 min | IP **and** account |
| Register | 5 / hour | IP |
| Password reset | 5 / hour | IP and account |
| Contact, custom request, newsletter | 5 / hour each | IP |
| Order tracking | 30 / 15 min | IP |
| Checkout start | 20 / 15 min | user |

Fixed-window counters in the `RateLimit` table (atomic `INSERT … ON CONFLICT`), so they hold across
serverless instances. IP comes from `x-forwarded-for` (set by Vercel). ([ADR-0008](adr/0008-postgres-rate-limiting.md))

### HTTP headers (`next.config.ts`)
`Strict-Transport-Security` (2 years, preload) · `X-Content-Type-Options: nosniff` ·
`Referrer-Policy: strict-origin-when-cross-origin` · `X-Frame-Options: SAMEORIGIN` +
`frame-ancestors 'self'` · `Permissions-Policy` (no camera/mic/geo; payment only for self + Razorpay) ·
no `X-Powered-By`.

### Input handling
- Every server action validates with zod (`lib/validators.ts`); phone numbers normalised, pincodes
  6 digits, quantities 1–20, max 50 cart lines.
- Server Actions get Next.js's built-in origin check (CSRF protection).
- Redirect targets after login are restricted to same-site paths (`safeRedirect`).

### Secrets
- Only `NEXT_PUBLIC_*` values reach the browser (the Razorpay **key id** is public by design).
- `.env` is git-ignored; production secrets live in Vercel env vars.
- `server/env.ts` refuses to boot production with a missing/dev `AUTH_SECRET`, non-HTTPS URL, or
  missing Razorpay keys/webhook secret.

## Known gaps / next steps
- No email verification on sign-up.
- No CAPTCHA (honeypot + rate limits only) — add Cloudflare Turnstile if spam appears.
- No full Content-Security-Policy (script/style sources) yet — needs nonces for Next's inline scripts
  and Razorpay's checkout script.
- No 2FA for the admin account — use a long unique password and keep the admin list to one or two
  people.
- Dependency updates via Dependabot; run `npm audit` before releases.
