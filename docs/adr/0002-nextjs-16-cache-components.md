# 0002. Next.js 16 App Router with Cache Components

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

We need SEO-friendly, fast product pages, a logged-in account area and an admin, built by a very small team. The original plan said Next.js 15; the project was scaffolded on 16 with `cacheComponents` and Partial Prefetching on.

## Decision

Keep Next.js 16 with Cache Components. Public data is read through `"use cache"` functions tagged for invalidation; per-user and URL data streams inside `<Suspense>`. Server Actions are the write API — no separate REST layer.

## Alternatives considered

Next 15 with the older caching model (being phased out); a separate API server (more moving parts for no benefit at this size); Shopify (less control over custom-print workflow and brand, ongoing fees).

## Consequences

Pages get an instant static shell and personal data streams in. The trade-off is discipline: session/URL reads must sit inside Suspense, and `Date.now()`/random values need `connection()` — the dev overlay and build enforce this. One codebase, one deploy.
