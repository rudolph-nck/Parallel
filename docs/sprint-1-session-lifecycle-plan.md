# Sprint 1 — conversation lifecycle and autonomous close

Updated: 2026-07-31

## Outcome

When Ara successfully completes an approved action, she says `Done.`, finishes speaking, allows a brief interruption window, and ends the call cleanly. She never disconnects before the tool result or while approval, clarification, or recovery is required.

## In scope

- explicit lifecycle states and deterministic transitions;
- idempotent session cleanup;
- tool-pending and action-success tracking;
- output-audio-drained detection before closing;
- a two-second interruption window;
- session duration, model tier/model ID, close reason, tool outcomes, errors, and returned token usage;
- a small in-product last-session receipt;
- unit tests for completion policy and transitions;
- regression checks for the live calendar approval flow.

## Not in scope

- background inbox monitoring;
- automatic calls or scheduled briefings;
- shared multi-tenant database;
- live email or Teams chat sending;
- dynamic model routing;
- meeting transcript ingestion.

## Safety invariants

1. Never enter `WRAP_UP` while a tool is running.
2. Never autonomously close when an approval is still required.
3. Never mark a failed or simulated external action as successful.
4. Never close before the response is complete and WebRTC reports the output audio buffer drained.
5. Speech during the interruption window cancels closing.
6. Cleanup may run more than once without throwing or leaving live tracks, channels, timers, peers, or audio contexts.
7. Every started session produces one final audit record.

## Acceptance scenarios

- **Successful meeting:** prepare → await approval → create → Microsoft success → Ara says `Done.` → audio drains → two-second window → clean close.
- **Interrupted close:** same flow, but Nick speaks during the window → close timer is cancelled → Ara listens.
- **Failed creation:** Microsoft returns an error → Ara explains the next step → session stays open.
- **Missing attendee:** proposal cannot resolve someone → Ara asks for the email → session stays open.
- **Manual close:** Nick taps End conversation → resources close and a manual close reason is recorded.
- **Connection loss:** the peer fails or disconnects → cleanup is safe and a connection close reason is recorded.
- **Usage:** returned Realtime usage is accumulated and the final record contains duration and tool outcomes.

## Exit gate

Sprint 1 is complete only after automated tests pass, a production build succeeds, and the deployed calendar flow can be exercised without early disconnects or orphaned media resources.
