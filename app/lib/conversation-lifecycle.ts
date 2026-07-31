export const CONVERSATION_STATES = [
  "IDLE",
  "CONNECTING",
  "GREETING",
  "LISTENING",
  "THINKING",
  "TOOL_PENDING",
  "RESPONDING",
  "AWAITING_CONFIRMATION",
  "WRAP_UP",
  "DISCONNECTING",
  "CLOSED",
] as const;

export type ConversationLifecycleState =
  (typeof CONVERSATION_STATES)[number];

export type ConversationLifecycleEvent =
  | "START_CONNECTING"
  | "CONNECTION_OPEN"
  | "USER_SPEECH_STARTED"
  | "USER_SPEECH_STOPPED"
  | "RESPONSE_STARTED"
  | "TOOL_STARTED"
  | "TOOL_COMPLETED"
  | "APPROVAL_REQUIRED"
  | "RESPONSE_COMPLETED"
  | "AUDIO_DRAINED"
  | "BEGIN_WRAP_UP"
  | "INTERRUPT_WRAP_UP"
  | "BEGIN_DISCONNECT"
  | "SESSION_CLOSED"
  | "RECOVERABLE_ERROR";

export const conversationPolicy = {
  closingInterruptionWindowMs: 1_500,
  maxAudioDrainWaitMs: 6_000,
  maxIdleMs: 45_000,
  maxStoredSessions: 25,
  requireSuccessfulAction: true,
} as const;

export function transitionConversationState(
  state: ConversationLifecycleState,
  event: ConversationLifecycleEvent,
): ConversationLifecycleState {
  if (event === "BEGIN_DISCONNECT") return "DISCONNECTING";
  if (event === "SESSION_CLOSED") return "CLOSED";
  if (event === "START_CONNECTING") return "CONNECTING";

  if (state === "IDLE" || state === "CLOSED") return state;

  switch (event) {
    case "CONNECTION_OPEN":
      return "GREETING";
    case "USER_SPEECH_STARTED":
    case "INTERRUPT_WRAP_UP":
      return "LISTENING";
    case "USER_SPEECH_STOPPED":
      return "THINKING";
    case "RESPONSE_STARTED":
      return "RESPONDING";
    case "TOOL_STARTED":
      return "TOOL_PENDING";
    case "TOOL_COMPLETED":
      return "THINKING";
    case "APPROVAL_REQUIRED":
      return "AWAITING_CONFIRMATION";
    case "AUDIO_DRAINED":
    case "RESPONSE_COMPLETED":
    case "RECOVERABLE_ERROR":
      return "LISTENING";
    case "BEGIN_WRAP_UP":
      return "WRAP_UP";
    default:
      return state;
  }
}

export type CompletionSnapshot = {
  successfulAction: boolean;
  toolPendingCount: number;
  approvalPending: boolean;
  responseCompleted: boolean;
  unresolvedQuestion: boolean;
  recoverableError: boolean;
};

export function canBeginAutonomousWrapUp(
  snapshot: CompletionSnapshot,
): boolean {
  return (
    snapshot.successfulAction &&
    snapshot.toolPendingCount === 0 &&
    !snapshot.approvalPending &&
    snapshot.responseCompleted &&
    !snapshot.unresolvedQuestion &&
    !snapshot.recoverableError
  );
}

export function canScheduleAutonomousDisconnect(input: {
  state: ConversationLifecycleState;
  outputAudioDrained: boolean;
  toolPendingCount: number;
  approvalPending: boolean;
}): boolean {
  return (
    input.state === "WRAP_UP" &&
    input.outputAudioDrained &&
    input.toolPendingCount === 0 &&
    !input.approvalPending
  );
}

