# 0003. Prisma 6 (not 7/8) while the dev machine runs Node 20.11

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

Prisma 7+ requires Node ≥ 20.19 and its local `prisma dev` server needs Node ≥ 22.5. The primary development machine runs Node 20.11. A Prisma 8 release candidate had been installed and could not run.

## Decision

Pin Prisma CLI and client to 6.19.x with the classic `prisma-client-js` generator and `url`/`directUrl` in `schema.prisma`. CI and Vercel use Node 22.

## Consequences

Everything works today on all machines. A future migration to Prisma 7 (`prisma.config.ts`, driver adapters) is needed after upgrading local Node — tracked in the roadmap. Dependabot ignores Prisma major updates so this happens deliberately.
