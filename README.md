# TheLayerUp

E-commerce store for 3D printed products — **https://thelayerup.in**

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Prisma + PostgreSQL · Auth.js · Razorpay · Resend

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

## What it does

- **Storefront:** catalogue with search and filters, product pages with verified reviews, cart,
  Razorpay checkout (UPI, cards, net banking, wallets), coupons, order tracking, custom-print requests,
  light/dark theme, SEO.
- **Accounts:** email/password or Google sign-in, password reset, order history, saved addresses.
- **Admin:** sales dashboard, order fulfilment (status, courier, AWB, customer emails), products,
  coupons, custom requests and messages.

Full list: [docs/features.md](docs/features.md).

## Quick start

```bash
npm install
cp .env.example .env        # set AUTH_SECRET (npx auth secret); add Razorpay test keys if you have them
npm run db:local            # terminal 1: local Postgres (PGlite) on :5433
npm run db:migrate && npm run db:seed
npm run dev                 # http://localhost:3000 — admin login is SEED_ADMIN_* in .env
```

Requires Node 22 (Node 20.11+ works) and Google Chrome for end-to-end tests. Details:
[docs/development.md](docs/development.md).

## Quality

```bash
npm run check       # lint + types + formatting + unit tests
npm run test:e2e    # Playwright: storefront, checkout (incl. Razorpay test payment), auth, admin
```

Both run in GitHub Actions on every push and pull request. See [docs/testing.md](docs/testing.md).

## Documentation

| | |
|---|---|
| [Features](docs/features.md) | Every page and admin tool |
| [Architecture](docs/architecture.md) | Folder structure, layers, caching, request flows |
| [Data model](docs/data-model.md) | Schema, money rules, order lifecycle |
| [Payments](docs/payments.md) | Razorpay flow, guarantees, going live |
| [Security](docs/security.md) | Threats and controls |
| [Configuration](docs/configuration.md) | Every environment variable and setting |
| [Development](docs/development.md) | Setup, scripts, conventions |
| [Testing](docs/testing.md) | Unit, E2E, manual release checklist |
| [Deployment](docs/deployment.md) | Vercel + Neon + Resend + Razorpay, releases, rollback |
| [Operations](docs/operations.md) | Daily order handling, refunds, incidents |
| [Decisions (ADRs)](docs/adr/README.md) | Why things are the way they are |
| [Roadmap](docs/roadmap.md) | Status, launch checklist, what's next |

## Project layout

```
src/app/         routes (storefront, auth, admin, api)
src/components/  ui primitives + feature components
src/server/      server-only: actions, queries, services, payments, auth, db, email
src/lib/         pure shared logic (pricing, validators, utils)
src/config/      site settings, image hosts
prisma/          schema, migrations, seed
e2e/             Playwright tests
docs/            documentation
```

More in [docs/architecture.md](docs/architecture.md). Contributing: [CONTRIBUTING.md](CONTRIBUTING.md).
Security issues: [SECURITY.md](SECURITY.md).

© TheLayerUp. All rights reserved.
