# ADR 0003: Model routing and cost governance

Status: Accepted  
Date: 2026-08-01

## Decision

Parallel routes work through four explicit tiers:

- Tier A: deterministic rules and policy checks, no model.
- Tier B: efficient classification and extraction.
- Tier C: realtime conversation and voice.
- Tier D: deep reasoning only for high impact, high ambiguity, or low confidence.

The router returns a tier, logical/actual model, reason, and escalation flag. Voice sessions record tokens, audio tokens, latency, tier, and model in a tenant-scoped ledger. The UI reports weighted usage units rather than presenting a potentially stale dollar estimate; pricing reconciliation will use a server-side, versioned rate table.

## Consequences

- Premium reasoning is never the silent default.
- Cost can be attributed by tenant, user, AI employee, task, and session.
- Route-quality evals must pass before a route becomes autonomous.
