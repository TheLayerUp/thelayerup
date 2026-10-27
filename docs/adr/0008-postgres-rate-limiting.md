# 0008. Rate limiting in Postgres

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

Login, sign-up, password reset, forms and order tracking need abuse protection. On serverless, in-memory counters don't work (many short-lived instances). Redis (Upstash) would add another service and account.

## Decision

A `RateLimit` table with fixed-window counters updated atomically via `INSERT … ON CONFLICT … RETURNING`. Keys combine action + IP (and account for login/reset). Expired rows are swept opportunistically. If the limiter errors it fails **open**.

## Consequences

No new infrastructure; correct across instances. Adds one small write per protected request — fine at this scale. Move to Upstash/Redis if traffic grows large.
