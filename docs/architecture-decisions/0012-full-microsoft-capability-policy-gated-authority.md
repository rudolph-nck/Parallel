# ADR 0012: Full Microsoft capability with policy-gated authority

Status: Accepted
Date: 2026-08-08

## Context

The first Parallel implementation treated Microsoft consent and Ara's authority as the same boundary. That produced repeated consent prompts, caused Ara to describe the relationship as read-only, and made the product feel configured in fragments.

OAuth scope answers a technical question: which provider operations can the application perform? It does not answer the relationship question: which operations has this person authorized Ara to perform in this situation?

## Decision

The initial Microsoft 365 connection requests the complete operational scope used by Parallel's current live capabilities: mail read/write and send, calendar read/write, people and directory lookup, online meeting and transcript access, and SharePoint/OneDrive document publishing.

Parallel does not request unrelated tenant-wide or calling permissions merely because Microsoft exposes them. New capability families—such as tenant-wide Teams message monitoring or a Teams calling bot—are added when their server-side implementation exists and the tenant administrator can review that purpose.

Provider permission and action authority remain separate:

- Microsoft permission makes an operation technically possible.
- Parallel policy decides whether Ara may observe, recommend, prepare, confirm-and-act, or act under standing authority.
- A broad OAuth grant never overrides a user, tenant, risk, ownership, or confirmation rule.
- Ara does not describe the first relationship as read-only. She describes the human behavior: she will observe before changing anything and return when she has enough evidence to be useful.

## Consequences

- New users connect Microsoft 365 once for the current capability set instead of encountering separate feature-by-feature permission prompts.
- The first conversation stays human and avoids permission terminology.
- The action registry and policy engine remain mandatory before consequential execution.
- The current browser MSAL client remains a transitional foreground connector. Continuous observation requires a confidential server-side connector and encrypted token cache.
- This decision supersedes the permission posture in ADR 0005 while preserving its core safety principle that a monitoring signal alone is not authority for an unrelated action.
