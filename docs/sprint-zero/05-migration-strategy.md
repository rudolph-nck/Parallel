# Migration strategy

Prepared: 2026-08-03

## Classification

| Area | Decision | Why | Safe next move |
| --- | --- | --- | --- |
| Visual identity and motion | Preserve | Strongly aligned with Silence in Motion | Add truthful state bindings and reduced-motion equivalents |
| Ara conversation canvas | Preserve and refine | Correct primary surface | Limit it to current conversation, evidence, and decisions |
| Today view | Preserve and simplify | Correct home for orientation | Remove pressure, unsupported claims, and prototype clutter |
| Realtime WebRTC proof | Wrap | Valuable capability, currently coupled | Place behind channel-independent conversation runtime |
| Conversation lifecycle helpers | Refactor | Good invariants, split ownership | Make server-side lifecycle authoritative |
| Realtime master prompt | Refactor | Rich product behavior, too many responsibilities | Separate Ara identity, journey policy, tool contracts, and task context |
| Main page orchestration | Refactor incrementally | Working but too large | Extract first meeting, voice, canvas, approval, and Microsoft controllers |
| Microsoft connector | Wrap then refactor | Broad real capability | Split read, write, transcript, knowledge, and identity adapters |
| Browser Microsoft tokens | Replace | Cannot support safe background work | Server-side credential broker with short-lived delegated access |
| D1 schemas | Preserve and migrate | Useful primitives already exist | Add canonical relationships, retention metadata, workflow and ledger tables |
| Demo identity fallback | Defer only in explicit demo | Useful for private demonstrations | Fail closed in pilot/production modes |
| Release-aware onboarding reset | Preserve for demo only | Useful demo tool, wrong production behavior | Put behind explicit environment policy |
| Model router | Refactor | Correct tiers, incomplete execution | Add real adapters, budgets, evaluation, and price table |
| Foreground attention snapshot | Preserve as fallback | Evidence-based and useful | Feed normalized events from background subscriptions |
| Meeting/transcript helpers | Preserve and wrap | Useful domain behavior | Move into durable meeting lifecycle workflow |
| Recall search | Refactor | Real search, incomplete authority/freshness | Add evidence envelope and source authority ranking |
| Ownership schema | Refactor | Correct direction, labels remain | Canonical people, acceptance, delegation, and shared action registry |
| Desktop request schema | Defer | Correctly non-executing | Resume after threat model, device trust, and action registry |
| ServiceNow demo surface | Defer | No real connector | Select first ticketing source during pilot planning |

## Migration sequence

### 1. Experience foundation

Preserve the look. Correct the first journey, understanding canvas, contextual permissions, and demo/production memory distinction.

### 2. Trust foundation

Introduce explicit trust stages, action registry, policy decisions, evidence envelopes, and typed results before adding background writes.

### 3. Identity and memory foundation

Make tenant membership mandatory, join ChatGPT and Microsoft identities, remove production fallback, and add complete memory metadata.

### 4. Connector boundary

Move Graph calls behind provider-neutral services. Separate observation scopes from write scopes.

### 5. Event and workflow foundation

Add Graph subscription intake, delta reconciliation, normalization, deduplication, durable workflows, retries, and dead letters.

### 6. Flagship workflow

Run communication overload in shadow/read-only mode, prepare two evidence-backed decisions, collect feedback, then enable reviewed actions.

### 7. Pilot hardening

Add tenant isolation attacks, operational monitoring, retention/deletion, budget enforcement, incident response, accessibility, and administrator controls.

## Rewrite decision

A ground-up rewrite is rejected. The current product proves voice, Microsoft access, calendar behavior, persistence, and visual direction. Incremental wrapping and extraction can preserve those gains while replacing unsafe boundaries.

