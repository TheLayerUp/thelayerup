# Contributing

Thanks for helping build TheLayerUp. This is a private repository; these are the house rules.

## Workflow

1. Set up locally: [docs/development.md](docs/development.md).
2. Branch from `main`: `feat/<short-name>`, `fix/…`, `docs/…`, `chore/…`.
3. Make the change. Keep PRs small and focused.
4. Run `npm run check`; for anything user-facing also `npm run test:e2e`.
5. Commit with [Conventional Commits](https://www.conventionalcommits.org/):
   `feat: add wishlist`, `fix(checkout): keep coupon after address change`.
6. Open a PR — fill in the template. CI must pass; review the Vercel preview.
7. Squash-merge into `main`. Production deploys automatically.

## Standards

- **Structure & imports:** follow [docs/architecture.md](docs/architecture.md#folder-structure).
  Server-only code lives in `src/server/` and imports `"server-only"`.
- **Style:** Prettier + ESLint are the source of truth (`npm run format`).
- **Security:** every Server Action validates input with zod and checks the session
  (`getSession` / `assertAdmin`). Customer queries are scoped by `userId`.
- **Money:** integer rupees; prices computed on the server ([ADR-0004](docs/adr/0004-money-as-integer-rupees.md),
  [ADR-0005](docs/adr/0005-server-side-pricing.md)).
- **Database:** every schema change ships with a migration and stays compatible with the running
  version ([docs/data-model.md](docs/data-model.md#migrations)).
- **Tests:** pure rules get unit tests; user-visible flows get Playwright coverage.
- **Docs:** update `docs/` in the same PR; add an ADR for significant decisions; note user-visible
  changes in `CHANGELOG.md`.
- **Secrets:** never commit `.env` or keys. New env vars go in `.env.example`,
  `src/server/env.ts` (if required) and `docs/configuration.md`.
