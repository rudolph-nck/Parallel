export type FirstDayMailSignal = {
  id: string;
  subject: string;
  sender: string;
  receivedAt: string | null;
  importance: "low" | "normal" | "high";
  isRead: boolean;
};

export type FirstDayCalendarSignal = {
  id: string;
  subject: string;
  start: string;
  end: string;
  isAllDay?: boolean;
  isCancelled?: boolean;
};

export type FirstDayAttentionCandidate = {
  id: string;
  subject: string;
  sender: string;
  receivedAt: string | null;
  reason: string;
  priority: "high" | "medium";
};

export type FirstDayScan = {
  generatedAt: string;
  window: {
    start: string;
    end: string;
    label: string;
  };
  inbox: {
    totalMessages: number;
    unreadMessages: number;
    sampledMessages: number;
    unreadInSample: number;
    highImportanceInSample: number;
  };
  calendar: {
    eventCount: number;
    scheduledHours: number;
    workingHours: number;
    meetingLoadPercent: number;
  };
  attentionCandidates: FirstDayAttentionCandidate[];
  coverage: {
    outlookMail: "live";
    outlookCalendar: "live";
    teamsMessages: "not_connected";
    messageSampleLimit: number;
    calendarItemLimit: number;
  };
  scopeNote: string;
};

const roundOne = (value: number) => Math.round(value * 10) / 10;

const countWeekdays = (start: Date, end: Date) => {
  let count = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const boundary = new Date(end);
  boundary.setHours(0, 0, 0, 0);
  while (cursor < boundary) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
};

const safeDurationHours = (event: FirstDayCalendarSignal) => {
  if (event.isAllDay || event.isCancelled) return 0;
  const start = Date.parse(event.start);
  const end = Date.parse(event.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.min(8, (end - start) / 3_600_000);
};

export function buildFirstDayScan({
  inboxTotal,
  inboxUnread,
  messages,
  events,
  windowStart,
  windowEnd,
  generatedAt = new Date(),
}: {
  inboxTotal: number;
  inboxUnread: number;
  messages: FirstDayMailSignal[];
  events: FirstDayCalendarSignal[];
  windowStart: Date;
  windowEnd: Date;
  generatedAt?: Date;
}): FirstDayScan {
  const workingHours = countWeekdays(windowStart, windowEnd) * 8;
  const scheduledHours = roundOne(
    events.reduce((total, event) => total + safeDurationHours(event), 0),
  );
  const meetingLoadPercent = workingHours
    ? Math.min(100, Math.round((scheduledHours / workingHours) * 100))
    : 0;

  const attentionCandidates = messages
    .filter((message) => message.importance === "high" || !message.isRead)
    .sort((left, right) => {
      const priority = Number(right.importance === "high") - Number(left.importance === "high");
      if (priority !== 0) return priority;
      return Date.parse(right.receivedAt ?? "") - Date.parse(left.receivedAt ?? "");
    })
    .slice(0, 5)
    .map<FirstDayAttentionCandidate>((message) => ({
      id: message.id,
      subject: message.subject || "Message without a subject",
      sender: message.sender || "Unknown sender",
      receivedAt: message.receivedAt,
      reason:
        message.importance === "high"
          ? message.isRead
            ? "Marked high importance"
            : "Unread and marked high importance"
          : "Unread in the recent Inbox sample",
      priority: message.importance === "high" ? "high" : "medium",
    }));

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  return {
    generatedAt: generatedAt.toISOString(),
    window: {
      start: windowStart.toISOString(),
      end: windowEnd.toISOString(),
      label: `${formatter.format(windowStart)}–${formatter.format(windowEnd)}`,
    },
    inbox: {
      totalMessages: Math.max(0, Math.trunc(inboxTotal)),
      unreadMessages: Math.max(0, Math.trunc(inboxUnread)),
      sampledMessages: messages.length,
      unreadInSample: messages.filter((message) => !message.isRead).length,
      highImportanceInSample: messages.filter((message) => message.importance === "high").length,
    },
    calendar: {
      eventCount: events.filter((event) => !event.isCancelled).length,
      scheduledHours,
      workingHours,
      meetingLoadPercent,
    },
    attentionCandidates,
    coverage: {
      outlookMail: "live",
      outlookCalendar: "live",
      teamsMessages: "not_connected",
      messageSampleLimit: 50,
      calendarItemLimit: 100,
    },
    scopeNote:
      "Inbox totals are complete. Attention candidates come from the newest 50 messages, Calendar covers up to 100 items over the next 14 days, and Teams messages are not included yet.",
  };
}
