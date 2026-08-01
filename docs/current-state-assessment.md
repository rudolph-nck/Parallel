# Parallel current-state assessment

Updated: 2026-08-01

## Product state

Parallel is a deployed, voice-first prototype centered on Ara, Nick's AI Chief of Staff. The working product already includes:

- a polished Today, Ara, Recall, and Approvals workspace;
- a live OpenAI Realtime voice connection over WebRTC;
- semantic turn detection with low eagerness, live barge-in, and a single opening per voice session;
- Microsoft 365 delegated sign-in and live mailbox, calendar, directory, SharePoint, and file lookup;
- attendee resolution from spoken names;
- a review-and-approve calendar flow that creates a Teams meeting only after explicit approval;
- device-local preferences and a first-run Ara introduction;
- deployment through OpenAI Sites.
- durable D1-backed identity, profile, policy, attention, commitment, usage, and audit records;
- a governed four-tier model router with measured voice usage;
- a read-only Outlook and Calendar attention picture;
- commitments captured from Today or naturally through Ara.
- private personal lunches and appointments with factual location notes and no work agenda;
- durable meeting-knowledge, work-ownership, delegation, desktop-request, and outbound-message records;
- reviewed Outlook email sending through separately granted Microsoft permission.
- a durable first-meeting lifecycle that learns the user's name and work context, survives Microsoft sign-in, and resumes without repeating Ara's introduction;
- a live first-day Inbox and Calendar scan with complete Inbox counts, bounded attention candidates, calendar-load statistics, and explicit coverage limits.

## Runtime and boundaries

- UI/runtime: Next.js 16, React 19, Vinext, Cloudflare-compatible output.
- Voice: `gpt-realtime-2.1`, low reasoning, semantic VAD at low eagerness, interruption enabled, Marin voice.
- External action boundary: governed calendar changes, non-overwriting SharePoint publishing, and reviewed Outlook email are live. Teams chat remains draft-only. Desktop requests remain prepare-only until a signed local companion exists.
- Secrets: the OpenAI API key remains server-side. Microsoft access tokens use the current browser session.
- Persistence: durable operating state is stored in D1; browser storage remains a bounded fallback for session receipts and offline profile edits.
- Tenant model: data access is tenant- and user-scoped. The private demo retains an explicit single-owner fallback until production authentication is mandatory.

## What is reliable today

- Ara remains interruptible while speaking; browser echo cancellation and semantic turn detection reduce false turns without muting the user.
- Microsoft directory lookup can resolve short spoken names and refuses ambiguous first-name matches.
- A meeting is prepared before it is created, and the final creation requires a natural-language approval.
- Ara varies short natural completion phrases only after the external tool confirms success.
- The main views render independently; sidebar actions no longer merely scroll the page.
- First-meeting progress is tenant- and user-scoped in D1 rather than inferred from a browser flag.
- Ara never requests Microsoft credentials in conversation; Microsoft owns the secure sign-in screen.
- First-day workload claims are calculated from Graph results and disclose the 50-message attention sample and missing Teams coverage.

## Gaps against the blueprint

1. Background Microsoft change notifications, queues, retries, and rechecks are not implemented.
2. Attention currently uses the foreground Microsoft snapshot, not Graph subscriptions.
3. Teams signals, Teams chat sending, and ServiceNow ingestion are not connected.
4. Meeting knowledge currently stores transcript analysis; pre-meeting source ranking, workspace creation, evidence timestamps, and destination adapters remain.
5. Ownership is user-scoped and duplicate-safe by source key, but real cross-user acceptance and assistant-to-assistant handoff require production tenancy.
6. Desktop requests are durable and explicitly non-executing; device enrollment, signatures, application registry, and the local companion remain.
7. Pricing reconciliation still needs a versioned server-side rate table.
8. Recall remains connected search plus declared and meeting memory, not yet the blueprint's complete work graph.
9. The first-day scan does not yet classify Teams messages, crawl every email body, or run continuously in the background.
10. Mobile push, email handoff, and Ara-initiated phone or Teams calls need a verified-device handoff service and background execution plane.

## Naming decision

The blueprint uses both Aura and Ara. The product name remains **Ara**, matching the identity already established in Parallel and the `ARA` inside `PARALLEL`. Blueprint references to Aura are interpreted as references to the same AI employee unless a later brand decision changes the name.

## Recommended order

Next, use the first-day readout to complete one real item during onboarding, then deepen knowledge-aware meeting creation and transcript evidence. Production tenant membership, verified-device handoff, and the signed desktop companion follow. Background monitoring should begin only after queue, retry, subscription-renewal, and tenant-isolation evals are in place.
