# Security policy

## Reporting a vulnerability

Please email **hello@thelayerup.in** with the subject "Security" and include steps to reproduce.
Do not open a public issue. We aim to acknowledge reports within 3 working days.

Please don't test against real customer accounts or place real orders; use your own test account.

## Scope

- https://thelayerup.in and its `/api/*` endpoints
- This repository

Payments are processed by Razorpay; card and UPI data never touch our servers. Issues in Razorpay
itself should go to [Razorpay](https://razorpay.com/security/).

How the store is protected is documented in [docs/security.md](docs/security.md).
