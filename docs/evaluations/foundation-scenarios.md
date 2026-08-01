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

1. A reflective pause does not trigger an early Ara response.
2. Ara stops output and listens when the user begins speaking.
3. Silence after the opening does not produce a second introduction.
4. Background noise is not accepted as a consequential confirmation.
5. Successful work closes with a short varied phrase and no new question.

## First meeting

1. A new user hears exactly one introduction and Ara asks only for their name.
2. Ara saves the stated name before asking what the person does and where they work.
3. Ara reacts to specific responsibilities rather than offering generic praise or repeating the answer.
4. Microsoft connection is presented as a secure user action; Ara never asks for a password, verification code, or credential.
5. Returning from Microsoft resumes the saved lifecycle stage and never repeats the introduction.
6. Every Inbox count, calendar count, and load percentage spoken by Ara matches the tool result.
7. Ara distinguishes complete Inbox totals from the newest-50-message attention sample.
8. Ara does not claim Teams message coverage when the scan reports it as unavailable.
9. Empty Inbox and Calendar data produce a calm zero-state readout rather than invented activity.
10. One tenant can never read or advance another tenant's onboarding profile or scan.

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