export function responseEndsWithQuestion(transcript: string): boolean {
  return /\?\s*[”"']?\s*$/.test(transcript.trim());
}

export type RealtimeUsage = {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  inputAudioTokens: number;
  outputAudioTokens: number;
};

export const emptyRealtimeUsage = (): RealtimeUsage => ({
  totalTokens: 0,
  inputTokens: 0,
  outputTokens: 0,
  cachedInputTokens: 0,
  inputAudioTokens: 0,
  outputAudioTokens: 0,
});

function finiteNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function normalizeRealtimeUsage(value: unknown): RealtimeUsage {
  if (!value || typeof value !== "object") return emptyRealtimeUsage();

  const usage = value as Record<string, unknown>;
  const inputDetails =
    usage.input_token_details && typeof usage.input_token_details === "object"
      ? (usage.input_token_details as Record<string, unknown>)
      : {};
  const outputDetails =
    usage.output_token_details && typeof usage.output_token_details === "object"
      ? (usage.output_token_details as Record<string, unknown>)
      : {};

  return {
    totalTokens: finiteNumber(usage.total_tokens),
    inputTokens: finiteNumber(usage.input_tokens),
    outputTokens: finiteNumber(usage.output_tokens),
    cachedInputTokens: finiteNumber(inputDetails.cached_tokens),
    inputAudioTokens: finiteNumber(inputDetails.audio_tokens),
    outputAudioTokens: finiteNumber(outputDetails.audio_tokens),
  };
}

export function addRealtimeUsage(
  current: RealtimeUsage,
  additional: RealtimeUsage,
): RealtimeUsage {
  return {
    totalTokens: current.totalTokens + additional.totalTokens,
    inputTokens: current.inputTokens + additional.inputTokens,
    outputTokens: current.outputTokens + additional.outputTokens,
    cachedInputTokens:
      current.cachedInputTokens + additional.cachedInputTokens,
    inputAudioTokens: current.inputAudioTokens + additional.inputAudioTokens,
    outputAudioTokens:
      current.outputAudioTokens + additional.outputAudioTokens,
  };
}

export type SessionCloseReason =
  | "completed_action"
  | "idle_timeout"
  | "manual"
  | "connection_ended"
  | "start_failed";

export type SessionToolResult = {
  name: string;
  succeeded: boolean;
};

export type ConversationSessionDraft = {
  sessionId: string;
  startedAtMs: number;
  tools: SessionToolResult[];
  errorCount: number;
  usage: RealtimeUsage;
};

export type ConversationSessionRecord = {
  sessionId: string;
  tenantId: "tenant_demo_parallel";
  personId: "person_nick_rudolph";
  userAccountId: "user_nick";
  aiEmployeeId: "ai_employee_ara_nick";
  provider: "openai";
  modelTier: "voice_reasoning";
  modelId: "gpt-realtime-2.1";
  startedAt: string;
  endedAt: string;
  durationMs: number;
  closeReason: SessionCloseReason;
  tools: SessionToolResult[];
  successfulToolCount: number;
  errorCount: number;
  usage: RealtimeUsage;
};

export function startConversationSession(
  sessionId: string,
  startedAtMs = Date.now(),
): ConversationSessionDraft {
  return {
    sessionId,
    startedAtMs,
    tools: [],
    errorCount: 0,
    usage: emptyRealtimeUsage(),
  };
}

export function finishConversationSession(
  draft: ConversationSessionDraft,
  closeReason: SessionCloseReason,
  endedAtMs = Date.now(),
): ConversationSessionRecord {
  return {
    sessionId: draft.sessionId,
    tenantId: "tenant_demo_parallel",
    personId: "person_nick_rudolph",
    userAccountId: "user_nick",
    aiEmployeeId: "ai_employee_ara_nick",
    provider: "openai",
    modelTier: "voice_reasoning",
    modelId: "gpt-realtime-2.1",
    startedAt: new Date(draft.startedAtMs).toISOString(),
    endedAt: new Date(endedAtMs).toISOString(),
    durationMs: Math.max(0, endedAtMs - draft.startedAtMs),
    closeReason,
    tools: [...draft.tools],
    successfulToolCount: draft.tools.filter((tool) => tool.succeeded).length,
    errorCount: draft.errorCount,
    usage: { ...draft.usage },
  };
}

export function formatSessionDuration(durationMs: number): string {
  const seconds = Math.max(1, Math.round(durationMs / 1_000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
