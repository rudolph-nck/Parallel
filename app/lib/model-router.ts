export type ModelTier = "A" | "B" | "C" | "D";

export type ModelRouteInput = {
  task: "policy_check" | "attention_classification" | "preference_extraction" | "voice_conversation" | "deep_synthesis";
  modality?: "none" | "text" | "audio";
  ambiguity?: "low" | "medium" | "high";
  risk?: "low" | "medium" | "high";
  confidence?: number;
};

export type ModelRouteDecision = {
  tier: ModelTier;
  model: string;
  reason: string;
  escalated: boolean;
};

export const routeModelTask = (input: ModelRouteInput): ModelRouteDecision => {
  if (input.task === "policy_check") {
    return { tier: "A", model: "deterministic", reason: "Policy checks use explicit rules.", escalated: false };
  }

  if (input.modality === "audio" || input.task === "voice_conversation") {
    return { tier: "C", model: "gpt-realtime-2.1", reason: "Live voice requires the realtime route.", escalated: false };
  }

  const needsDeepReasoning =
    input.task === "deep_synthesis" ||
    input.risk === "high" ||
    input.ambiguity === "high" ||
    (input.confidence ?? 1) < 0.55;

  if (needsDeepReasoning) {
    return { tier: "D", model: "premium-reasoning", reason: "High impact, ambiguity, or low confidence requires deeper reasoning.", escalated: true };
  }

  return { tier: "B", model: "fast-utility", reason: "A focused utility task can use the efficient text route.", escalated: false };
};

export const estimatedUsageUnits = (usage: {
  inputTokens?: number;
  outputTokens?: number;
  audioTokens?: number;
}) => Math.max(0, Math.round(
  (usage.inputTokens ?? 0) +
  (usage.outputTokens ?? 0) * 3 +
  (usage.audioTokens ?? 0) * 8,
));
