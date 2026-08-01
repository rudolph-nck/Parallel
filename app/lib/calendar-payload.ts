type CalendarPayloadProposal = {
  subject: string;
  purpose: string;
  start: string;
  end: string;
  attendees: Array<{ displayName: string; email: string }>;
  onlineMeeting: boolean;
  location: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function buildMicrosoftCalendarPayload(
  proposal: CalendarPayloadProposal,
  transactionId: string,
  preparedBody?: string,
) {
  const simpleBody = proposal.purpose.trim()
    ? `<p>${escapeHtml(proposal.purpose.trim())}</p>`
    : "";
  return {
    subject: proposal.subject,
    body: {
      contentType: "html",
      content: preparedBody ?? simpleBody,
    },
    start: {
      dateTime: proposal.start.replace(/Z$/, ""),
      timeZone: "UTC",
    },
    end: {
      dateTime: proposal.end.replace(/Z$/, ""),
      timeZone: "UTC",
    },
    attendees: proposal.attendees.map((attendee) => ({
      emailAddress: {
        address: attendee.email,
        name: attendee.displayName,
      },
      type: "required",
    })),
    allowNewTimeProposals: true,
    isOnlineMeeting: proposal.onlineMeeting,
    onlineMeetingProvider: proposal.onlineMeeting
      ? "teamsForBusiness"
      : undefined,
    location: proposal.location
      ? { displayName: proposal.location }
      : undefined,
    transactionId,
  };
}
