# Parallel model-routing plan

Updated: 2026-08-01

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

The deterministic router is live. Policy checks use Tier A, focused classification uses Tier B, voice uses Tier C with `gpt-realtime-2.1`, and Tier D is reserved for high ambiguity, risk, or low confidence. Realtime usage is recorded in D1 after session closure.

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

The product shows measured tokens and weighted usage units without inventing a dollar estimate in the client. Pricing belongs in a server-side, versioned rate table because prices change. A later reconciliation job will calculate cost using the rate version active at request time.

## Rollout

1. Instrument the fixed Realtime route.
2. Add evals for quality, latency, and tool correctness.
3. Introduce a deterministic policy function with a shadow decision log.
4. Compare shadow choices against the fixed route.
5. Enable one low-risk utility route at a time.
