# ADR 0005: Read-only attention and accountability

Status: Superseded by ADR 0012
Date: 2026-08-01

## Decision

The first Attention Engine ingests only bounded metadata from the connected Outlook and Calendar snapshot. It normalizes, deduplicates, deterministically classifies, and surfaces unread/high-importance mail plus meetings occurring within 24 hours. It never takes an external action from a monitoring signal.

Commitments are first-class tenant records with owner, due date, status, source, and feedback. They can be created from Today or by Ara when the user states a clear personal promise. Completion and deferral are explicit user actions.

## Consequences

- The operating picture is useful before background automation exists.
- Monitoring and action authority remain separate.
- Teams ingestion, notification subscriptions, workflow rechecks, and automatic transcript-derived commitments remain later controlled milestones.
