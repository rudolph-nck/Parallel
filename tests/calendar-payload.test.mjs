import assert from "node:assert/strict";
import test from "node:test";

import { buildMicrosoftCalendarPayload } from "../app/lib/calendar-payload.ts";

const baseProposal = {
  subject: "Lunch with Steph",
  purpose: "Catch up over lunch.",
  agendaItems: [],
  enableTranscription: false,
  attendees: [],
  start: "2026-08-07T18:00:00.000Z",
  end: "2026-08-07T19:00:00.000Z",
  deadline: "2026-08-07T21:00:00.000Z",
  durationMinutes: 60,
  displayTime: "Friday, Aug 7, 2:00–3:00 PM EDT",
  calendarItemType: "lunch",
  onlineMeeting: false,
  location: "",
  exactRequestedTime: true,
};

test("writes the same absolute UTC slot that Ara proposed", () => {
  const payload = buildMicrosoftCalendarPayload(baseProposal, "stable-id");

  assert.deepEqual(payload.start, {
    dateTime: "2026-08-07T18:00:00.000",
    timeZone: "UTC",
  });
  assert.deepEqual(payload.end, {
    dateTime: "2026-08-07T19:00:00.000",
    timeZone: "UTC",
  });
  assert.equal(payload.transactionId, "stable-id");
});

test("keeps a personal lunch on Nick's calendar without a Teams link", () => {
  const payload = buildMicrosoftCalendarPayload(baseProposal, "personal-id");

  assert.equal(payload.isOnlineMeeting, false);
  assert.deepEqual(payload.attendees, []);
  assert.equal(payload.onlineMeetingProvider, undefined);
  assert.match(payload.body.content, /Catch up over lunch/);
  assert.doesNotMatch(payload.body.content, /Agenda/);
});

test("creates a Teams meeting only when the proposal requests one", () => {
  const payload = buildMicrosoftCalendarPayload(
    {
      ...baseProposal,
      subject: "Ticket review",
      calendarItemType: "meeting",
      onlineMeeting: true,
      attendees: [{ displayName: "Noelle", email: "noelle@example.com" }],
      agendaItems: ["Review open tickets"],
    },
    "meeting-id",
    "<p>Review open tickets</p>",
  );

  assert.equal(payload.isOnlineMeeting, true);
  assert.equal(payload.onlineMeetingProvider, "teamsForBusiness");
  assert.equal(payload.attendees.length, 1);
  assert.match(payload.body.content, /Review open tickets/);
});
