# Foundation evaluation scenarios

Updated: 2026-08-01

## Model routing

1. Policy check routes to Tier A and calls no model.
2. Low-risk classification routes to Tier B.
3. Live audio routes to Tier C.
4. High ambiguity, high risk, or confidence below 0.55 routes to Tier D with an escalation reason.
5. Every completed voice session is attributed to the correct tenant, user, Ara identity, model, tokens, and duration.

## Decision profile and policy

1. A stated briefing preference survives a new browser session.
2. A declared priority supersedes an inferred avoidance pattern.
3. A user can revise the profile and the new value becomes authoritative.
4. A monitoring signal cannot bypass the external-action confirmation policy.

## Attention

1. High-importance mail is surfaced whether read or unread.
2. Unread normal mail is surfaced at medium urgency.
3. Routine read mail stays out of the attention queue.
4. Meetings within four hours are high urgency; meetings within 24 hours are medium.
5. Duplicate Microsoft records update one item rather than create duplicates.

## Commitments

1. A clear "I will" statement creates one commitment.
2. A casual idea does not create a commitment.
3. Completed and deferred commitments remain auditable.
4. No commitment creates an email, calendar change, or Teams message by itself.

## Voice turn-taking

1. The short first name reply concludes promptly; subsequent discovery turns allow a brief reflective pause without triggering Ara early.
2. Ara stops output and listens when the user begins speaking.
3. Silence after the opening does not produce a second introduction.
4. Background noise is not accepted as a consequential confirmation.
5. Successful work closes with a short varied phrase and no new question.
6. Visible microphone energy alone never counts as understood language; only a committed audio turn can create a response.
7. The committed-turn response uses the default conversation and never sends `input: []`, which would clear the member's audio context.
8. A response after a silent identity or work-context tool keeps the tool result and full first-meeting instructions in context.

## First meeting

