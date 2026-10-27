# Changelog

All notable changes to this project. Format: [Keep a Changelog](https://keepachangelog.com/);
versions follow [SemVer](https://semver.org/).

## [Unreleased]

## [1.0.0] — 2026-10-27 — Launch candidate

### Added
- Storefront: home, catalogue (search, category, material, sort, in-stock), product pages with
  JSON-LD, cart drawer and page, checkout with coupons and saved addresses, order confirmation,
  account (orders, addresses), order tracking, custom-print requests, contact, about, policy pages,
  dark mode, sitemap and robots.
- Payments: Razorpay Checkout with signature verification, signed and amount-checked webhook,
  idempotent `markOrderPaid`, local test-payment mode for development and CI.
- Accounts: email/password and Google sign-in, forgot/reset password.
- Reviews: verified-purchase reviews from delivered orders, shown on product pages and the homepage.
- Admin: dashboard (KPIs, 14-day revenue chart, low stock), order management with courier/AWB and
  customer emails, product management, coupons, custom requests and contact inbox.
- Emails via Resend (order confirmation, status updates, password reset, store notifications) with a
  dev outbox fallback.
- Security: Postgres-backed rate limiting, honeypots, security headers, admin role re-checked in the
  database, allow-listed image hosts, production env validation at boot.
- Tooling: Prettier, ESLint, Vitest (19 tests), Playwright (15 tests), GitHub Actions CI,
  Dependabot, PR template, documentation and ADRs in `docs/`.
