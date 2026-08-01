type CalendarPayloadProposal = {
  subject: string;
  purpose: string;
  start: string;
  end: string;
  attendees: Array<{ displayName: string; email: string }>;
  onlineMeeting: boolean;
  location: string;
  calendarItemType?: "meeting" | "lunch" | "appointment" | "focus";
  isPrivate?: boolean;
  address?: string;
  personalNotes?: string[];
  menuItems?: string[];
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
  const details = [
    proposal.purpose.trim()
      ? `<p>${escapeHtml(proposal.purpose.trim())}</p>`
      : "",
    proposal.location.trim()
      ? `<p><strong>Location:</strong> ${escapeHtml(proposal.location.trim())}</p>`
      : "",
    proposal.address?.trim()
      ? `<p><strong>Address:</strong> ${escapeHtml(proposal.address.trim())}</p>`
      : "",
    proposal.personalNotes?.length
      ? `<p><strong>Notes:</strong></p><ul>${proposal.personalNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`
      : "",
    proposal.menuItems?.length
      ? `<p><strong>Popular menu ideas:</strong></p><ul>${proposal.menuItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : "",
  ].filter(Boolean);
  const mapQuery = [proposal.location, proposal.address].filter(Boolean).join(" ");
  if (mapQuery && proposal.calendarItemType !== "meeting") {
    details.push(`<p><a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(mapQuery)}">Open location in Maps</a></p>`);
  }
  if (proposal.location && proposal.calendarItemType === "lunch") {
    details.push(`<p><a href="https://www.google.com/search?q=${encodeURIComponent(`${proposal.location} menu popular items`)}">Explore the menu and popular items</a></p>`);
  }
  return {
    subject: proposal.subject,
    body: {
      contentType: "html",
      content: preparedBody ?? details.join(""),
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
    sensitivity: proposal.isPrivate ? "private" : "normal",
    transactionId,
  };
}
