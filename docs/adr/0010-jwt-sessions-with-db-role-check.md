# 0010. JWT sessions, with the admin role re-checked in the database

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

Auth.js requires JWT sessions for the credentials provider. A JWT carries the role from sign-in time, so demoting an admin wouldn't take effect until the token expires.

## Decision

Use JWT sessions for speed, and in `requireAdmin()` / `assertAdmin()` additionally read the user's role from the database (memoised per request).

## Consequences

One indexed lookup per admin request; immediate revocation of admin access. Customer pages don't pay this cost.
