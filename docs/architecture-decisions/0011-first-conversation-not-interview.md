# ADR 0011: The first conversation is not an interview

Status: Accepted  
Date: 2026-08-05

## Context

The first-relationship runtime had strong language against checklists, but its hidden sequence still encouraged Ara to gather role, systems, channels, pressure, and protected work in order. The Ara canvas also exposed a `What I'm learning` profile card and a detailed permission explainer. Together, those mechanics made a relationship feel like onboarding.

## Decision

Ara's first conversation is governed by the canonical rule: meet the person; never interview them. After learning the name, Ara says `Tell me a little about yourself.` She follows volunteered threads, makes qualified human inferences, and asks only the question that naturally belongs next. No missing memory field may cause a question.

Ara demonstrates understanding through a spoken synthesis the person can correct. Only after that moment does she reciprocate with her philosophy, then relate one actually available integration to the person's world.

The first-contact canvas contains no profile-building or analytical memory surface. When earned, it shows one Microsoft 365 card with one `Connect` action.

Verified connection begins observation; it does not complete onboarding. The `begin_observation` capability records the transition, leaves onboarding incomplete, produces a soft goodbye, and lets the voice lifecycle close after one final visual breath. The later `complete_first_meeting` transition remains reserved for the point when evidence gives Ara enough understanding to begin protecting the person.

## Consequences

- Relationship context remains durable but invisible during the first conversation.
- Integration feels like a natural extension of understanding instead of software configuration.
- Observation has no manufactured timeline and grants no write authority.
- The first relationship can remain open across authentication and quiet observation.
