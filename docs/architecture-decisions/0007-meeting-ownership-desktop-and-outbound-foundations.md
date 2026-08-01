# ADR 0007: Meeting memory, ownership, desktop, and outbound foundations

Status: Accepted
Date: 2026-08-01

## Decision

Transcript analysis is persisted as tenant- and user-scoped meeting knowledge. Each extracted action is recorded separately with an ownership role of owner, dependency, or unclear. Stable transcript source keys prevent duplicate work records, and Ara may act only for owner-scoped work.

Delegations begin as proposals and do not notify another person or transfer authority by themselves. Desktop requests are structured, durable, and `awaiting_companion`; the hosted model cannot execute or claim them. Outlook email is the first live outbound channel and requires a visible draft, clear natural confirmation, separate delegated `Mail.Send` permission, and a recorded send result. Teams chat remains draft-only until exact chat resolution and safe delivery are implemented.

## Consequences

- The data model supports the blueprint's next capability layers without pretending the full enterprise workflow is complete.
- Cross-user acceptance still requires production tenant membership and assistant-to-assistant handoff.
- A signed, enrolled local companion is required before desktop execution.
- Outbound records distinguish sent messages from retained drafts.
