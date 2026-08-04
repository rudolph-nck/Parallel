# Current-state architecture assessment

Prepared: 2026-08-03  
Repository state assessed at commit `4ed51d7`

## Repository and applications

Parallel is currently one repository and one deployed web application. It contains:

- a Next.js/React experience;
- a Cloudflare-compatible Worker entry point;
- server routes for OpenAI Realtime and the Parallel workspace;
- a browser-based Microsoft 365 connector;
- a D1/SQLite schema managed by Drizzle;
- deterministic helper modules for calendar windows, people resolution, ownership, meeting artifacts, first-day briefings, conversation lifecycle, model routing, and document templates;
- Node-based unit and rendered-output tests;
- architecture notes and ADRs from the prior implementation phase.

There is no mobile application, durable background worker, queue consumer, webhook receiver, local desktop companion, or production administrative console yet.

## Frameworks and runtime

| Area | Current implementation |
| --- | --- |
| Application | Next.js 16.2.6, React 19.2.6 |
| Build/runtime adapter | Vinext 0.0.50, Vite 8.0.13 |
| Edge runtime | Cloudflare Worker-compatible ESM |
| Database access | Drizzle ORM 0.45.2 |
| Database | Cloudflare D1 / SQLite |
| Microsoft identity | MSAL Browser 5.17.3 |
| Language | TypeScript 5.9.3 |
| Minimum Node version | 22.13 |
| Hosting | OpenAI Sites, private deployment |

## Deployment model

The application is built as a Cloudflare-compatible Worker with static assets. Sites owns the deployed D1 binding. The Worker injects the database binding into the application runtime and forwards requests to the Vinext handler.

The architecture is suitable for a private demo. It is not yet a complete background execution plane because durable schedules, queues, Graph subscription renewal, and webhook processing are absent.

## Database and storage

D1 stores tenant, person, user account, AI employee, ownership, onboarding, decision profiles, policy rules, memory, attention items, commitments, model invocations, audit events, meeting knowledge, work items, delegations, desktop requests, and outbound messages.

Strengths:

- the core records already carry tenant, person, user, and AI employee identity;
- source keys and unique indexes prevent some duplicate records;
- onboarding and first-day evidence survive browser changes;
- transcript-derived meeting knowledge is durable.

Gaps:

- several relationships are stored as labels or JSON rather than canonical identities;
- audit data is mutable application data rather than a hardened append-only ledger;
- memory lacks complete purpose, sensitivity, retention, and deletion metadata;
- there is no encrypted server-side Microsoft credential store;
- browser storage remains a fallback for profile and session receipts;
- no queue, lease, timer, dead-letter, or subscription state exists.

## Authentication and identity

Sites supplies authenticated ChatGPT identity headers. The platform route derives a tenant/user workspace when these headers are available. A documented single-owner demo fallback still exists.

Microsoft uses delegated browser authentication through MSAL. Microsoft access tokens are cached in browser local storage and attached to direct Graph requests.

Consequences:

- foreground Microsoft work can function in the signed-in browser;
- Ara cannot safely continue Graph work when the browser is closed;
- the demo fallback is not acceptable for multi-user use;
- ChatGPT identity and Microsoft identity are not yet joined through a production tenant membership model.

## Voice pipeline

The browser creates a WebRTC connection to OpenAI Realtime through a server-created session. The current route uses `gpt-realtime-2.1` with the Marin voice. Semantic turn detection, interruption, microphone state, transcript events, tool calls, usage collection, and lifecycle cleanup are coordinated in the main page and conversation helper.

Strengths:

- live interruption is supported;
- tool results are returned to the conversation;
- usage is accumulated;
- a deterministic lifecycle helper prevents several premature-close cases;
- one opening per session reduces repeated greetings.

Gaps:

- conversation behavior, tool definitions, and product policy remain concentrated in one large Realtime route;
- client coordination remains concentrated in a roughly 5,000-line page;
- closure safety is partly prompt-driven rather than owned entirely by a server-side lifecycle controller;
- the prompt is acting as a product runtime, policy description, and behavior specification at once;
- no channel-independent conversation runtime exists.

