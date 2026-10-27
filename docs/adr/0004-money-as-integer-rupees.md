# 0004. Store money as integer rupees

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

Floats can't represent money exactly (0.1 + 0.2). Prices in this store are whole rupees; Razorpay expects paise.

## Decision

All money columns are `Int` rupees. Percentage discounts round **down** to a whole rupee. Conversion to paise happens in exactly one function, `toPaise()`, which throws on non-integers.

## Consequences

No rounding drift between cart, order, email and Razorpay. If paise-level pricing is ever needed (e.g. GST breakdown), switch to integer paise — not floats or Decimal — in a dedicated migration.
