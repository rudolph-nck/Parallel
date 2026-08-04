# Sprint Zero risk register

Prepared: 2026-08-03

| Risk | Severity | Present evidence | Required control | Release gate |
| --- | --- | --- | --- | --- |
| Cross-tenant data leakage | Critical | Demo fallback and incomplete membership model | Mandatory tenant membership, scoped credentials, adversarial isolation tests | Before multi-user pilot |
| Excessive provider permissions | Critical | Calendar read/write included in the base connection | Read-only initial scopes, separate action grants, permission inventory | Before observation pilot |
| Browser credential exposure | Critical | MSAL token cache uses local storage | Server-side credential broker and short-lived tokens | Before background work |
| Model hallucination becomes action | Critical | Model selects tools and supplies arguments | Deterministic policy, validation, evidence, action registry | Before any new write |
| Duplicate action | High | Partial unique keys, no universal action identity | Stable idempotency and verified replay behavior | Before webhooks or retries |
| Incorrect owner | High | Labels and inferred roles remain | Canonical person resolution and explicit acceptance | Before multi-user actions |
| Stale/wrong document | High | Search relevance is not authority | Freshness, approval status, provenance, attendee access | Before knowledge packs |
| Webhook/subscription failure | High | No background infrastructure | Renewal, delta reconciliation, health checks, dead letters | Before proactive monitoring |
| Runaway model/voice cost | High | Usage recorded, budgets absent | Versioned rates, hard limits, dormant workflows, cache/batch | Before pilot expansion |
| Orphaned voice session | High | Lifecycle split across browser/prompt | Authoritative session controller and cleanup eval | Before voice pilot |
| False success claim | High | Tool results vary by workflow | Typed verified outcome envelope | Before additional actions |
| Prompt/provider lock-in | Medium | Large Ara prompt and direct Graph-shaped flows | Stable behavior modules and connector contracts | During refactor |
| Audit gaps | High | Records do not reconstruct full chain | Correlated append-oriented ledger | Before consequential actions |
| Memory boundary leakage | Critical | Namespace model lacks full purpose/retention | Typed scopes, consent, retention, deletion tests | Before personal coaching |
| Emotional overreach | High | Warm accountability without dedicated consent policy | Non-diagnostic language, opt-in coaching, dependency/manipulation evals | Before proactive coaching |
| Desktop-agent overreach | Critical | Schema exists; executor absent | Signed allowlisted protocol, visible control, emergency stop | Before desktop prototype |
| Misleading ROI | High | Usage activity can be mistaken for value | Evidence-backed impact, negative impact deductions | Before executive reporting |
| Accessibility exclusion | High | Partial support only | Journey-level accessible equivalents | Before external pilot |
| Demo reset enters production | High | Release fingerprint resets relationship | Environment-scoped demo policy and production test | Before pilot deployment |
| UI calm hides failure | Medium | Silence is a design goal | Explicit degraded states and safe next action | Every release |

## Highest-priority mitigation order

1. Separate demo and production identity/memory behavior.
2. Separate observation access from action authority.
3. Add deterministic policy and action contracts.
4. Secure credentials for background execution.
5. Add universal evidence, idempotency, and audit envelopes.

