import assert from "node:assert/strict";
import test from "node:test";

import {
  addRealtimeUsage,
  canBeginAutonomousWrapUp,
  canScheduleAutonomousDisconnect,
  finishConversationSession,
  normalizeRealtimeUsage,
  responseEndsWithQuestion,
  startConversationSession,
  transitionConversationState,
} from "../app/lib/conversation-lifecycle.ts";

test("moves through the explicit voice lifecycle", () => {
  let state = transitionConversationState("IDLE", "START_CONNECTING");
  state = transitionConversationState(state, "CONNECTION_OPEN");
  state = transitionConversationState(state, "RESPONSE_STARTED");
  state = transitionConversationState(state, "AUDIO_DRAINED");

  assert.equal(state, "LISTENING");
  assert.equal(
    transitionConversationState("WRAP_UP", "INTERRUPT_WRAP_UP"),
    "LISTENING",
  );
});

test("requires successful, settled work before autonomous wrap-up", () => {
  const settled = {
    successfulAction: true,
    toolPendingCount: 0,
    approvalPending: false,
    responseCompleted: true,
    unresolvedQuestion: false,
    recoverableError: false,
  };

  assert.equal(canBeginAutonomousWrapUp(settled), true);
  assert.equal(
    canBeginAutonomousWrapUp({ ...settled, toolPendingCount: 1 }),
    false,
  );
  assert.equal(
    canBeginAutonomousWrapUp({ ...settled, approvalPending: true }),
    false,
  );
  assert.equal(
    canBeginAutonomousWrapUp({ ...settled, recoverableError: true }),
    false,
  );
});

test("waits for drained audio and permits a closing interruption", () => {
  assert.equal(
    canScheduleAutonomousDisconnect({
      state: "WRAP_UP",
      outputAudioDrained: false,
      toolPendingCount: 0,
      approvalPending: false,
    }),
    false,
  );
  assert.equal(
    canScheduleAutonomousDisconnect({
      state: "WRAP_UP",
      outputAudioDrained: true,
      toolPendingCount: 0,
      approvalPending: false,
    }),
    true,
  );
});

test("detects unresolved spoken questions", () => {
  assert.equal(responseEndsWithQuestion("How does that sound?"), true);
  assert.equal(responseEndsWithQuestion("Done."), false);
});

test("normalizes and accumulates Realtime billing usage", () => {
  const first = normalizeRealtimeUsage({
    total_tokens: 30,
    input_tokens: 20,
    output_tokens: 10,
    input_token_details: { cached_tokens: 4, audio_tokens: 12 },
    output_token_details: { audio_tokens: 8 },
  });
  const total = addRealtimeUsage(
    first,
    normalizeRealtimeUsage({ total_tokens: 5, output_tokens: 5 }),
  );

  assert.equal(total.totalTokens, 35);
  assert.equal(total.cachedInputTokens, 4);
  assert.equal(total.inputAudioTokens, 12);
  assert.equal(total.outputAudioTokens, 8);
});

test("final session receipt records duration, model, tools, and errors", () => {
  const draft = startConversationSession("session_test", 1_000);
  draft.tools.push({ name: "approve_calendar_meeting", succeeded: true });
  draft.errorCount = 1;
  draft.usage = normalizeRealtimeUsage({ total_tokens: 42 });

  const record = finishConversationSession(
    draft,
    "completed_action",
    6_500,
  );

  assert.equal(record.durationMs, 5_500);
  assert.equal(record.modelTier, "voice_reasoning");
  assert.equal(record.successfulToolCount, 1);
  assert.equal(record.errorCount, 1);
  assert.equal(record.usage.totalTokens, 42);
});
