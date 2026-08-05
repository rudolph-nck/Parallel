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
clear voice or button approval. Ara now includes a useful agenda in new meetings,
can prepare and apply an approved agenda update to an existing organizer-owned
invitation, can enable Teams transcription when separately authorized, and can
turn a delivered Teams transcript into structured notes inside Parallel. Message
drafts remain non-sending prototypes. Ara can also create a complete policy,
procedure, executive brief, or meeting record in Parallel's starter branded
format, show a sandboxed HTML preview, and publish a new, non-overwriting copy
to the connected SharePoint site's `Parallel Documents` folder after approval.

Calendar conversation is intentionally human rather than procedural. Ara treats
"book time" as permission to find an option, says the time once, and asks only
"How does that sound?" Natural replies such as "sounds good" complete the booking.
Exact requests such as "next Friday at 2" remain exact from the spoken proposal
through the Microsoft write and a post-write time check. Personal lunches and
appointments can be added only to Nick's calendar without attendees or a Teams
link. If that time is busy, Ara surfaces the real conflict and can, after Nick
chooses, move an organizer-owned meeting, decline someone else's invitation, or
offer another time for the new request.

The voice experience uses an OpenAI Realtime session created through the
server, responds to live microphone volume, distinguishes the user from Ara
visually, pauses the microphone while Ara speaks, and accepts natural
approval language. A private input transcription check now grounds each
committed voice turn without displaying or storing a visible transcript; it
helps a clearly spoken name advance once and keeps unclear audio in the same
conversational thread. Ara uses task-specific response limits to keep routine
voice turns fast and economical, and closes successful actions briefly.

## Microsoft 365 permissions

Ara currently requests delegated access for the signed-in user:

- `User.Read`, `Mail.Read`, and `Sites.Read.All` for connected context.
- `Calendars.Read` and `Calendars.ReadWrite` for availability and approved
  meeting creation.
- `User.ReadBasic.All` to resolve internal attendees from the tenant's basic
  user directory, including safe handling for speech variations such as
  "Noel" / "Noelle" and "Wes" / "Wesley", with `People.Read` as a fallback
  for relevant contacts.
- Optional meeting intelligence uses `OnlineMeetings.ReadWrite` to enable
  transcription in meeting options and `OnlineMeetingTranscript.Read.All` to
  retrieve completed transcripts. Transcript access requires administrator
  consent and the tenant's Teams Graph transcript setting.
- Optional document publishing uses delegated `Files.ReadWrite`, requested
  separately from Ara's read access, to create the `Parallel Documents` folder
  and upload an approved HTML document to the signed-in user's SharePoint site.

Calendar creation, approved invitation-body updates, and new approved document
publishing are the only live write actions. Publishing never overwrites an
existing file. Sending messages, editing existing files, and deleting content
remain off.

## Transcript-to-action phase

Parallel can now retrieve a transcript on demand and build reviewable notes in
the browser. The next phase should make that workflow durable and automatic as
a secure background service:

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
