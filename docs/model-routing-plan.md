# Parallel model-routing plan

Updated: 2026-07-31

## Principle

Route work by latency, modality, risk, and complexity. A premium model is not the default reward for every request; it is a governed resource used when the task needs it.

## Proposed tiers

| Tier | Purpose | Examples |
| --- | --- | --- |
| A — deterministic | No model | permission checks, lifecycle transitions, date rules, idempotency, cost arithmetic |
| B — fast utility | low-cost text model | classification, extraction, short drafting, transcript cleanup |
| C — conversational | realtime voice model | live Ara conversation, interruption-sensitive clarification, spoken briefings |
| D — deep reasoning | premium reasoning model | ambiguous strategy, consequential planning, cross-source synthesis, escalation |

## Current routing record

Voice currently routes to `gpt-realtime-2.1` with low reasoning. Sprint 1 labels this route `voice_reasoning` and records the actual model ID and returned usage. No automatic model switching is added until session closure is reliable.

## Routing inputs

- required modality;
- expected latency;
- tool and approval risk;
- ambiguity/complexity score;
- tenant policy and spend limits;
- prior eval performance;
- requested quality override.

## Required usage ledger fields

- tenant, person, user account, AI employee, session/job IDs;
- provider and model ID;
- route/tier;
- input, cached input, output, audio, and total tokens when returned;
- estimated and reconciled cost;
- latency, tool count, outcome, and close reason.

## Cost calculation

Sprint 1 stores provider usage without inventing a dollar estimate in the client. Pricing belongs in a server-side, versioned rate table because prices change. A later reconciliation job should calculate cost using the rate version active at request time.

## Rollout

1. Instrument the fixed Realtime route.
2. Add evals for quality, latency, and tool correctness.
3. Introduce a deterministic policy function with a shadow decision log.
4. Compare shadow choices against the fixed route.
5. Enable one low-risk utility route at a time.
