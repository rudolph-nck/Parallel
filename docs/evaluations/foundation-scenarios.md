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
