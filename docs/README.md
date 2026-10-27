# TheLayerUp — Documentation

Everything needed to understand, run, change, test, deploy and operate the TheLayerUp store
(**https://thelayerup.in**).

| If you want to… | Read |
|---|---|
| See what the product does, page by page | [Features](features.md) |
| Understand how the code is organised and how a request flows | [Architecture](architecture.md) |
| Understand the database, money and order lifecycle | [Data model](data-model.md) |
| Understand checkout, Razorpay and the webhook | [Payments](payments.md) |
| Know what protects the store and customer data | [Security](security.md) |
| Look up an environment variable | [Configuration](configuration.md) |
| Set up a laptop and start coding | [Development guide](development.md) |
| Run or write tests | [Testing](testing.md) |
| Ship to production | [Deployment](deployment.md) |
| Handle day-to-day orders, refunds and incidents | [Operations runbook](operations.md) |
| Know *why* something was built the way it was | [Architecture decision records](adr/README.md) |
| See what's next | [Roadmap](roadmap.md) · [Original product plan](product-plan.md) |

## The 60-second tour

- **Stack:** Next.js 16 (App Router, Cache Components, Server Actions) · React 19 · TypeScript ·
  Tailwind CSS 4 · Prisma 6 + PostgreSQL (Neon) · Auth.js v5 · Razorpay · Resend · Vercel.
- **Shape:** one Next.js app. Pages render on the server, catalogue data is cached and tagged,
  personal data streams in behind `<Suspense>`. All writes go through Server Actions in
  `src/server/actions/`, which validate input with zod and check the session.
- **Money:** whole rupees as integers. The server re-prices every cart at checkout — the browser
  only says *which* products and *how many*.
- **Payments:** Razorpay Checkout. A payment is confirmed by signature (client) **or** webhook,
  whichever arrives first; confirmation is idempotent and updates stock in the same transaction.
- **Quality gates:** ESLint, TypeScript, Prettier, 19 unit tests (Vitest), 15 end-to-end tests
  (Playwright, including a real Razorpay test payment), all in GitHub Actions CI.

## Glossary

| Term | Meaning |
|---|---|
| **Order number** | Customer-facing reference like `TLU-7K3QX9` (no 0/O/1/I to avoid misreads). |
| **Pending order** | Created when the customer clicks *Pay*; becomes `PAID` only after payment is verified. Abandoned ones stay `PENDING` and are hidden from admin by default. |
| **Snapshot** | Copy of address / product name / price stored on the order so later edits don't change history. |
| **Test-payment mode** | Local-only fallback when no Razorpay keys are set; marks orders paid without charging. Disabled in production. |
| **Cache tag** | Label on cached data (`products`, `categories`, `reviews`, `product:<slug>`) used to refresh it after admin edits or payments. |
| **AWB** | Air waybill — the courier's tracking number. |
| **Dev outbox** | `.dev-outbox/outbox.jsonl` — where emails go when `RESEND_API_KEY` is not set (dev/CI only). |
