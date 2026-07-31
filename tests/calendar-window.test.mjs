import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveCalendarReadWindow,
  resolveSchedulingWindow,
} from "../app/lib/calendar-window.ts";

const friday = new Date(2026, 6, 31, 10, 0, 0, 0);

test("reads next week as the complete following Monday-to-Monday range", () => {
  const window = resolveCalendarReadWindow("next week", friday);

  assert.equal(window.start.getDay(), 1);
  assert.equal(window.start.getDate(), 3);
  assert.equal(window.start.getHours(), 0);
  assert.equal(window.end.getDay(), 1);
  assert.equal(window.end.getDate(), 10);
});

test("schedules next week inside Monday-to-Friday working hours", () => {
  const window = resolveSchedulingWindow("sometime next week", friday);

  assert.equal(window.start.getDay(), 1);
  assert.equal(window.start.getDate(), 3);
  assert.equal(window.start.getHours(), 9);
  assert.equal(window.end.getDay(), 5);
  assert.equal(window.end.getDate(), 7);
  assert.equal(window.end.getHours(), 17);
});

test("keeps before-next-Wednesday as a deadline instead of a single day", () => {
  const window = resolveSchedulingWindow("before next Wednesday", friday);

  assert.equal(window.start.getTime(), friday.getTime());
  assert.equal(window.end.getDay(), 3);
  assert.equal(window.end.getDate(), 5);
  assert.equal(window.end.getHours(), 17);
});
