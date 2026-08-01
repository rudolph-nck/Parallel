import assert from "node:assert/strict";
import test from "node:test";

import { estimatedUsageUnits, routeModelTask } from "../app/lib/model-router.ts";
import { buildReadOnlyAttentionItems } from "../app/lib/parallel-platform.ts";
import { resolveWorkOwnership } from "../app/lib/ownership.ts";

test("routes deterministic, utility, realtime, and deep work to explicit tiers", () => {
  assert.equal(routeModelTask({ task: "policy_check" }).tier, "A");
  assert.equal(routeModelTask({ task: "attention_classification", risk: "low" }).tier, "B");
  assert.equal(routeModelTask({ task: "voice_conversation", modality: "audio" }).tier, "C");
  assert.equal(routeModelTask({ task: "deep_synthesis", ambiguity: "high" }).tier, "D");
});

test("escalates low-confidence utility work and meters weighted usage", () => {
  const route = routeModelTask({
    task: "preference_extraction",
    confidence: 0.4,
  });

  assert.equal(route.tier, "D");
  assert.equal(route.escalated, true);
  assert.equal(estimatedUsageUnits({ inputTokens: 100, outputTokens: 20, audioTokens: 5 }), 200);
});

test("attention monitoring only surfaces unread or high-priority messages and near meetings", () => {
  const now = Date.parse("2026-08-01T12:00:00Z");
  const items = buildReadOnlyAttentionItems({
    recentMessages: [
      { id: "m1", subject: "Client escalation", importance: "high", isRead: true, receivedDateTime: "2026-08-01T11:00:00Z" },
      { id: "m2", subject: "Unread note", importance: "normal", isRead: false, receivedDateTime: "2026-08-01T10:00:00Z" },
      { id: "m3", subject: "Routine", importance: "normal", isRead: true, receivedDateTime: "2026-08-01T09:00:00Z" },
    ],
    upcomingEvents: [
      { id: "e1", subject: "Failover review", start: { dateTime: "2026-08-01T14:00:00Z" } },
      { id: "e2", subject: "Later meeting", start: { dateTime: "2026-08-03T14:00:00Z" } },
    ],
  }, now);

  assert.deepEqual(items.map((item) => item.externalId), ["e1", "m1", "m2"]);
  assert.equal(items[0].urgency, "high");
});

test("keeps Nick-owned work separate from another person's dependency", () => {
  const own = resolveWorkOwnership("Nick");
  const dependency = resolveWorkOwnership("Noelle");
  const unclear = resolveWorkOwnership("Unclear");

  assert.equal(own.role, "owner");
  assert.equal(own.araMayAct, true);
  assert.equal(dependency.role, "dependency");
  assert.equal(dependency.araMayAct, false);
  assert.equal(unclear.role, "unclear");
  assert.equal(unclear.araMayAct, false);
});
