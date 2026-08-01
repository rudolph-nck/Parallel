import type { FirstDayScan } from "./first-day-briefing";

export type DecisionProfile = {
  morning_briefing_time: string;
  role_and_responsibilities: string;
  current_priorities: string;
  communication_style: string;
  proactivity: string;
  interruption_threshold: string;
  accountability_style: string;
  delegation_boundaries: string;
};

export type OnboardingLifecycleState =
  | "NEW"
  | "NAME_LEARNED"
  | "WORK_CONTEXT_LEARNED"
  | "CONNECTION_READY"
  | "FIRST_VALUE_DELIVERED"
  | "COMPLETE";

export type OnboardingProfile = {
  lifecycle_state: OnboardingLifecycleState;
  preferred_name: string;
  full_name: string;
  company: string;
  job_title: string;
  role_summary: string;
  team_size: number | null;
  responsibilities: string[];
  biggest_pressure: string;
  microsoft_connected: boolean;
  first_day_scan: FirstDayScan | null;
  completed_at: number | null;
};

export type AttentionItem = {
  id?: string;
  source: "outlook" | "calendar" | "teams";
  externalId: string;
  kind: "message" | "meeting" | "signal";
  title: string;
  summary: string;
  urgency: "high" | "medium" | "low";
  state?: "open" | "dismissed";
  reason: string;
  occurredAt: number;
};

export type Commitment = {
  id: string;
  title: string;
  ownerLabel: string;
  dueAt: number | null;
  status: "open" | "completed" | "snoozed";
  source: string;
  feedback: string | null;
};

export type PlatformWorkspace = {
  profile: DecisionProfile;
  onboarding: OnboardingProfile;
  policies: Array<{ key: string; value: string; scope: string; precedence: number }>;
  attention: AttentionItem[];
  commitments: Commitment[];
  usage: { sessions: number; totalTokens: number; usageUnits: number; tierC: number; tierD: number };
  capabilities: {
    meetingKnowledge: number;
    ownedWork: number;
    dependencies: number;
    pendingDelegations: number;
    desktopRequests: number;
    outboundSent: number;
  };
  recentMeetingKnowledge: Array<{
    id: string;
    subject: string;
    summary: string;
    lifecycleState: string;
    updatedAt: number;
  }>;
};

type AttentionSnapshot = {
  recentMessages: Array<{
    id: string;
    subject?: string;
    receivedDateTime?: string;
    importance?: "low" | "normal" | "high";
    isRead?: boolean;
    from?: { emailAddress?: { name?: string } };
  }>;
  upcomingEvents: Array<{
    id: string;
    subject?: string;
    start?: { dateTime?: string };
    displayTime?: string;
  }>;
};

export const buildReadOnlyAttentionItems = (
  snapshot: AttentionSnapshot,
  nowMs = Date.now(),
): AttentionItem[] => {
  const messages = snapshot.recentMessages
    .filter((message) => message.importance === "high" || !message.isRead)
    .map<AttentionItem>((message) => ({
      source: "outlook",
      externalId: message.id,
      kind: "message",
      title: message.subject?.trim() || "Message without a subject",
      summary: `${message.from?.emailAddress?.name ?? "Someone"} · ${message.isRead ? "read" : "unread"}`,
      urgency: message.importance === "high" ? "high" : "medium",
      reason: message.importance === "high" ? "Marked high importance" : "Unread and may need follow-through",
      occurredAt: Date.parse(message.receivedDateTime ?? "") || nowMs,
    }));

  const meetings = snapshot.upcomingEvents.flatMap<AttentionItem>((event) => {
    const start = Date.parse(event.start?.dateTime ?? "");
    if (!Number.isFinite(start) || start < nowMs) return [];
    const hoursAway = (start - nowMs) / 3_600_000;
    if (hoursAway > 24) return [];
    return [{
      source: "calendar",
      externalId: event.id,
      kind: "meeting",
      title: event.subject?.trim() || "Upcoming meeting",
      summary: event.displayTime ?? new Date(start).toLocaleString(),
      urgency: hoursAway <= 4 ? "high" : "medium",
      reason: hoursAway <= 4 ? "Starts within four hours" : "Starts within the next day",
      occurredAt: start,
    }];
  });

  const rank = { high: 0, medium: 1, low: 2 } as const;
  return [...messages, ...meetings]
    .sort((a, b) => rank[a.urgency] - rank[b.urgency] || b.occurredAt - a.occurredAt)
    .slice(0, 12);
};

export async function readPlatformWorkspace(): Promise<PlatformWorkspace> {
  const response = await fetch("/api/platform/", { cache: "no-store" });
  if (!response.ok) throw new Error("Parallel's workspace could not be loaded.");
  return response.json() as Promise<PlatformWorkspace>;
}

export async function updatePlatform(action: string, payload: Record<string, unknown> = {}) {
  const response = await fetch("/api/platform/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!response.ok) throw new Error("Parallel could not save that update.");
  return response.json() as Promise<Record<string, unknown>>;
}
