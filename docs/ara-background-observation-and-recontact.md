# Ara background observation and earned recontact

Status: next implementation architecture
Updated: 2026-08-08

## Honest current state

The live application can inspect Microsoft 365 while the browser is open and a Microsoft session is available. It does not yet continuously monitor communication after the user closes Parallel, and it cannot yet place a live Teams call as Ara.

Continuous observation is a backend service, not a longer prompt. The browser cannot be the credential vault, subscription renewer, webhook receiver, queue, or durable workflow runner.

## Product contract

Ara receives the Microsoft capabilities Parallel currently supports during the first connection. She then behaves quietly because trust is still forming—not because the connection is technically read-only.

Microsoft permission and Parallel authority are different:

1. Microsoft permits the application to perform supported operations.
2. Parallel evaluates ownership, risk, user preference, tenant policy, and standing authority.
3. Ara observes and prepares evidence continuously.
4. Ara contacts the user only when the evidence crosses their interruption threshold.
5. Any consequential action still follows the applicable authority rule.

## Runtime flow

```text
Microsoft Graph change notification
  → authenticated webhook intake
  → durable provider-event record
  → deduplication and delta reconciliation
  → normalized evidence envelope
  → deterministic relevance filters
  → bounded model classification when ambiguity remains
  → attention candidate with confidence and provenance
  → policy, quiet-hours, availability, and cooldown decision
  → silent observation, Teams message, meeting invitation, or call
  → evidence package for Ara's follow-up conversation
  → provider verification and audit record
```

## Required services

### 1. Confidential Microsoft connector

Move continuous access out of the browser-only MSAL client. A server-side confidential client stores tokens in an encrypted credential vault, refreshes them without an open tab, and links the provider identity to the authenticated Parallel tenant and user.

### 2. Graph subscription manager

Create and renew subscriptions for Outlook messages and calendar events. Add Teams message subscriptions after the required tenant permissions are approved. Store subscription identity, resource, expiration, client-state hash, lifecycle state, and reconciliation cursor.

Microsoft Graph supports webhook notifications for Outlook messages and events. Subscription lifecycle notifications must be handled so authorization changes, removed subscriptions, and missed events do not silently stop observation.

### 3. Event gateway and reconciliation

Expose a Microsoft notification endpoint that validates provider challenges and client state, writes the event before processing, deduplicates repeated delivery, and acknowledges quickly. A periodic delta sweep recovers missed or out-of-order notifications.

### 4. Evidence and attention engine

Normalize mail, calendar, Teams, and transcript signals into a provider-neutral envelope. Cheap deterministic rules remove newsletters, duplicates, resolved threads, routine calendar updates, and low-value noise. A bounded model call handles only ambiguous judgment: urgency, commitment, dependency, risk, who owes what, and why the user may need to engage.

Every candidate keeps source IDs, timestamps, excerpts, classification reason, confidence, and expiry. Ara never reaches out from an unsupported summary.

### 5. Recontact planner

The planner chooses the least disruptive truthful channel:

- stay silent when the signal does not clear the threshold;
- send one proactive Teams message when context can be handled asynchronously;
- create a private Teams calendar meeting when the topic needs discussion but is not urgent;
- initiate a direct Teams call only for a high-signal case covered by the user's interruption policy and only after the calling service is live.

It checks quiet hours, time zone, calendar availability, protected focus, recent contact, topic deduplication, urgency, and user channel preference before contacting them.

## Recontact experience

The first production slice should schedule a private Teams meeting and include a secure link back to Ara's voice room in Parallel. Ara enters with an evidence package containing the small number of items that justified contact, their source links, what changed, and the decisions that may be needed.

A personal-scope Teams app is the next channel. Once installed, it can send a proactive message such as:

> Hi Nick. I think I'm starting to understand how the work is moving. I found two things worth looking at together. Do you have fifteen minutes today?

The message is created once, stored with its conversation reference, and includes a clear reason and opt-out path.

## Direct Teams calling

A real Ara call requires a dedicated Teams calling bot with tenant admin consent and a Teams app manifest that supports calling. For natural two-way speech, an application-hosted media worker bridges Teams audio to the OpenAI Realtime session while Parallel continues to own identity, memory, policy, evidence, and audit state.

This is a later phase because the media service, consent, recording/transcription behavior, reconnect handling, and interruption policy all need production-grade reliability. Ara must not claim she can call or join until that service verifies the capability.

## First build slice

1. Add durable Microsoft connection, subscription, provider-event, observation-candidate, and recontact-plan records.
2. Move OAuth for continuous observation to a confidential server-side connector and encrypted token cache.
3. Add Outlook mail and calendar webhook subscriptions, lifecycle handling, renewal, and delta reconciliation.
4. Build deterministic prefiltering plus evidence-backed priority classification.
5. Add a recontact planner that can create a private Teams meeting with a Parallel voice-room link.
6. Add the personal-scope Teams app and proactive messaging.
7. Add Teams message observation after tenant admin review.
8. Prototype the Teams calling/media bridge last.

## Acceptance criteria for the first slice

- Observation continues for at least 48 hours with the Parallel tab closed.
- Duplicate, delayed, and out-of-order notifications do not create duplicate attention or contact.
- A missed notification is recovered by reconciliation.
- Low-signal communication remains silent.
- Every surfaced item links to fresh provider evidence and explains why it mattered.
- Quiet hours, time zone, protected focus, cooldowns, and calendar conflicts are respected.
- A justified follow-up meeting is created once, verified in Microsoft 365, and carries the correct evidence package.
- The user can pause observation, change contact preferences, or disconnect Microsoft 365.
- Every read, inference, policy decision, contact, and provider result is auditable.

## Microsoft implementation references

- [Outlook change notifications](https://learn.microsoft.com/en-us/graph/outlook-change-notifications-overview)
- [Change-notification lifecycle events](https://learn.microsoft.com/en-us/graph/change-notifications-lifecycle-events)
- [Teams message change notifications](https://learn.microsoft.com/en-us/graph/teams-changenotifications-chatmessage)
- [Teams proactive messages](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [Register a Teams calling and meeting bot](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/registering-calling-bot)
