# 0005. The server prices every cart

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

The cart lives in the browser (localStorage) for speed and guest browsing. Anything from the browser can be edited by the user.

## Decision

The browser sends only product IDs and quantities. `priceCart()` reads live prices, stock, coupon rules and shipping from the database on every quote and again when the order is created. If anything changed since the shopper last saw the totals, checkout stops and shows the new totals instead of charging.

## Consequences

Price tampering is impossible and stale carts are corrected. Costs one DB round trip per quote — negligible.
