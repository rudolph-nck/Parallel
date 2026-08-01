import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeMeetingAgenda,
  normalizeAgendaItems,
  scoreMeetingReference,
} from "../app/lib/meeting-artifacts.ts";

test("preserves the Teams meeting body while appending a safe agenda", () => {
  const result = mergeMeetingAgenda(
    { contentType: "html", content: '<div data-tid="meeting">Join Teams</div>' },
    ["Review failover scope", "Assign owners"],
    "Agree on the failover plan.",
  );

  assert.match(result.content, /data-tid="meeting"/);
  assert.match(result.content, /Review failover scope/);
  assert.match(result.content, /Prepared with Ara/);
});

test("replaces Ara's previous agenda instead of duplicating it", () => {
  const first = mergeMeetingAgenda(null, ["Old item"]);
  const second = mergeMeetingAgenda(first, ["New item"]);

  assert.doesNotMatch(second.content, /Old item/);
  assert.equal(second.content.match(/parallel-agenda:start/g)?.length, 1);
});

test("normalizes duplicate spoken agenda items", () => {
  assert.deepEqual(
    normalizeAgendaItems(["1. Review risks", "Review risks", "- Confirm owners"]),
    ["Review risks", "Confirm owners"],
  );
});

test("matches an existing meeting by topic or attendee", () => {
  assert.equal(
    scoreMeetingReference("the failover meeting with Matt", {
      subject: "Failover planning",
      attendeeNames: ["Matt Walsh"],
    }),
    2,
  );
});
