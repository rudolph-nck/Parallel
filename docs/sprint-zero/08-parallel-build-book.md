# Parallel Build Book

## Current sprint

Name: Canon-led experience foundation  
Dates: 2026-08-03 onward  
Owner: Codex with founder review

## Intended human outcome

The first minutes in Parallel should feel like meeting a calm, capable new coworker—not entering a setup flow. The person should feel welcomed, understood, and in control before any system asks for access.

## Canon references

- Compass: Promise, Belief, Principles 1–8
- Constitution: Laws I–VI, VIII–XII
- Book of Ara: Person in the Chair, The Why, Curiosity, Grace
- Human Experience: 01–07, 13–16, 18–20
- Design Language: Silence in Motion, Arrival, Bars, Words, Evidence, Approval, Completion
- UX Journey: 01–05, 14, 16
- Technical Laws: I–VIII, X–XV, XVIII–XXII
- Architecture: 01–05, 11–15, 18–20

## Scope

### In scope

- preserve the established visual identity;
- remove Microsoft as a first-meeting gate;
- add correctable conversational understanding;
- present connection contextually and explain its boundaries;
- complete the Sprint Zero architecture, gap, migration, risk, and roadmap package;
- define the next trust-stage and observation-only implementation.

### Out of scope

- production background monitoring;
- multi-user pilot launch;
- autonomous writes;
- live desktop control;
- phone calling;
- organization simulation;
- ground-up visual redesign.

## Acceptance criteria

1. The cinematic boot remains visually recognizable.
2. A first-time user reaches Ara without a Microsoft connection gate.
3. Ara's page shows only presence, conversation, and relevant supporting views.
4. The first-meeting understanding panel is calm and correctable.
5. Microsoft access is introduced with purpose, limits, and provider-owned sign-in.
6. Existing calendar, meeting, Recall, document, and voice behavior continues to pass tests.
7. Sprint Zero documents classify the current implementation and define a safe migration.

## Authority and risk

- Action risk: low for this slice; no new external action
- Required authority: explicit user interaction for microphone and Microsoft redirect
- Reversible: yes
- Audit required: onboarding state changes remain audited
- Sensitive data involved: declared work context; existing Microsoft data only after connection

## Failure experience

- Model wrong: user corrects by voice or preferences; declared correction wins.
- Connector unavailable: the conversation continues without pretending connected context exists.
- Action runs twice: no new external action in this slice; existing lifecycle reset remains deduplicated.
- User unavailable: no background action begins.
- Evidence stale: no new evidence claim is introduced.
- Cost threshold reached: this slice adds no model calls.

## Cost plan

- Rules-first path: onboarding state and canvas projection are deterministic.
- Model tier: existing realtime session only.
- Expected model calls: unchanged.
- Cache strategy: existing durable workspace and bounded browser fallback.
- Batch strategy: none required.
- Cost telemetry: existing session usage record.

## Tests

- Unit: understanding projection and future memory confirmation helper.
- Integration: first visit without Microsoft, contextual connection, OAuth return.
- Policy: connection does not imply action authority.
- Tenant isolation: required in the next identity sprint.
- Idempotency: release reset and first-meeting tool calls.
- UX/evaluation: no forced setup, one question, no repeated greeting.
- Failure and recovery: connector unavailable and OAuth cancellation.
- Accessibility: keyboard, live region, reduced motion, non-voice entry.

## Open questions

- Pilot tenant administrator and membership source.
- Retention and deletion periods.
- First authoritative meeting/document destination.
- Evidence threshold for advancing trust stages.
- Whether the private demo resets on every release or only through a founder control.

## Deferred ideas

- Mobile handoff, Teams calling, phone calling, local desktop companion, additional AI coworker roles, digital twin, simulation.

## Decision record links

- Existing ADRs 0001–0008 remain historical implementation decisions.
- New ADRs are required for observation-only scopes, production tenant identity, action registry/policy engine, credential storage, event/workflow runtime, memory boundaries, and evidence/audit envelopes.

