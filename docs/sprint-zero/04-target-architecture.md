# Target architecture

Prepared: 2026-08-03

## Logical component diagram

```text
Experience
  Today · Ara Canvas · Voice · Evidence · Approval · Accessible alternatives
                                  │
Conversation and Relationship
  Session Lifecycle · Ara Identity · First Meeting · Work Rhythm · Channel Handoff
                                  │
Intelligence
  Attention · Decision Preparation · Accountability · Recall · Model Router
                                  │
Trust
  Identity · Tenant Membership · Policy · Authority · Memory Boundaries
  Action Registry · Ownership · Audit Ledger
                                  │
Events and Workflows
  Event Gateway · Normalization · Deduplication · Durable Workflow Runtime
  Timers · Approvals · Retry · Compensation · Dead Letters
                                  │
Connectors and Execution
  Microsoft Graph · Future Ticketing · Communication Channels · Desktop Agent
                                  │
Data and Operations
  D1 Operational Store · Credential Vault · Evidence · Cost · Impact · Telemetry
```

## Deployment model

```text
Browser / future mobile
  ├─ signed user session
  ├─ microphone and accessible text path
  └─ no durable provider credentials

Edge application
  ├─ experience and API gateway
  ├─ conversation/session control
  ├─ policy and action registry
  └─ tenant-scoped reads and writes

Background execution plane
  ├─ webhook intake
  ├─ subscriptions and delta reconciliation
  ├─ durable queues and workflows
  └─ model tasks that wake only when needed

Managed data plane
  ├─ D1 operational state
  ├─ encrypted credential vault
  ├─ append-oriented audit/evidence
  └─ metrics, cost, and impact
```

The demo may share deployment units. The logical boundaries are mandatory even before services are split physically.

## Canonical event flow

```text
Provider or user event
→ authenticate and assign tenant/user
→ normalize provider payload
→ deduplicate by stable source identity
→ attach evidence and freshness
→ deterministic policy/context filter
→ route only ambiguous work to a model
→ prepare recommendation or allowed action
→ wait for required human authority
→ execute through an allowlisted adapter
→ verify provider result
→ record audit, memory, ownership, cost, and impact
→ present the least disruptive truthful outcome
```

## Trust boundaries

1. **User boundary:** voice and UI input are intent, never automatic authority for unrelated actions.
2. **Tenant boundary:** every record and query carries tenant identity derived from membership.
3. **Model boundary:** model output is untrusted interpretation until validated and authorized.
4. **Connector boundary:** provider payloads never enter decision logic without normalization.
5. **Credential boundary:** provider credentials never enter model context or durable browser storage.
6. **Execution boundary:** only registered actions with validated inputs can execute.
7. **Memory boundary:** personal, organizational, shared-scoped, session, and temporary memory remain distinct.
8. **Device boundary:** future desktop actions require enrolled devices and signed requests.

## Identity and tenant model

- `tenant`: an organization and its governing policy boundary;
- `person`: a human identity inside one tenant;
- `user_account`: an authenticated login linked to a person;
- `ai_employee`: Ara or a future role-based coworker;
- `role` and `relationship`: responsibilities, reporting, and authority context;
- `membership`: explicit proof that an account belongs to a tenant;
- `session` and `workflow`: temporary execution identities;
- `action_owner`: the one canonical accountable person/AI pair.

Provider identities are linked records, not the platform's primary identity.

## Memory boundaries

Every memory record requires:

- owner and tenant;
- scope: session, personal, organizational, role, shared-scoped, or temporary;
- purpose and permitted use;
- source and evidence;
- sensitivity;
- confidence or declared-truth status;
- consent state;
- created, reviewed, and expiration timestamps;
- correction and deletion path.

Declared user preferences outrank learned behavior. Personal coaching never enters organizational records without explicit sharing.

## Policy and authority

Trust progresses through:

`OBSERVE → RECOMMEND → PREPARE → CONFIRM_AND_ACT → GUARDED_ACTION → DELEGATED`

Every registered action declares:

- schema and validator;
- risk class;
- required trust stage;
- required permission and authority;
- preview/evidence contract;
- idempotency key;
- executor;
- verification rule;
- undo or compensation behavior;
- audit fields.

The policy hierarchy is regulation → tenant policy → company constitution → department → role → user grant → preference → learned behavior.

## Model routing

- Tier A: deterministic filters, permissions, identity, deduplication, time math.
- Tier B: bounded classification and extraction from normalized inputs.
- Tier C: realtime conversation and standard recommendation drafting.
- Tier D: high-ambiguity or high-impact synthesis after policy permits it.

All routes use the same Ara behavior contract. Every call records purpose, evidence scope, sensitivity, route, latency, usage, cost, confidence, and outcome impact. A cheaper route wins when quality remains trustworthy.

## Connector abstraction

Connectors expose provider-neutral capabilities such as:

- observe communications;
- inspect availability;
- resolve people;
- find authorized knowledge;
- prepare and execute a calendar action;
- retrieve a meeting transcript;
- publish an approved artifact;
- send an approved communication.

Provider-specific IDs and payloads remain inside adapters. Canonical events and action results cross the boundary.

## Workflow runtime

Workflows are durable state machines that can wait without an open model session. Required primitives include correlation, lease, next wake time, approval wait, callback, retry policy, idempotency, compensation, timeout, cancellation, and dead-letter state.

## Audit model

The reconstructable chain is:

`source event → evidence → inference → policy decision → authority → action request → provider result → verification → user-visible result → correction/undo`

Audit views must be useful to both the user and an authorized administrator without exposing private coaching content.

## Cost telemetry

Cost is attributed by tenant, user, Ara instance, workflow, task, model/provider, connector, and outcome. Budgets are deterministic. Impact subtracts review, correction, false interruption, duplicate work, and recovery cost.

