# ADR 0006: Semantic turn-taking and controlled personal calendar items

Status: Accepted
Date: 2026-08-01

## Decision

Ara uses adaptive Realtime semantic turn detection and permits interruption while audio is playing. The short first-name reply uses high eagerness so a completed name is accepted promptly; normal discovery returns to medium eagerness so a person can still gather a thought. One explicit client opening is created per session; silence does not authorize another greeting. Consequential confirmation still requires clear language and cannot be inferred from silence, noise, or a partial phrase.

Identity and work-context persistence run after the tool has accepted the information and do not block Ara's next spoken turn. A failed background write is reported internally for retry, never narrated as conversational filler.

Personal lunches, appointments, and focus blocks are prepared without a meeting agenda or transcription. Unless the user already chose, Ara asks whether the item should be private before presenting or resolving a conflicting time. The calendar body carries only factual notes supplied or retrieved from an authorized source.

## Consequences

- A one-word name no longer waits behind a long turn threshold, while subsequent reflective speech retains deliberate pause tolerance and barge-in remains immediate.
- Durable memory latency no longer creates dead air between a user's answer and Ara's response.
- Echo cancellation and noise suppression remain enabled because live barge-in keeps the microphone active during Ara's output.
- Privacy is a first-class calendar decision and is applied as Microsoft Graph sensitivity.
- Restaurant details and medical-provider notes may be useful, but Ara must not invent them.
