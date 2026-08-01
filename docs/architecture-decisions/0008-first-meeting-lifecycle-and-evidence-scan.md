# ADR 0008: Durable first meeting and evidence-based workspace scan

Status: accepted  
Date: 2026-08-01

## Context

Parallel's first-run experience was a fixed welcome line. It could not learn a new person's identity, survive a Microsoft OAuth redirect, or prove that the workload observations Ara spoke were grounded in the connected tenant. A live WebRTC voice session also cannot be assumed to survive a full-page authorization redirect.

## Decision

Treat the first meeting as a durable product lifecycle with these states:

`NEW → NAME_LEARNED → WORK_CONTEXT_LEARNED → CONNECTION_READY → FIRST_VALUE_DELIVERED → COMPLETE`

The lifecycle is stored per tenant and user in D1. The browser voice session is disposable; after a Microsoft redirect, a new session reads the durable stage and resumes from there without repeating the introduction.

The lifecycle is persistence, not a dialogue script. It records what Ara already knows, but it does not dictate the next sentence. Ara must answer the user's actual question before saving or advancing a stage, may follow a tangent, and may defer workspace setup until the transition is natural.

Ara uses narrow Realtime function tools to save identity and work context, display secure Microsoft sign-in, run the first-day scan, and complete the first meeting. Business state remains in the application rather than in the model context.

When Microsoft is already connected, the first-day scan runs through a bounded client-side background controller. The tool returns immediately, Ara continues speaking with the user, and a separate check retrieves the result on a later suitable turn. The controller deduplicates concurrent starts and contains failures so a slow Microsoft read cannot stall the conversation.

The first-day scan is read-only and deterministic:

- complete Inbox total and unread counts come from the Inbox folder resource;
- attention candidates come from the newest 50 Inbox messages;
- Calendar load covers up to 100 items over the next 14 days and excludes cancelled and all-day items from scheduled-hour totals;
- Teams message counts are omitted until a real Teams signal source is connected;
- no message bodies are stored in the onboarding record.

## Consequences

- Ara can deliver an immediate, personalized readout without inventing statistics.
- OAuth no longer causes the first meeting to restart.
- Saving a name or role no longer forces Ara to change the subject or ignore a question.
- Connected-workspace research can finish while the conversation continues.
- A large Inbox can be discussed without pretending every message was semantically reviewed.
- A future mobile or phone handoff can use the same lifecycle, but push notifications, email magic links, and phone calling require a separate verified-device handoff service.
- The first meeting needs dedicated evaluation for repetition, truthfulness, scope disclosure, and tenant isolation.
