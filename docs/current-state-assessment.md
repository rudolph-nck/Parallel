# Parallel current-state assessment

Updated: 2026-08-01

## Product state

Parallel is a deployed, voice-first prototype centered on Ara, Nick's AI Chief of Staff. The working product already includes:

- a polished Today, Ara, Recall, and Approvals workspace;
- a live OpenAI Realtime voice connection over WebRTC;
- Microsoft 365 delegated sign-in and live mailbox, calendar, directory, SharePoint, and file lookup;
- attendee resolution from spoken names;
- a review-and-approve calendar flow that creates a Teams meeting only after explicit approval;
- device-local preferences and a first-run Ara introduction;
- deployment through OpenAI Sites.
- durable D1-backed identity, profile, policy, attention, commitment, usage, and audit records;
- a governed four-tier model router with measured voice usage;
- a read-only Outlook and Calendar attention picture;
- commitments captured from Today or naturally through Ara.

## Runtime and boundaries

- UI/runtime: Next.js 16, React 19, Vinext, Cloudflare-compatible output.
- Voice: `gpt-realtime-2.1`, low reasoning, server VAD, Marin voice.
- External action boundary: Teams calendar creation is live. Message and email sending remain prototypes and must never be represented as completed.
- Secrets: the OpenAI API key remains server-side. Microsoft access tokens use the current browser session.
- Persistence: durable operating state is stored in D1; browser storage remains a bounded fallback for session receipts and offline profile edits.
- Tenant model: data access is tenant- and user-scoped. The private demo retains an explicit single-owner fallback until production authentication is mandatory.

## What is reliable today

- The microphone pauses while Ara responds, reducing echo and background interruptions.
- Microsoft directory lookup can resolve short spoken names and refuses ambiguous first-name matches.
- A meeting is prepared before it is created, and the final creation requires a natural-language approval.
- Ara is instructed to say exactly `Done.` only after Microsoft confirms meeting creation.
- The main views render independently; sidebar actions no longer merely scroll the page.

## Gaps against the blueprint

1. Voice has presentation states, but not a formal conversation lifecycle with safety invariants.
2. A completed task does not autonomously end its voice session.
3. Background Microsoft change notifications, queues, retries, and rechecks are not implemented.
4. Attention currently uses the foreground Microsoft snapshot, not Graph subscriptions.
5. Teams signals and ServiceNow ingestion are not connected.
6. Pricing reconciliation still needs a versioned server-side rate table.
7. Recall remains connected search plus declared memory, not yet the blueprint's complete work graph.

## Naming decision

The blueprint uses both Aura and Ara. The product name remains **Ara**, matching the identity already established in Parallel and the `ARA` inside `PARALLEL`. Blueprint references to Aura are interpreted as references to the same AI employee unless a later brand decision changes the name.

## Recommended order

Next, add controlled calendar authority and meeting-knowledge ingestion on top of the new policy, attention, and accountability foundations. Background monitoring should follow only after queue, retry, subscription-renewal, and tenant-isolation evals are in place.
