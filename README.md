# Parallel

Parallel is a trusted professional counterpart that turns overwhelming
workplace information into clear, controlled action.

**Slogan:** Move through work with clarity.

This first prototype demonstrates the core relationship:

- **Ara** is the conversational chief of staff, named for the A-R-A at the
  heart of PARALLEL.
- **Recall** is the memory and context engine Ara consults.
- **Nick** remains in control of every external action.

The experience includes an extended cinematic startup with rotating product
promises, a first-conversation welcome, a practical "what can I ask?" guide,
device-local working preferences, and distinct Today, Ara, Recall, and
Approvals workspaces. Recall includes direct connected-workspace search, while
Approvals provides a dedicated review queue.

The current workflow connects to a Microsoft 365 demo tenant, reads Outlook,
Calendar, and SharePoint context, resolves relevant people, proposes an open
working-hours calendar slot, and creates a real Teams meeting only after Nick's
clear voice or button approval. Message drafts remain non-sending prototypes.

The voice experience uses an OpenAI Realtime session created through the
server, responds to live microphone volume, distinguishes the user from Ara
visually, pauses the microphone while Ara speaks, and accepts natural
approval language. Ara uses task-specific response limits to keep routine voice
turns fast and economical, and says only "Done." after a successful action.

## Microsoft 365 permissions

Ara currently requests delegated access for the signed-in user:

- `User.Read`, `Mail.Read`, and `Sites.Read.All` for connected context.
- `Calendars.Read` and `Calendars.ReadWrite` for availability and approved
  meeting creation.
- `User.ReadBasic.All` to resolve internal attendees from the tenant's basic
  user directory, including safe handling for speech variations such as
  "Noel" / "Noelle" and "Wes" / "Wesley", with `People.Read` as a fallback
  for relevant contacts.

Calendar creation is the only live write action. Sending messages, editing
files, and deleting content remain off.

## Transcript-to-action phase

The next phase should run as a secure background service rather than inside the
browser:

1. Subscribe to Microsoft Graph notifications for newly available Teams
   transcripts and renew those subscriptions.
2. Retrieve each transcript with `OnlineMeetingTranscript.Read.All`, retain the
   source meeting and speaker references, and store tokens and transcript data
   server-side.
3. Extract commitments, owners, due dates, and dependencies into a reviewable
   action queue.
4. Resolve people and check the calendar using the same meeting proposal logic
   already used by Ara.
5. Apply a user policy: default to proposing an action for approval; allow
   automatic scheduling only when Nick explicitly opts in and the transcript
   contains unambiguous attendees, timing, and intent.
6. Record the source sentence, proposal, approval, Graph result, and any failure
   in an audit trail.

This phase requires durable server-side token storage, a Graph webhook endpoint,
subscription renewal, transcript permission consent, and persistent storage.
