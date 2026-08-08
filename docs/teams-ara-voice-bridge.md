# Ara follow-up conversations in Microsoft Teams

Status: proposed phased architecture

## Product decision

Parallel can already create a private one-to-one Teams calendar meeting and return its join link through Microsoft Graph. That is the near-term follow-up path.

Ara must not claim that she can join a Teams meeting or call a user until a dedicated Teams calling bot confirms that capability. A conversational participant in Teams is a separate service, not a switch inside the current web application.

## Phased experience

### Phase 1 — schedule in Teams, converse in Parallel

1. Ara finishes the first conversation and explains once that she will observe connected work signals until she has enough evidence, without promising a fixed number of days or repeating how she operates.
2. Parallel schedules a private Teams calendar meeting at an agreed time.
3. The meeting invitation and a proactive Teams reminder contain a secure link to Ara's voice room in Parallel.
4. The user enters the familiar Ara canvas for the evidence-based follow-up conversation.

This gives the user a real calendar commitment and Teams presence while keeping live voice in the production path that exists today.

### Phase 2 — Teams agent and proactive contact

Create a Teams app installed in the user's personal scope. It can send proactive messages, present the report link, and invite the user into the scheduled follow-up. Proactive contact requires the app to be installed for that user and the conversation reference to be stored. See [proactive Teams messages](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages).

### Phase 3 — Ara joins or calls in Teams

Build a dedicated calling bot with the Teams calling manifest and tenant admin consent. Outgoing one-to-one calls use `Calls.Initiate.All`; joining meetings and receiving live media require the matching Cloud Communications permissions. See [register a calling and meeting bot](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/registering-calling-bot).

For Ara to hear and speak naturally rather than play short prompts, the bot needs application-hosted media. Microsoft's current requirements call for a C#/.NET media worker running on supported Azure compute with public network reachability; the real-time media path is not supported as a Node.js web process or ordinary Azure Web App. See [application-hosted media bot requirements](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/calls-and-meetings/requirements-considerations-application-hosted-media-bots) and [Cloud Communications media options](https://learn.microsoft.com/en-us/graph/cloud-communications-media).

The media worker would bridge Teams audio to the OpenAI Realtime session while the existing Parallel service continues to own identity, memory, policies, approvals, and audit history.

## Consent and safety

- Tenant admin consent is required for calling and media permissions.
- Ara must announce recording or transcription before it begins and update the call's recording status as required by Teams.
- Meeting transcripts remain a governed source with tenant, user, meeting, and consent provenance.
- The bot may observe or prepare; external changes still follow Parallel's approval policy.
- If the Teams media worker is unavailable, the invitation falls back to the Parallel voice room without pretending Ara joined the Teams call.

## Build order

1. Ship the scheduled Teams follow-up with a Parallel voice-room link.
2. Add the personal-scope Teams app and proactive reminder.
3. Prototype the Azure .NET media worker in a non-production tenant.
4. Add consent, transcription, audit, reconnect, and media-quality evaluations.
5. Enable Ara-as-participant only after tenant-admin review and end-to-end reliability tests.
