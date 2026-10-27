# 0001. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

The store will be maintained over years, possibly by people who weren't here when choices were made. Code shows *what*; it rarely shows *why* or what was rejected.

## Decision

Keep short Architecture Decision Records in `docs/adr/`, numbered, one decision each, using Context → Decision → Consequences. Never rewrite an accepted ADR; supersede it with a new one.

## Consequences

Small overhead per significant change (the PR template asks for it). New contributors can learn the reasoning without archaeology.
