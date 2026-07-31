# Parallel current-state assessment

Updated: 2026-07-31

## Product state

Parallel is a deployed, voice-first prototype centered on Ara, Nick's AI Chief of Staff. The working product already includes:

- a polished Today, Ara, Recall, and Approvals workspace;
- a live OpenAI Realtime voice connection over WebRTC;
- Microsoft 365 delegated sign-in and live mailbox, calendar, directory, SharePoint, and file lookup;
- attendee resolution from spoken names;
- a review-and-approve calendar flow that creates a Teams meeting only after explicit approval;
- device-local preferences and a first-run Ara introduction;
- deployment through OpenAI Sites.

## Runtime and boundaries

- UI/runtime: Next.js 16, React 19, Vinext, Cloudflare-compatible output.
- Voice: `gpt-realtime-2.1`, low reasoning, server VAD, Marin voice.
- External action boundary: Teams calendar creation is live. Message and email sending remain prototypes and must never be represented as completed.
- Secrets: the OpenAI API key remains server-side. Microsoft access tokens use the current browser session.
- Persistence: there is no shared database yet. Profile and session prototype data are device-local.
- Tenant model: stable prototype identifiers can be emitted now, but true multi-tenant persistence and enforcement are not yet implemented.

## What is reliable today

- The microphone pauses while Ara responds, reducing echo and background interruptions.
- Microsoft directory lookup can resolve short spoken names and refuses ambiguous first-name matches.
- A meeting is prepared before it is created, and the final creation requires a natural-language approval.
- Ara is instructed to say exactly `Done.` only after Microsoft confirms meeting creation.
- The main views render independently; sidebar actions no longer merely scroll the page.

## Gaps against the blueprint

1. Voice has presentation states, but not a formal conversation lifecycle with safety invariants.
2. A completed task does not autonomously end its voice session.
3. Session duration, tool outcomes, token usage, model tier, and close reason are not recorded.
4. Session cleanup has not been made idempotent and independently testable.
5. There is no shared audit store, tenant data layer, queue, or event bus.
6. Model routing is a fixed realtime-model choice rather than policy-driven routing.
7. Recall is connected search plus device-local preferences, not yet the blueprint's complete memory system.

## Naming decision

The blueprint uses both Aura and Ara. The product name remains **Ara**, matching the identity already established in Parallel and the `ARA` inside `PARALLEL`. Blueprint references to Aura are interpreted as references to the same AI employee unless a later brand decision changes the name.

## Recommended order

Do not begin background monitoring yet. First make voice completion deterministic, instrument the current experience, and prove that successful and failed sessions clean up correctly. Then add routing and shared persistence, followed by tenant-safe memory and background work.
