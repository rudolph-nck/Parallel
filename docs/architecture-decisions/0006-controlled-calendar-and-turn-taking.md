# ADR 0006: Semantic turn-taking and controlled personal calendar items

Status: Accepted
Date: 2026-08-01

## Decision

Ara uses Realtime semantic turn detection at low eagerness and permits interruption while audio is playing. One explicit client opening is created per session; silence does not authorize another greeting. Consequential confirmation still requires clear language and cannot be inferred from silence, noise, or a partial phrase.

Personal lunches, appointments, and focus blocks are prepared without a meeting agenda or transcription. Unless the user already chose, Ara asks whether the item should be private before presenting or resolving a conflicting time. The calendar body carries only factual notes supplied or retrieved from an authorized source.

## Consequences

- Reflective speech is less likely to be cut off while barge-in remains immediate.
- Echo cancellation and noise suppression remain enabled because live barge-in keeps the microphone active during Ara's output.
- Privacy is a first-class calendar decision and is applied as Microsoft Graph sensitivity.
- Restaurant details and medical-provider notes may be useful, but Ara must not invent them.
