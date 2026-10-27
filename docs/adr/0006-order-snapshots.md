# 0006. Orders snapshot address and line items

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

Products get renamed, re-priced or archived; customers edit or delete saved addresses. Order history, invoices and courier labels must not change after purchase.

## Decision

Orders copy the shipping address into `ship*` columns and each `OrderItem` stores `productName`, `productImage` and `priceAtPurchase`. `OrderItem.productId` is nullable with `ON DELETE SET NULL`. The original plan's `Order → Address` foreign key was dropped.

## Consequences

History is immutable and self-contained. Slight duplication of data — intentional.
