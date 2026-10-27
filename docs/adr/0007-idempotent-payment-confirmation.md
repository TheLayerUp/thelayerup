# 0007. Idempotent payment confirmation from two paths

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

Razorpay reports success to the browser (handler callback) and, separately, to our webhook. Customers close tabs; webhooks retry; both can arrive at once.

## Decision

Both paths call `markOrderPaid()`, which in one transaction does a conditional update `PENDING → PAID` and, only if it won, decrements stock and increments coupon usage. The browser path verifies the payment signature; the webhook verifies the HMAC of the raw body and that the amount matches.

## Consequences

An order is paid exactly once regardless of ordering or retries. Stock is not reserved before payment, so two buyers can rarely oversell the last unit (documented gap).
