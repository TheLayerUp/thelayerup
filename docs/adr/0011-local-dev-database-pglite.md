# 0011. PGlite for local development

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

The dev machine has no Docker or Postgres, and `prisma dev` needs a newer Node. Developers should be able to start in minutes.

## Decision

`npm run db:local` runs PGlite (Postgres compiled to WASM) behind a TCP socket on port 5433, data in `./.pglite`. The connection string uses `pgbouncer=true` and `connection_limit=1` because PGlite multiplexes connections into one session. CI and production use real Postgres 16.

## Consequences

Zero-install local DB. It is single-process and not for production. Behaviour differences are caught by CI, which runs against real Postgres.
