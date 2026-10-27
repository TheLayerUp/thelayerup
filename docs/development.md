# Development guide

## Prerequisites

- **Node.js 22 LTS** recommended (`.nvmrc`). Node 20.11+ works for the app; Prisma 7 and `prisma dev`
  need ≥ 20.19.
- Google Chrome (used by the Playwright tests — no separate browser download).
- No Docker or Postgres install needed: local dev uses PGlite (embedded Postgres).

## First-time setup

```bash
npm install                    # also runs prisma generate
cp .env.example .env           # then set AUTH_SECRET (npx auth secret)
                               # and Razorpay *test* keys if you want the real checkout

npm run db:local               # terminal 1 — Postgres on 127.0.0.1:5433, data in ./.pglite
npm run db:migrate             # terminal 2
npm run db:seed
npm run dev                    # http://localhost:3000
```

Sign in at `/login` with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` and open `/admin`.

## Scripts

| Script | Purpose |
|---|---|
| `dev` | Next.js dev server (Turbopack) |
| `build` / `start` | Production build / server |
| `vercel-build` | `prisma migrate deploy && next build` (Vercel) |
| `lint` · `typecheck` · `format` · `format:check` | ESLint · route typegen + `tsc --noEmit` · Prettier write / check |
| `test` · `test:watch` | Vitest unit tests |
| `test:e2e` · `test:e2e:ui` | Playwright end-to-end tests (headless / interactive UI) |
| `check` | lint + typecheck + format check + unit tests — run before every PR |
| `db:local` · `db:migrate` · `db:seed` · `db:studio` | Local DB, apply migrations, seed, Prisma Studio |
| `art:generate` | Regenerate placeholder product SVGs from `prisma/data/catalog.ts` |

## Useful local tools

- **Emails:** without `RESEND_API_KEY`, every email is appended to `.dev-outbox/outbox.jsonl` (and
  logged). Password-reset links are also printed in the server log.
- **Prisma Studio:** `npm run db:studio` to browse/edit data (e.g. clear `RateLimit` rows if you
  locked yourself out — all local traffic shares one IP).
- **Reset the DB:** stop `db:local`, delete `./.pglite`, start it, then migrate + seed.

## Conventions

### Code style
- TypeScript strict. Prettier (120 cols, Tailwind class sorting) + ESLint (`next/core-web-vitals`,
  React Compiler rules). Run `npm run format` before committing.
- Components: `PascalCase.tsx`, one main component per file, default export. UI primitives in
  `components/ui` are lowercase (shadcn style).
- Server modules start with `import "server-only"`. Server Actions files start with `"use server"`.
- Comments explain *why*, not what.

### Where does new code go?

| You're adding… | Put it in |
|---|---|
| A page | `src/app/(storefront)/<route>/page.tsx` (or `admin/…`) |
| A mutation | a function in `src/server/actions/<area>.ts`: validate with zod → check session → write → `updateTag`/`revalidatePath` |
| A cached read | `src/server/queries/*.ts` with `"use cache"`, `cacheLife`, `cacheTag` |
| Business logic | `src/server/services/*`; pure rules in `src/lib/*` with a `*.test.ts` next to them |
| A reusable visual element | `src/components/ui` |
| A feature component | `src/components/<feature>/` |
| A constant / setting | `src/config/*` |
| A new env var | `.env.example`, `src/server/env.ts` (if required), `docs/configuration.md` |

### Next.js 16 rules that bite (Cache Components)
- Anything reading cookies/headers/session must sit inside `<Suspense>` — use `getSession()` (it
  calls `connection()` first).
- Read `params` / `searchParams` inside a child component wrapped in `<Suspense>`, not at the top of
  the page.
- Client components that call `usePathname()`/`useSearchParams()` in a shared layout need a
  `<Suspense>` boundary (see `NavLinks` in `Navbar.tsx`).
- `Date.now()` / `Math.random()` in render need `connection()` or `"use cache"`; React's purity
  lint also flags them in component bodies — move them into a helper function.
- Use `updateTag()` in Server Actions (read-your-own-writes) and `revalidateTag(tag, "max")`
  elsewhere.
- Local docs for this Next.js version: `node_modules/next/dist/docs/`.

### Money and data
- Rupees as integers everywhere; `formatPrice()` for display; `toPaise()` only for Razorpay.
- Never trust client prices — re-price with `priceCart()`.
- Scope every customer query by `userId`.

## Git workflow

1. Branch from `main`: `feat/…`, `fix/…`, `docs/…`, `chore/…`.
2. Commit messages: [Conventional Commits](https://www.conventionalcommits.org/) (`feat: add wishlist`).
3. `npm run check` and, for user-facing changes, `npm run test:e2e`.
4. Open a PR (template in `.github/`); CI must be green; Vercel posts a preview URL.
5. Squash-merge. Production deploys from `main`.
