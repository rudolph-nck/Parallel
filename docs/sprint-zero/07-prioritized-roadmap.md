# Prioritized roadmap

Prepared: 2026-08-03

Complexity: S, M, L, XL.

## Demo foundation

### D1 — Canon-led first experience

- **Outcome:** The person meets Ara before setup and feels understood before access is requested.
- **Canon:** Design 03–05; UX 01–03; Human 01–03, 14–15.
- **Dependencies:** Existing voice and onboarding lifecycle.
- **Acceptance:** No Microsoft entry gate; one opening; correctable understanding view; contextual connection explanation.
- **Tests:** Rendered journey, lifecycle repetition, reduced motion, screen reader labels.
- **Complexity:** M.
- **Security/cost:** No additional access or model calls.

### D2 — Trust-stage and action foundation

- **Outcome:** Ara can explain what she is allowed to do and cannot exceed it.
- **Canon:** Constitution V, VIII; Technical I, V, VI, XII; Architecture 12, 15.
- **Dependencies:** Action inventory and risk classification.
- **Acceptance:** Every live action receives a deterministic policy decision and stable idempotency key.
- **Tests:** Policy denial, replay, missing authority, prompt injection.
- **Complexity:** L.
- **Security/cost:** Highest security priority; rules-first and no model cost.

### D3 — Full Microsoft capability with governed authority

- **Outcome:** The initial connection grants the current operational capability set once while Parallel governs every action through explicit authority rules.
- **Canon:** UX 03–05; Technical V, XV.
- **Dependencies:** D2, connector split.
- **Acceptance:** Current mail, calendar, meeting, transcript, and document scopes are requested together; provider permission never bypasses policy, ownership, risk, or confirmation rules.
- **Tests:** Scope inventory, denied consent, revocation, read/write separation.
- **Complexity:** M.
- **Security/cost:** Purpose-bounded capability set, explicit admin review for future tenant-wide Teams/calling scopes, and no incremental model cost.

### D4 — Flagship decision rehearsal

- **Outcome:** Demo data shows Ara finding two judgment-required items, preparing evidence, and leaving the user clear.
- **Canon:** UX 07, 14, 22; Architecture 06–08, 18.
- **Dependencies:** D2, evidence envelope.
- **Acceptance:** Synthetic overload replay; one item at a time; no unsupported claims; calm completion.
- **Tests:** Expected decisions, false urgency, missing evidence, no-action outcome.
- **Complexity:** M.
- **Security/cost:** Synthetic data; route and cost captured.

## Pilot foundation

### P1 — Production identity and tenant isolation

- **Outcome:** Multiple users can safely use their own Ara.
- **Canon:** Technical VIII–IX, XV, XVII.
- **Dependencies:** Tenant membership and credential broker.
- **Acceptance:** No fallback identity; isolation attacks fail; provider identities are linked, not primary.
- **Tests:** Cross-tenant reads/writes, forged headers, revoked membership.
- **Complexity:** XL.
- **Security/cost:** Required before real multi-user data.

### P2 — Event and workflow runtime

- **Outcome:** Ara can stay quietly aware without an open conversation.
- **Canon:** Technical IV, X, XIV, XVIII–XIX; Architecture 05, 14.
- **Dependencies:** P1, credential broker.
- **Acceptance:** Graph subscription, delta reconciliation, deduplication, retry, dead letter, and durable waits.
- **Tests:** Duplicate delivery, expired subscription, outage, replay, timeout.
- **Complexity:** XL.
- **Security/cost:** Deterministic prefiltering and dormant models.

### P3 — Read-only attention and first earned insight

- **Outcome:** Ara surfaces one justified observation without creating pressure.
- **Canon:** UX 04–09; Human 04–05, 07–09.
- **Dependencies:** P2, evidence and policy.
- **Acceptance:** User-approved thresholds; progressive evidence; false-positive feedback; silence when safe.
- **Tests:** Manager message, outage from unknown sender, vacation, protected time.
- **Complexity:** L.
- **Security/cost:** Metadata-first, bounded retrieval, budgeted classification.

### P4 — Durable meeting lifecycle

- **Outcome:** Meetings arrive prepared and leave accountable work.
- **Canon:** UX 10–12; Architecture 10, 14, 17.
- **Dependencies:** P2, Recall authority, ownership.
- **Acceptance:** Approved source pack, transcript event, evidence timestamps, canonical owner, no duplicates.
- **Tests:** Old drafts, missing access, delayed transcript, unclear speaker, existing follow-up.
- **Complexity:** XL.
- **Security/cost:** Access checked for every source and destination.

### P5 — Cost, impact, and operational trust

- **Outcome:** Parallel proves value conservatively and exposes harm.
- **Canon:** Technical XIII, XX; Architecture 18–20.
- **Dependencies:** Event/action ledger.
- **Acceptance:** Budgets, versioned price table, verified/estimated separation, negative-impact deduction.
- **Tests:** Cost threshold, correction cost, false interruption, provider price change.
- **Complexity:** L.
- **Security/cost:** Privacy-safe aggregation and role-based rates.

## Enterprise foundation

- Tenant policy administration and retention.
- Multiple connectors with normalized contracts.
- Formal audit, security operations, disaster recovery, and incident response.
- Cross-user ownership, delegation, and multiple Ara coordination.
- Role-aware AI coworkers and performance evaluation.
- Private/on-premises deployment options.
- Signed local desktop companion after a completed threat model.
- Outbound calling through replaceable channel adapters.

Each enterprise capability requires isolation, policy, idempotency, failure, cost, and harm tests before release.

## Future AI workforce platform

- AI coworker manifests and marketplace.
- Human + AI organization graph.
- Governed shared organizational memory.
- Department constitutions and role policies.
- Evidence-based organizational digital twin.
- Shadow simulation and scenario planning.
- Cross-agent coordination through canonical ownership.

These remain deferred until the pilot foundations prove that Parallel can preserve Ara's character, human authority, and calm under real operational pressure.