## Model usage

A four-tier logical router exists:

- Tier A: deterministic;
- Tier B: efficient utility;
- Tier C: realtime voice;
- Tier D: premium reasoning.

Voice usage is recorded in D1 as weighted usage units. Exact cost reconciliation and budget enforcement are not complete. Tier B and D are architectural labels rather than a mature set of independently executed background paths.

## Microsoft Graph integration

The browser connector supports delegated reads for Outlook, Calendar, directory/people, SharePoint/OneDrive, meeting options, and transcripts where the tenant permits them. Controlled writes include calendar creation and updates, non-overwriting SharePoint publishing, and reviewed Outlook email.

Strengths:

- real tenant data is used;
- spoken attendee names can be resolved;
- calendar timezone handling and conflict checks have deterministic helpers;
- transcript and document permission failures are surfaced distinctly;
- calendar writes are verified after execution.

Gaps:

- provider logic is concentrated in a large Microsoft module and called from the UI;
- tokens and execution are browser-bound;
- Teams messages are not a real signal source;
- Graph subscriptions, deltas, reconciliation, and renewal do not exist;
- permission scopes are broader than Canon's observation-first default;
- provider payloads are not consistently normalized into canonical platform events before decision logic.

## Event handling and workflow state

Foreground work uses browser events, Realtime tool calls, local state, and D1 writes. The first-meeting lifecycle is durable and release-aware. Meeting knowledge and work items are stored after explicit foreground actions.

There is no general workflow runtime with durable waits, resumable steps, retries, compensations, approval pauses, or dead-letter recovery. Meaningful Microsoft activity does not yet enter a normalized event stream.

## Memory

The application stores declared preferences, onboarding facts, first-day scan data, attention items, commitments, and meeting notes. Memory is tenant- and user-scoped in queries.

The current namespace model does not fully enforce Canon's boundaries among working, session, personal, organizational, role, and temporary sensitive memory. Consent, correction, expiration, and deletion are incomplete as first-class platform behavior.

## Permissions and authority

Microsoft consent controls provider access. Product prompts and UI flows control when Ara requests tools. Some deterministic checks protect calendar ownership, ambiguity, document overwrite, and reviewed sending.

There is no single policy and authority service that evaluates action, risk, trust stage, user, tenant, resource, data class, and context. The model can therefore participate too closely in deciding when a capability is used even though the underlying provider still enforces access.

## Logging and observability

D1 stores model invocation and audit records. The browser stores bounded session receipts. Errors are logged to the console and translated into user-facing states for several Microsoft failures.

Missing capabilities include correlation across event → decision → approval → action → verification, structured operational metrics, immutable audit history, alerting, cost budgets, privacy-safe tracing, and provider health telemetry.

## Desktop control

Desktop requests can be represented and stored, but no enrolled local companion executes them. This is correctly non-executing today. There is no device trust, signed action protocol, application registry, emergency stop, or local policy engine.

## Test posture

Tests cover people resolution, calendar payloads/windows, conversation lifecycle helpers, Microsoft access error classification, first-day briefing calculations, meeting artifacts, ownership, platform foundations, documents, and rendered HTML expectations.

Missing coverage includes true provider contract tests, tenant-isolation attacks, policy evaluation, idempotent live action replay, end-to-end session cleanup, Graph subscription failure, background workflow recovery, accessibility across complete journeys, and Canon-based behavioral evaluation.

## Major technical debt

1. Large client and Realtime modules combine experience, orchestration, provider access, and policy.
2. Microsoft work is browser-bound.
3. Demo identity fallback remains.
4. Model tiers and cost policies are not fully executed or enforced.
5. No event bus or durable workflow runtime exists.
6. Memory metadata and boundaries are incomplete.
7. Audit records do not yet form a complete reconstructable ledger.
8. Action authority is not centralized.
9. Cross-user ownership and delegation are schemas rather than a functioning shared coordination system.
10. UI tests verify output structure but not the full emotional and accessibility journey.

