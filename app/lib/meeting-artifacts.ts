export type MeetingBody = {
  contentType?: string;
  content?: string;
};

const HTML_AGENDA_PATTERN =
  /<!-- parallel-agenda:start -->[\s\S]*?<!-- parallel-agenda:end -->/i;
const TEXT_AGENDA_PATTERN =
  /\[Parallel agenda:start\][\s\S]*?\[Parallel agenda:end\]/i;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function normalizeAgendaItems(items: string[]) {
  const unique = new Set<string>();
  for (const item of items) {
    const normalized = item.replace(/^[-*\d.)\s]+/, "").trim().slice(0, 240);
    if (normalized) unique.add(normalized);
  }
  return [...unique].slice(0, 10);
}

export function mergeMeetingAgenda(
  body: MeetingBody | null | undefined,
  agendaItems: string[],
  objective?: string,
): Required<MeetingBody> {
  const normalizedItems = normalizeAgendaItems(agendaItems);
  const contentType = body?.contentType?.toLowerCase() === "text" ? "text" : "html";
  const current = body?.content ?? "";

  if (contentType === "text") {
    const objectiveLine = objective?.trim()
      ? `\nObjective\n${objective.trim()}\n`
      : "";
    const agenda = [
      "[Parallel agenda:start]",
      "Agenda",
      objectiveLine,
      ...normalizedItems.map((item, index) => `${index + 1}. ${item}`),
      "",
      "Prepared with Ara in Parallel",
      "[Parallel agenda:end]",
    ]
      .filter(Boolean)
      .join("\n");
    return {
      contentType: "text",
      content: TEXT_AGENDA_PATTERN.test(current)
        ? current.replace(TEXT_AGENDA_PATTERN, agenda)
        : `${current.trim()}\n\n${agenda}`.trim(),
    };
  }

  const objectiveBlock = objective?.trim()
    ? `<p><strong>Objective</strong><br>${escapeHtml(objective.trim())}</p>`
    : "";
  const agenda = [
    "<!-- parallel-agenda:start -->",
    '<div style="margin-top:24px;padding:18px;border-left:3px solid #65a7ff;background:#f5f8fc;">',
    '<h2 style="margin:0 0 12px;font-size:18px;">Agenda</h2>',
    objectiveBlock,
    "<ol>",
    ...normalizedItems.map((item) => `<li>${escapeHtml(item)}</li>`),
    "</ol>",
    '<p style="margin:12px 0 0;color:#64748b;font-size:12px;">Prepared with Ara in Parallel</p>',
    "</div>",
    "<!-- parallel-agenda:end -->",
  ].join("");

  return {
    contentType: "html",
    content: HTML_AGENDA_PATTERN.test(current)
      ? current.replace(HTML_AGENDA_PATTERN, agenda)
      : `${current}${agenda}`,
  };
}

export function scoreMeetingReference(
  reference: string,
  meeting: { subject?: string; attendeeNames?: string[] },
) {
  const terms = reference
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 3 && !["meeting", "invite", "calendar", "with", "about", "that", "this"].includes(term));
  if (terms.length === 0) return 0;
  const haystack = [meeting.subject ?? "", ...(meeting.attendeeNames ?? [])]
    .join(" ")
    .toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}
