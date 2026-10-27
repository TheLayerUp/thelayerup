# 0012. Local test-payment mode

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

Contributors and CI need to run the full checkout without Razorpay credentials or network access to Razorpay.

## Decision

When no Razorpay keys are configured **and** `NODE_ENV !== "production"`, checkout shows a banner and a *Place test order* button that marks the order paid through the same `markOrderPaid()` path. In production, missing keys stop the server from booting, so this mode can never reach customers.

## Consequences

CI's E2E suite covers the whole order lifecycle offline. Locally, setting Razorpay test keys switches the same tests to the real Razorpay test checkout.
