# Parallel

Parallel is a trusted professional counterpart that turns overwhelming
workplace information into clear, controlled action.

**Slogan:** Move through work with clarity.

This first prototype demonstrates the core relationship:

- **Friday** is the conversational chief of staff.
- **Recall** is the memory and context engine Friday consults.
- **Nick** remains in control of every external action.

The current workflow connects to a Microsoft 365 demo tenant, reads Outlook,
Calendar, and SharePoint context, resolves relevant people, proposes an open
working-hours calendar slot, and creates a real Teams meeting only after Nick's
clear voice or button approval. Message drafts remain non-sending prototypes.

The voice experience uses an OpenAI Realtime session created through the
server, responds to live microphone volume, distinguishes the user from Friday
visually, pauses the microphone while Friday speaks, and accepts natural
approval language.

## Microsoft 365 permissions

Friday currently requests delegated access for the signed-in user:

- `User.Read`, `Mail.Read`, and `Sites.Read.All` for connected context.
- `Calendars.Read` and `Calendars.ReadWrite` for availability and approved
  meeting creation.
- `User.ReadBasic.All` to resolve internal attendees from the tenant's basic
  user directory, with `People.Read` as a fallback for relevant contacts.

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
   already used by Friday.
5. Apply a user policy: default to proposing an action for approval; allow
   automatic scheduling only when Nick explicitly opts in and the transcript
   contains unambiguous attendees, timing, and intent.
6. Record the source sentence, proposal, approval, Graph result, and any failure
   in an audit trail.

This phase requires durable server-side token storage, a Graph webhook endpoint,
subscription renewal, transcript permission consent, and persistent storage.
