## What & why

<!-- One or two sentences. Link the issue if there is one. -->

## How it was tested

- [ ] `npm run check` (lint, types, format, unit tests)
- [ ] `npm run test:e2e` — or explain why not
- [ ] Tried it in the browser (desktop + mobile width)

## Checklist

- [ ] New env vars added to `.env.example`, `src/server/env.ts` (if required in prod) and `docs/configuration.md`
- [ ] Schema change has a migration in `prisma/migrations/` and is backwards compatible with the running app
- [ ] Money stays in whole rupees; prices are computed on the server
- [ ] New server actions check auth (`getSession` / `assertAdmin`) and validate input with zod
- [ ] Docs updated (`docs/`), and an ADR added for any significant decision
