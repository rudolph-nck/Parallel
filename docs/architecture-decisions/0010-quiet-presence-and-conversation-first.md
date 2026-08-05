# ADR 0010: Quiet presence and conversation-first response timing

Status: Accepted
Date: 2026-08-05

## Context

The first-contact visual had accumulated a literal light stream, impact flash, and wake echo. The effect competed with the calm arrival defined in the Canon. The voice path also awaited durable onboarding writes before continuing, which could leave several seconds of dead air after a simple answer such as a name.

## Decision

Ara and the member are represented by the two Parallel bars and their restrained side ambience. The direct beam, stream, funnel, impact flash, and wake echo are removed. Bar color and motion continue to reflect actual audio state: Ara is teal on the left, the member is blue on the right, and only the active speaker receives stronger ambience and subtle audio-driven movement.

The spoken relationship has priority over persistence latency. Identity and work context are accepted immediately, the Realtime response continues, and durable storage refreshes quietly in the background. First-name capture uses a short-turn high-eagerness window; discovery returns to medium eagerness after that first reply.

Runtime instructions prohibit placeholder thought narration. Ara delivers the observation itself, responds to the person's actual words, and asks at most one genuine follow-up.

## Consequences

- The first moment remains alive without depicting energy traveling into an AI object.
- Visual motion communicates who is speaking rather than decorating silence.
- A short answer can receive a human-speed response even when durable storage is slow.
- Background persistence failures remain recoverable without forcing the conversation to wait.