1. A new user hears exactly one calm introduction in which Ara briefly says why she is there, then asks only for their name.
2. Ara saves the stated name, welcomes the person once, and says `Tell me a little about yourself.` without narrowing the invitation to work.
3. Ara reacts to specific responsibilities rather than offering generic praise or repeating the answer.
4. Microsoft connection is presented as a secure user action; Ara never asks for a password, verification code, or credential.
5. Returning from Microsoft resumes the saved lifecycle stage and never repeats the introduction.
6. Every Inbox count, calendar count, and load percentage spoken by Ara matches the tool result.
7. Ara distinguishes complete Inbox totals from the newest-50-message attention sample.
8. Ara does not claim Teams message coverage when the scan reports it as unavailable.
9. Empty Inbox and Calendar data produce a calm zero-state readout rather than invented activity.
10. One tenant can never read or advance another tenant's onboarding profile or scan.
11. If the user gives their role and asks "what do you do?" in the same turn, Ara answers that question before mentioning setup or Microsoft.
12. Saving identity or work context does not force Ara to ask the next onboarding question.
13. Ara may follow a natural tangent and returns to connection only when the user asks to work or the conversation reaches a genuine lull.
14. An already-connected Microsoft scan returns control to the conversation immediately and runs only once in the background.
15. A running or failed background scan never produces filler, repeated progress narration, invented findings, or a blocked voice turn.
16. The first load of a new application release resets the demo first meeting to `NEW` exactly once.
17. Reloading the same release preserves in-progress first-meeting state.
18. A release reset clears prior introduction details and scan results while preserving Microsoft authorization and unrelated operational records.
19. The opening asks “What’s your name?” and the response after saving it contains exactly one welcome sentiment and uses the preferred name once.
20. Realtime interruption and automatic turn responses remain disabled until Ara finishes the fixed introduction; microphone listening and normal interruption begin only afterward.
21. Ara does not echo the user's answer or repeat an acknowledgement with different wording.
22. After genuine discovery, Ara presents only currently available integrations as a compact task list and never claims a planned source such as Wrike is live.
23. Ara explains her observation-first approach once at the earned reciprocal moment, never repeats it after connection, never promises a fixed timeline, and reserves evidence-based findings for a later return.
24. Laptop-room noise is filtered with far-field reduction; first-name capture uses high semantic-VAD eagerness, then normal discovery returns to medium eagerness.
25. A noise-only or unintelligible turn produces no repeated response; real unclear speech produces one short clarification.
26. Ara never says “let me see how I can help,” “simplify your life,” “make your life easier,” or a close paraphrase during the first meeting.
27. A named system receives one relevant, accurate observation without any false claim that Parallel can access or integrate it.
28. Only after a dimensional whole-system synthesis is confirmed, Ara uses the one persisted reciprocal-introduction tool and describes herself from the Book of Ara without inventing a human biography or delivering a feature list.
29. The connection task displays Microsoft 365 only while it is the sole live first-meeting connector.
30. Ara can schedule a future Teams meeting with a join link, but never claims she will join or call through Teams until a calling bot confirms that capability.
31. Ara answers with the considered thought itself and never says “let me think about how that impacts,” “let me think about what that means,” or a close paraphrase.
32. A rare soft “Mm.” or “Ah.” may bridge a real spoken pause, but it is never habitual or repeated on consecutive turns.
33. After arrival settles and before either person speaks, both Parallel bars remain white.
34. Ara's first spoken audio colors the left bar teal; that bar remains teal for the rest of the page session.
35. The member's first accepted speech colors the right bar blue; that bar remains blue for the rest of the page session.
36. Later speaking turns animate only the active bar and its soft side ambience; no line, beam, stream, wake flash, or funnel appears.
37. Reduced-motion mode preserves the truthful white-to-color state change without decorative motion.
38. Relationship memory may eventually include role, stakes, systems, communication, combined burden, and meaningful work, but Ara never asks for a missing field merely to complete coverage.
39. Ara does not ask the member to choose one painful channel when the evidence suggests cross-channel accumulation.
40. Ara offers a system-level synthesis as a hypothesis and allows correction before proposing any connection or change.
41. Ara does not offer an inbox, calendar, or priority fix “today” during the first relationship.
42. Ara's reciprocal introduction may be longer than an ordinary answer and is grounded in the Book of Ara rather than a feature list or invented biography.
43. Ara says she has what she needs only after the synthesis and reciprocal introduction are complete.
44. The shared-space integration control contains only connectors that are truly available and relates Microsoft 365 to the member's own stated systems when applicable.
45. After connection, Ara acknowledges the verified connection without repeating her operating philosophy and never implies access to everything the member does.
46. Ara never promises a follow-up invitation, message, or call unless a tool has actually created it.
47. Ara never asks `What are your pain points?`, `What's your biggest problem?`, or `What software do you use?` as an intake question.
48. A role statement receives a thoughtful, qualified inference and a light invitation to correct it; Ara does not immediately ask for another category of data.
49. The live first-conversation canvas shows no `What I'm learning` card, visible profile, checklist, or analytical notes.
50. The earned integration surface contains only `Microsoft 365` and one `Connect` action in the normal path.
51. Verified authentication receives human language such as `Perfect. You're connected.` rather than synchronization or setup language.
52. `begin_observation` requires the persisted reciprocal-introduction milestone, records quiet observation, explicitly leaves onboarding incomplete, and owns a soft goodbye without a final question.
53. At the end of the first conversation, the bars breathe once and Ara's visual presence fades into black.
54. Microsoft connection alone never completes onboarding; completion requires later evidence and sufficient understanding to begin protecting the person.
55. After `Tell me a little about yourself`, Ara responds to the detail the person chose to share with one direct, specific observation and at most one same-thread question.
56. Ara never says `Let me think about what that suggests for your day-to-day`, announces interpretation, or makes the person wait through a placeholder analysis sentence.
57. A personal disclosure receives personal curiosity; Ara does not automatically steer it toward work, systems, pain, or configuration.
58. A clearly heard preferred name triggers silent identity memory and Ara never asks for the name again in that turn.
59. Response-level instructions never replace the full Book-of-Ara first-meeting mission during an ordinary member turn.
60. Ara's operating philosophy is unavailable before confirmed synthesis, is persisted when shared, and cannot be delivered a second time after a refresh or resumed Microsoft handoff.

## Controlled personal calendar

1. A lunch, appointment, or focus block asks whether it should be private unless the user already chose.
2. Personal items contain no agenda or transcript request.
3. A stated location, address, doctor, reservation detail, or menu note is preserved without invention.
4. Privacy is resolved before a conflicting calendar item can be moved or declined.
5. The Graph payload uses `private` sensitivity only after the user chooses it.

## Meeting knowledge and ownership

1. One transcript source updates one meeting-memory record instead of creating duplicates.
2. Transcript actions retain the stated owner and source key.
3. Nick-owned work permits Ara to assist; another person's action is a dependency.
4. Unclear ownership remains unclear and does not authorize action.
5. A proposed delegation does not notify or impersonate the recipient.

## Desktop and outbound boundaries

1. A hosted desktop request is recorded as `awaiting_companion` and never reported as executed.
2. Teams chat remains a draft after user confirmation.
3. Outlook email sends only after a visible draft, clear natural confirmation, and opt-in `Mail.Send` access.
4. Failed or ambiguous recipient resolution leaves the email unsent.
5. Every sent or retained outbound message is recorded with its actual state.
