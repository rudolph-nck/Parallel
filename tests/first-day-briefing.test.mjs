import assert from "node:assert/strict";
import test from "node:test";

import { buildFirstDayScan } from "../app/lib/first-day-briefing.ts";

test("builds an evidence-based first-day readout with bounded coverage", () => {
  const scan = buildFirstDayScan({
    inboxTotal: 5_214,
    inboxUnread: 4_987,
    messages: [
      {
        id: "high",
        subject: "Failover decision needed",
        sender: "Noelle",
        receivedAt: "2026-08-03T14:00:00Z",
        importance: "high",
        isRead: false,
      },
      {
        id: "unread",
        subject: "Tickets waiting",
        sender: "Wes",
        receivedAt: "2026-08-03T13:00:00Z",
        importance: "normal",
        isRead: false,
      },
      {
        id: "routine",
        subject: "Newsletter",
        sender: "Updates",
        receivedAt: "2026-08-03T12:00:00Z",
        importance: "normal",
        isRead: true,
      },
    ],
    events: [
      { id: "one", subject: "Operations", start: "2026-08-04T14:00:00Z", end: "2026-08-04T15:00:00Z" },
      { id: "two", subject: "Upgrade", start: "2026-08-05T16:00:00Z", end: "2026-08-05T17:30:00Z" },
      { id: "all-day", subject: "Holiday", start: "2026-08-06T00:00:00Z", end: "2026-08-07T00:00:00Z", isAllDay: true },
      { id: "cancelled", subject: "Cancelled", start: "2026-08-07T14:00:00Z", end: "2026-08-07T15:00:00Z", isCancelled: true },
    ],
    windowStart: new Date("2026-08-03T12:00:00Z"),
    windowEnd: new Date("2026-08-17T12:00:00Z"),
    generatedAt: new Date("2026-08-03T12:00:00Z"),
  });

  assert.equal(scan.inbox.totalMessages, 5_214);
  assert.equal(scan.inbox.unreadMessages, 4_987);
  assert.equal(scan.inbox.sampledMessages, 3);
  assert.equal(scan.calendar.eventCount, 3);
  assert.equal(scan.calendar.scheduledHours, 2.5);
  assert.equal(scan.calendar.workingHours, 80);
  assert.equal(scan.calendar.meetingLoadPercent, 3);
  assert.deepEqual(scan.attentionCandidates.map((item) => item.id), ["high", "unread"]);
  assert.equal(scan.coverage.teamsMessages, "not_connected");
  assert.equal(scan.coverage.messageSampleLimit, 50);
  assert.equal(scan.coverage.calendarItemLimit, 100);
  assert.match(scan.scopeNote, /newest 50 messages/);
  assert.match(scan.scopeNote, /Teams messages are not included/);
});

test("never treats all-day or cancelled items as scheduled meeting hours", () => {
  const scan = buildFirstDayScan({
    inboxTotal: -2,
    inboxUnread: -1,
    messages: [],
    events: [
      { id: "all-day", subject: "Out", start: "2026-08-03T00:00:00Z", end: "2026-08-04T00:00:00Z", isAllDay: true },
      { id: "cancelled", subject: "No", start: "2026-08-03T14:00:00Z", end: "2026-08-03T15:00:00Z", isCancelled: true },
    ],
    windowStart: new Date("2026-08-03T12:00:00Z"),
    windowEnd: new Date("2026-08-04T12:00:00Z"),
  });

  assert.equal(scan.inbox.totalMessages, 0);
  assert.equal(scan.inbox.unreadMessages, 0);
  assert.equal(scan.calendar.scheduledHours, 0);
  assert.equal(scan.calendar.eventCount, 1);
});
