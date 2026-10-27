# 0009. No automatic linking of Google sign-in to password accounts

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

Email/password sign-up doesn't verify the email address. With automatic linking, an attacker could register `victim@gmail.com` with a password, and when the real owner later signs in with Google, the accounts merge and the attacker retains access.

## Decision

Google provider without `allowDangerousEmailAccountLinking`. If an email already has a password account, Google sign-in is refused with a clear message to use the password (or reset it).

## Consequences

Slight friction for the rare user who uses both methods. Revisit once sign-up emails are verified.
