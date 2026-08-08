"use client";

import {
  PublicClientApplication,
  type AccountInfo,
} from "@azure/msal-browser";
import {
  resolveDirectoryPerson,
  splitAttendeeNames,
  type DirectoryPerson,
} from "./people";
import {
  resolveCalendarReadWindow,
  resolveRequestedCalendarSlot,
  resolveSchedulingWindow,
} from "./calendar-window";
import {
  describeMicrosoftCalendarError,
  type MicrosoftCalendarAccessIssue,
} from "./microsoft-access";
import {
  mergeMeetingAgenda,
  normalizeAgendaItems,
  scoreMeetingReference,
} from "./meeting-artifacts";
import { buildMicrosoftCalendarPayload } from "./calendar-payload";
import {
  buildFirstDayScan,
  type FirstDayScan,
} from "./first-day-briefing";

const MICROSOFT_CLIENT_ID = "ba9ccb38-2b16-4279-ac4f-bb42b6eb45bb";
const MICROSOFT_TENANT_ID = "31e192cb-bf66-49fb-9f79-15df4a40efda";

export const MICROSOFT_GRAPH_SCOPES = [
  "User.Read",
  "Mail.Read",
  "Calendars.Read",
  "Calendars.ReadWrite",
  "People.Read",
  "User.ReadBasic.All",
  "Sites.Read.All",
] as const;

export const MICROSOFT_MEETING_INTELLIGENCE_SCOPES = [
  "OnlineMeetings.ReadWrite",
  "OnlineMeetingTranscript.Read.All",
] as const;

export const MICROSOFT_DOCUMENT_PUBLISHING_SCOPES = [
  "Files.ReadWrite.All",
  "Sites.ReadWrite.All",
] as const;

export const MICROSOFT_OUTBOUND_COMMUNICATION_SCOPES = [
  "Mail.Send",
] as const;

export const MICROSOFT_FULL_CONNECTION_SCOPES = [
  ...MICROSOFT_GRAPH_SCOPES,
  "Mail.ReadWrite",
  ...MICROSOFT_MEETING_INTELLIGENCE_SCOPES,
  ...MICROSOFT_DOCUMENT_PUBLISHING_SCOPES,
  ...MICROSOFT_OUTBOUND_COMMUNICATION_SCOPES,
] as const;

type GraphCollection<T> = {
  value?: T[];
  "@odata.count"?: number;
};

type GraphProfile = {
  displayName?: string;
  givenName?: string;
  surname?: string;
  mail?: string | null;
  userPrincipalName?: string;
  jobTitle?: string | null;
  companyName?: string | null;
  department?: string | null;
  officeLocation?: string | null;
};

type GraphDirectReport = {
  id?: string;
  displayName?: string;
  jobTitle?: string | null;
};

type GraphInboxFolder = {
  totalItemCount?: number;
  unreadItemCount?: number;
};

type GraphMessage = {
  id: string;
  subject?: string;
  receivedDateTime?: string;
  importance?: "low" | "normal" | "high";
  isRead?: boolean;
  webLink?: string;
  from?: {
    emailAddress?: {
      name?: string;
      address?: string;
    };
  };
};

export type GraphEvent = {
  id: string;
  subject?: string;
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  organizer?: {
    emailAddress?: {
      name?: string;
      address?: string;
    };
  };
  isOnlineMeeting?: boolean;
  onlineMeetingUrl?: string | null;
  onlineMeeting?: {
    joinUrl?: string | null;
  } | null;
  webLink?: string;
  isOrganizer?: boolean;
  isAllDay?: boolean;
  isCancelled?: boolean;
  body?: {
    contentType?: string;
    content?: string;
  };
  attendees?: Array<{
    emailAddress?: {
      name?: string;
      address?: string;
    };
  }>;
  displayTime?: string;
};

type GraphOnlineMeeting = {
  id: string;
  joinWebUrl?: string;
  allowTranscription?: boolean;
  recordAutomatically?: boolean;
};

type GraphTranscript = {
  id: string;
  createdDateTime?: string;
};

type GraphPerson = {
  displayName?: string;
  scoredEmailAddresses?: Array<{
    address?: string;
    relevanceScore?: number;
  }>;
};

type GraphSite = {
  id: string;
  displayName?: string;
  name?: string;
  webUrl?: string;
};

type GraphDrive = {
  id: string;
  name?: string;
  webUrl?: string;
};

type GraphDriveItem = {
  id: string;
  name?: string;
  webUrl?: string;
  folder?: Record<string, unknown>;
};

type GraphSearchHit = {
  hitId?: string;
  summary?: string;
  resource?: {
    id?: string;
    name?: string;
    webUrl?: string;
    lastModifiedDateTime?: string;
    parentReference?: {
      siteId?: string;
      driveId?: string;
      path?: string;
    };
  };
};

type GraphSearchResponse = {
  value?: Array<{
    hitsContainers?: Array<{
      hits?: GraphSearchHit[];
      total?: number;
      moreResultsAvailable?: boolean;
    }>;
  }>;
};

export type MicrosoftCapabilityState =
  | "ready"
  | "provisioning"
  | "permission_required"
  | "mailbox_not_ready"
  | "unavailable";

export type MicrosoftSnapshot = {
  account: {
    name: string;
    givenName: string;
    surname: string;
    email: string;
    jobTitle: string;
    companyName: string;
    department: string;
    officeLocation: string;
    directReports: number | null;
  };
  recentMessages: GraphMessage[];
  inboxStatistics: {
    totalMessages: number;
    unreadMessages: number;
  } | null;
  upcomingEvents: GraphEvent[];
  sharePointSite: GraphSite | null;
  directoryPeople: number;
  calendarIssue: MicrosoftCalendarAccessIssue | null;
  capabilities: {
    mail: MicrosoftCapabilityState;
    calendar: MicrosoftCapabilityState;
    sharePoint: MicrosoftCapabilityState;
    directory: MicrosoftCapabilityState;
    meetingIntelligence: MicrosoftCapabilityState;
    documentPublishing: MicrosoftCapabilityState;
    outboundCommunication: MicrosoftCapabilityState;
  };
};

export type MicrosoftFileResult = {
  id: string;
  name: string;
  webUrl: string | null;
  lastModifiedDateTime: string | null;
  location: string | null;
  summary: string | null;
};

export type MicrosoftPublishedDocument = {
  id: string;
  name: string;
  webUrl: string | null;
  siteName: string;
  folderPath: string;
};

export type MicrosoftMeetingAttendee = {
  displayName: string;
  email: string;
};

export type MicrosoftCalendarItemType =
  | "meeting"
  | "lunch"
  | "appointment"
  | "focus";

export type MicrosoftCalendarConflict = {
  eventId: string;
  subject: string;
  start: string;
  end: string;
  displayTime: string;
  isOrganizer: boolean;
  suggestedRequestedStart: string | null;
  suggestedRequestedEnd: string | null;
  suggestedRequestedDisplayTime: string | null;
  suggestedExistingStart: string | null;
  suggestedExistingEnd: string | null;
  suggestedExistingDisplayTime: string | null;
};

export type MicrosoftMeetingProposal = {
  subject: string;
  purpose: string;
  agendaItems: string[];
  enableTranscription: boolean;
  attendees: MicrosoftMeetingAttendee[];
  start: string;
  end: string;
  deadline: string;
  durationMinutes: number;
  displayTime: string;
  calendarItemType: MicrosoftCalendarItemType;
  onlineMeeting: boolean;
  location: string;
  address: string;
  personalNotes: string[];
  menuItems: string[];
  isPrivate: boolean;
  privacyChoicePending: boolean;
  exactRequestedTime: boolean;
};

export type MicrosoftMeetingPreparation = {
  proposal: MicrosoftMeetingProposal | null;
  unresolvedAttendees: string[];
  directoryStatus: "ready" | "unavailable";
  directoryPeopleChecked: number;
  conflicts: MicrosoftCalendarConflict[];
};

export type MicrosoftMeetingResult = {
  id: string;
  subject: string;
  start: string;
  end: string;
  webLink: string | null;
  joinUrl: string | null;
  attendees: MicrosoftMeetingAttendee[];
  displayTime: string;
  calendarItemType: MicrosoftCalendarItemType;
  onlineMeeting: boolean;
  transcriptionStatus:
    | "enabled"
    | "permission_required"
    | "not_online"
    | "unavailable"
    | "not_requested";
};

export type MicrosoftCalendarConflictResolution =
  | "reschedule_requested"
  | "move_existing"
  | "decline_existing";

export type MicrosoftCalendarConflictResolutionResult = {
  resolution: MicrosoftCalendarConflictResolution;
  proposal: MicrosoftMeetingProposal | null;
  created: MicrosoftMeetingResult | null;
  changedMeeting: string | null;
  changedMeetingTime: string | null;
};

export type MicrosoftMeetingUpdateProposal = {
  eventId: string;
  subject: string;
  start: string | null;
  displayTime: string;
  webLink: string | null;
  agendaItems: string[];
  objective: string;
  enableTranscription: boolean;
  isOnlineMeeting: boolean;
  joinUrl: string | null;
};

export type MicrosoftMeetingUpdatePreparation = {
  proposal: MicrosoftMeetingUpdateProposal | null;
  candidates: Array<{
    eventId: string;
    subject: string;
    displayTime: string;
  }>;
  reason: "ready" | "not_found" | "ambiguous" | "not_organizer";
};

export type MicrosoftMeetingUpdateResult = {
  eventId: string;
  subject: string;
  webLink: string | null;
  agendaUpdated: boolean;
  transcriptionStatus:
    | "enabled"
    | "permission_required"
    | "not_online"
    | "unavailable"
    | "not_requested";
};

export type MicrosoftMeetingTranscript = {
  eventId: string;
  subject: string;
  transcriptId: string;
  content: string;
  speakerAttribution: boolean;
  truncated: boolean;
};

export type MicrosoftMeetingTranscriptReadResult = {
  status:
    | "ready"
    | "permission_required"
    | "admin_disabled"
    | "not_available"
    | "not_found"
    | "ambiguous";
  transcript: MicrosoftMeetingTranscript | null;
  candidates: MicrosoftMeetingUpdatePreparation["candidates"];
};

export type MicrosoftCalendarWindow = {
  label: string;
  start: string;
  end: string;
  events: GraphEvent[];
};

let microsoftClientPromise: Promise<PublicClientApplication> | null = null;
let directoryPeopleCache:
  | { people: DirectoryPerson[]; expiresAt: number }
  | null = null;
const DIRECTORY_CACHE_MS = 5 * 60 * 1000;

class MicrosoftGraphError extends Error {
  public status: number;
  public code: string | null;

  constructor(status: number, code: string | null) {
    super(`Microsoft 365 returned ${status}.`);
    this.name = "MicrosoftGraphError";
    this.status = status;
    this.code = code;
  }
}

function getRedirectUri() {
  return `${window.location.origin}/`;
}

async function getMicrosoftClient() {
  if (!microsoftClientPromise) {
    microsoftClientPromise = (async () => {
      const client = new PublicClientApplication({
        auth: {
          clientId: MICROSOFT_CLIENT_ID,
          authority: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}`,
          redirectUri: getRedirectUri(),
          postLogoutRedirectUri: window.location.origin,
        },
        cache: {
          cacheLocation: "localStorage",
        },
      });
      await client.initialize();
      return client;
    })();
  }

  return microsoftClientPromise;
}

function chooseAccount(
  client: PublicClientApplication,
  account?: AccountInfo | null,
) {
  const selected =
    account ?? client.getActiveAccount() ?? client.getAllAccounts()[0] ?? null;
  if (selected) client.setActiveAccount(selected);
  return selected;
}

async function acquireGraphToken(
  client: PublicClientApplication,
  account: AccountInfo,
) {
  return client.acquireTokenSilent({
    account,
    scopes: [...MICROSOFT_GRAPH_SCOPES],
  });
}

async function acquireMeetingIntelligenceToken(
  client: PublicClientApplication,
  account: AccountInfo,
) {
  return client.acquireTokenSilent({
    account,
    scopes: [...MICROSOFT_MEETING_INTELLIGENCE_SCOPES],
  });
}

async function acquireDocumentPublishingToken(
  client: PublicClientApplication,
  account: AccountInfo,
) {
  return client.acquireTokenSilent({
    account,
    scopes: [...MICROSOFT_DOCUMENT_PUBLISHING_SCOPES],
  });
}

async function acquireOutboundCommunicationToken(
  client: PublicClientApplication,
  account: AccountInfo,
) {
  return client.acquireTokenSilent({
    account,
    scopes: [...MICROSOFT_OUTBOUND_COMMUNICATION_SCOPES],
  });
}

function readGraphErrorCode(responseText: string) {
  try {
    const body = JSON.parse(responseText) as {
      error?: {
        code?: string;
        innerError?: { code?: string };
      };
    };
    return body.error?.innerError?.code ?? body.error?.code ?? null;
  } catch {
    return null;
  }
}

async function graphRequest<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
) {
  const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new MicrosoftGraphError(
      response.status,
      readGraphErrorCode(responseText),
    );
  }

  return (responseText ? JSON.parse(responseText) : {}) as T;
}

async function graphTextRequest(
  accessToken: string,
  path: string,
  accept: string,
) {
  const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: accept,
    },
  });
  const responseText = await response.text();
  if (!response.ok) {
    throw new MicrosoftGraphError(
      response.status,
      readGraphErrorCode(responseText),
    );
  }
  return responseText;
}

function parseGraphDateTime(
  value?: { dateTime?: string; timeZone?: string },
) {
  if (!value?.dateTime) return null;
  const isUtc = value.timeZone?.toUpperCase() === "UTC";
  const dateTime =
    isUtc && !/[zZ]|[+-]\d{2}:\d{2}$/.test(value.dateTime)
      ? `${value.dateTime}Z`
      : value.dateTime;
  const parsed = new Date(dateTime);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function roundUpToHalfHour(value: Date) {
  const rounded = new Date(value);
  rounded.setSeconds(0, 0);
  const minutes = rounded.getMinutes();
  if (minutes === 0 || minutes === 30) return rounded;
  rounded.setMinutes(minutes < 30 ? 30 : 60);
  return rounded;
}

function moveIntoWorkingHours(value: Date) {
  const next = new Date(value);

  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
    next.setHours(9, 0, 0, 0);
  }

  if (next.getHours() < 9) next.setHours(9, 0, 0, 0);
  if (next.getHours() >= 17) {
    next.setDate(next.getDate() + 1);
    next.setHours(9, 0, 0, 0);
    return moveIntoWorkingHours(next);
  }

  return next;
}

function findAvailableMeetingTime(
  events: GraphEvent[],
  windowStart: Date,
  windowEnd: Date,
  durationMinutes: number,
) {
  const earliest = new Date(
    Math.max(Date.now() + 30 * 60 * 1000, windowStart.getTime()),
  );
  let candidate = moveIntoWorkingHours(roundUpToHalfHour(earliest));

  const busyWindows = events
    .map((event) => ({
      start: parseGraphDateTime(event.start),
      end: parseGraphDateTime(event.end),
    }))
    .filter(
      (window): window is { start: Date; end: Date } =>
        window.start !== null && window.end !== null,
    );

  while (candidate < windowEnd) {
    candidate = moveIntoWorkingHours(candidate);
    const end = new Date(candidate.getTime() + durationMinutes * 60 * 1000);
    const leavesWorkingHours =
      end.getDate() !== candidate.getDate() ||
      end.getHours() > 17 ||
      (end.getHours() === 17 && end.getMinutes() > 0);

    if (end > windowEnd) break;
    if (leavesWorkingHours) {
      candidate.setDate(candidate.getDate() + 1);
      candidate.setHours(9, 0, 0, 0);
      continue;
    }

    const overlaps = busyWindows.some(
      (window) => candidate < window.end && end > window.start,
    );
    if (!overlaps) return { start: candidate, end };

    candidate = new Date(candidate.getTime() + 30 * 60 * 1000);
  }

  return null;
}

function formatMeetingTime(start: Date, end: Date) {
  const day = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(start);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  return `${day}, ${time.format(start)}–${time.format(end)}`;
}

async function readMicrosoftSnapshot(
  client: PublicClientApplication,
  account: AccountInfo,
): Promise<MicrosoftSnapshot> {
  const token = await acquireGraphToken(client, account);
  const now = new Date();
  const calendarEnd = new Date(now);
  calendarEnd.setDate(calendarEnd.getDate() + 14);

  const profile = await graphRequest<GraphProfile>(
    token.accessToken,
    "/me?$select=displayName,givenName,surname,mail,userPrincipalName,jobTitle,companyName,department,officeLocation",
  );

  const [
    mailResult,
    inboxStatisticsResult,
    calendarResult,
    sharePointResult,
    directoryResult,
    meetingIntelligenceResult,
    documentPublishingResult,
    outboundCommunicationResult,
    directReportsResult,
  ] =
    await Promise.allSettled([
      graphRequest<GraphCollection<GraphMessage>>(
        token.accessToken,
        "/me/messages?$top=12&$select=id,subject,from,receivedDateTime,importance,isRead,webLink&$orderby=receivedDateTime%20desc",
      ),
      graphRequest<GraphInboxFolder>(
        token.accessToken,
        "/me/mailFolders/inbox?$select=totalItemCount,unreadItemCount",
      ),
      graphRequest<GraphCollection<GraphEvent>>(
        token.accessToken,
        `/me/calendarView?startDateTime=${encodeURIComponent(now.toISOString())}&endDateTime=${encodeURIComponent(calendarEnd.toISOString())}&$top=50&$select=id,subject,start,end,organizer,isOnlineMeeting,onlineMeetingUrl,webLink&$orderby=start/dateTime`,
        { headers: { Prefer: 'outlook.timezone="UTC"' } },
      ),
      graphRequest<GraphSite>(
        token.accessToken,
        "/sites/root?$select=id,displayName,name,webUrl",
      ),
      graphRequest<GraphCollection<DirectoryPerson>>(
        token.accessToken,
        "/users?$select=displayName,givenName,surname,mail,userPrincipalName&$top=999&$count=true",
        {
          headers: {
            ConsistencyLevel: "eventual",
          },
        },
      ),
      acquireMeetingIntelligenceToken(client, account),
      acquireDocumentPublishingToken(client, account),
      acquireOutboundCommunicationToken(client, account),
      graphRequest<GraphCollection<GraphDirectReport>>(
        token.accessToken,
        "/me/directReports?$select=id,displayName,jobTitle&$top=25",
      ),
    ]);

  if (directoryResult.status === "fulfilled") {
    directoryPeopleCache = {
      people: directoryResult.value.value ?? [],
      expiresAt: Date.now() + DIRECTORY_CACHE_MS,
    };
  }

  const calendarIssue =
    calendarResult.status === "rejected"
      ? describeMicrosoftCalendarError(calendarResult.reason)
      : null;

  return {
    account: {
      name: profile.displayName ?? account.name ?? "Microsoft 365 user",
      givenName: profile.givenName ?? "",
      surname: profile.surname ?? "",
      email:
        profile.mail ??
        profile.userPrincipalName ??
        account.username ??
        "Connected account",
      jobTitle: profile.jobTitle ?? "",
      companyName: profile.companyName ?? "",
      department: profile.department ?? "",
      officeLocation: profile.officeLocation ?? "",
      directReports:
        directReportsResult.status === "fulfilled"
          ? (directReportsResult.value.value ?? []).length
          : null,
    },
    recentMessages:
      mailResult.status === "fulfilled" ? mailResult.value.value ?? [] : [],
    inboxStatistics:
      inboxStatisticsResult.status === "fulfilled"
        ? {
            totalMessages: inboxStatisticsResult.value.totalItemCount ?? 0,
            unreadMessages: inboxStatisticsResult.value.unreadItemCount ?? 0,
          }
        : null,
    upcomingEvents:
      calendarResult.status === "fulfilled"
        ? (calendarResult.value.value ?? []).map((event) => ({
            ...event,
            displayTime: formatEventTime(event),
          }))
        : [],
    sharePointSite:
      sharePointResult.status === "fulfilled" ? sharePointResult.value : null,
    directoryPeople:
      directoryResult.status === "fulfilled"
        ? directoryResult.value["@odata.count"] ??
          directoryResult.value.value?.length ??
          0
        : 0,
    calendarIssue,
    capabilities: {
      mail: mailResult.status === "fulfilled" ? "ready" : "provisioning",
      calendar:
        calendarResult.status === "fulfilled"
          ? "ready"
          : calendarIssue?.kind ?? "unavailable",
      sharePoint:
        sharePointResult.status === "fulfilled" ? "ready" : "provisioning",
      directory:
        directoryResult.status === "fulfilled" ? "ready" : "provisioning",
      meetingIntelligence:
        meetingIntelligenceResult.status === "fulfilled"
          ? "ready"
          : "permission_required",
      documentPublishing:
        documentPublishingResult.status === "fulfilled"
          ? "ready"
          : "permission_required",
      outboundCommunication:
        outboundCommunicationResult.status === "fulfilled"
          ? "ready"
          : "permission_required",
    },
  };
}

export async function connectMicrosoft365() {
  const client = await getMicrosoftClient();
  await client.loginRedirect({
    scopes: [...MICROSOFT_FULL_CONNECTION_SCOPES],
    redirectUri: getRedirectUri(),
    prompt: "select_account",
  });
}

export async function repairMicrosoftCalendarAccess() {
  const client = await getMicrosoftClient();
  await client.loginRedirect({
    scopes: [...MICROSOFT_FULL_CONNECTION_SCOPES],
    redirectUri: getRedirectUri(),
    prompt: "consent",
  });
}

export async function enableMicrosoftMeetingIntelligence() {
  const client = await getMicrosoftClient();
  await client.loginRedirect({
    scopes: [...MICROSOFT_FULL_CONNECTION_SCOPES],
    redirectUri: getRedirectUri(),
    prompt: "consent",
  });
}

export async function enableMicrosoftDocumentPublishing() {
  const client = await getMicrosoftClient();
  await client.loginRedirect({
    scopes: [...MICROSOFT_FULL_CONNECTION_SCOPES],
    redirectUri: getRedirectUri(),
    prompt: "consent",
  });
}

export async function enableMicrosoftOutboundCommunication() {
  const client = await getMicrosoftClient();
  await client.loginRedirect({
    scopes: [...MICROSOFT_FULL_CONNECTION_SCOPES],
    redirectUri: getRedirectUri(),
    prompt: "consent",
  });
}

export { describeMicrosoftCalendarError };

export async function restoreMicrosoft365() {
  const client = await getMicrosoftClient();
  const redirectResult = await client.handleRedirectPromise();
  const account = chooseAccount(client, redirectResult?.account);
  if (!account) return null;
  return readMicrosoftSnapshot(client, account);
}

export async function refreshMicrosoft365() {
  const client = await getMicrosoftClient();
  const account = chooseAccount(client);
  if (!account) throw new Error("Microsoft 365 is not connected.");
  return readMicrosoftSnapshot(client, account);
}

export async function readMicrosoftFirstDayScan(): Promise<FirstDayScan> {
  const client = await getMicrosoftClient();
  const account = chooseAccount(client);
  if (!account) throw new Error("Microsoft 365 is not connected.");

  const token = await acquireGraphToken(client, account);
  const windowStart = new Date();
  const windowEnd = new Date(windowStart);
  windowEnd.setDate(windowEnd.getDate() + 14);

  const [inbox, messages, calendar] = await Promise.all([
    graphRequest<GraphInboxFolder>(
      token.accessToken,
      "/me/mailFolders/inbox?$select=totalItemCount,unreadItemCount",
    ),
    graphRequest<GraphCollection<GraphMessage>>(
      token.accessToken,
      "/me/mailFolders/inbox/messages?$top=50&$select=id,subject,from,receivedDateTime,importance,isRead&$orderby=receivedDateTime%20desc",
    ),
    graphRequest<GraphCollection<GraphEvent>>(
      token.accessToken,
      `/me/calendarView?startDateTime=${encodeURIComponent(windowStart.toISOString())}&endDateTime=${encodeURIComponent(windowEnd.toISOString())}&$top=100&$select=id,subject,start,end,isAllDay,isCancelled&$orderby=start/dateTime`,
      { headers: { Prefer: 'outlook.timezone="UTC"' } },
    ),
  ]);

  return buildFirstDayScan({
    inboxTotal: inbox.totalItemCount ?? 0,
    inboxUnread: inbox.unreadItemCount ?? 0,
    messages: (messages.value ?? []).map((message) => ({
      id: message.id,
      subject: message.subject?.trim() || "Message without a subject",
      sender:
        message.from?.emailAddress?.name?.trim() ||
        message.from?.emailAddress?.address?.trim() ||
        "Unknown sender",
      receivedAt: message.receivedDateTime ?? null,
      importance: message.importance ?? "normal",
      isRead: message.isRead !== false,
    })),
    events: (calendar.value ?? []).map((event) => ({
      id: event.id,
      subject: event.subject?.trim() || "Untitled calendar item",
      start: event.start?.dateTime ?? "",
      end: event.end?.dateTime ?? "",
      isAllDay: event.isAllDay,
      isCancelled: event.isCancelled,
    })),
    windowStart,
    windowEnd,
  });
}

export async function sendMicrosoftEmail({
  recipient,
  subject,
  message,
}: {
  recipient: string;
  subject: string;
  message: string;
}) {
  const client = await getMicrosoftClient();
  const account = chooseAccount(client);
  if (!account) throw new Error("Microsoft 365 is not connected.");
  const token = await acquireOutboundCommunicationToken(client, account);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let resolved: MicrosoftMeetingAttendee | null = emailPattern.test(recipient)
    ? { displayName: recipient, email: recipient }
    : null;

  if (!resolved) {
    const graphToken = await acquireGraphToken(client, account);
    const directoryPeople =
      directoryPeopleCache && directoryPeopleCache.expiresAt > Date.now()
        ? directoryPeopleCache.people
        : [];
    resolved = await resolveDirectoryAttendee(
      graphToken.accessToken,
      recipient,
      directoryPeople,
    ).catch(() => null);
    if (!resolved) {
      resolved = await resolveRelevantPerson(
        graphToken.accessToken,
        recipient,
      ).catch(() => null);
    }
  }

  if (!resolved) {
    throw new Error("I couldn't safely resolve that recipient. Please give me their work email.");
  }

  await graphRequest<Record<string, never>>(
    token.accessToken,
    "/me/sendMail",
    {
      method: "POST",
      body: JSON.stringify({
        message: {
          subject: subject.trim() || "Message from Nick",
          body: {
            contentType: "Text",
            content: message.trim(),
          },
          toRecipients: [
            {
              emailAddress: {
                address: resolved.email,
                name: resolved.displayName,
              },
            },
          ],
        },
        saveToSentItems: true,
      }),
    },
  );

  return {
    recipient: resolved,
    subject: subject.trim() || "Message from Nick",
  };
}

export async function readMicrosoftCalendar(
  periodDescription: string,
): Promise<MicrosoftCalendarWindow> {
  const client = await getMicrosoftClient();
  const account = chooseAccount(client);
  if (!account) throw new Error("Microsoft 365 is not connected.");
  const token = await acquireGraphToken(client, account);
  const window = resolveCalendarReadWindow(periodDescription);
  const calendar = await graphRequest<GraphCollection<GraphEvent>>(
    token.accessToken,
    `/me/calendarView?startDateTime=${encodeURIComponent(window.start.toISOString())}&endDateTime=${encodeURIComponent(window.end.toISOString())}&$top=100&$select=id,subject,start,end,organizer,isOnlineMeeting,onlineMeetingUrl,webLink&$orderby=start/dateTime`,
    { headers: { Prefer: 'outlook.timezone="UTC"' } },
  );

  return {
    label: window.label,
    start: window.start.toISOString(),
    end: window.end.toISOString(),
    events: (calendar.value ?? []).map((event) => ({
      ...event,
      displayTime: formatEventTime(event),
    })),
  };
}

export async function disconnectMicrosoft365() {
  const client = await getMicrosoftClient();
  const account = chooseAccount(client);
  await client.clearCache(account ? { account } : undefined);
  client.setActiveAccount(null);
}

export async function searchMicrosoft365Files(query: string) {
  const client = await getMicrosoftClient();
  const account = chooseAccount(client);
  if (!account) throw new Error("Microsoft 365 is not connected.");
  const token = await acquireGraphToken(client, account);
  const search = await graphRequest<GraphSearchResponse>(
    token.accessToken,
    "/search/query",
    {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            entityTypes: ["driveItem"],
            query: { queryString: query },
            from: 0,
            size: 5,
            fields: [
              "id",
              "name",
              "webUrl",
              "lastModifiedDateTime",
              "parentReference",
            ],
          },
        ],
      }),
    },
  );

  const hits =
    search.value?.flatMap((response) =>
      (response.hitsContainers ?? []).flatMap(
        (container) => container.hits ?? [],
      ),
    ) ?? [];

  return hits.map(
    (hit, index): MicrosoftFileResult => ({
      id: hit.resource?.id ?? hit.hitId ?? `result-${index}`,
      name: hit.resource?.name ?? "Untitled Microsoft 365 item",
      webUrl: hit.resource?.webUrl ?? null,
      lastModifiedDateTime: hit.resource?.lastModifiedDateTime ?? null,
      location: hit.resource?.parentReference?.path ?? null,
      summary: hit.summary ?? null,
    }),
  );
}

async function resolveDirectoryAttendee(
  accessToken: string,
  requestedName: string,
  directoryPeople: DirectoryPerson[],
) {
  const directoryMatch = resolveDirectoryPerson(
    requestedName,
    directoryPeople,
  );
  if (directoryMatch) return directoryMatch;

  const safeName = requestedName.replaceAll('"', "").trim();
  if (!safeName) return null;
  const searched = await graphRequest<GraphCollection<DirectoryPerson>>(
    accessToken,
    `/users?$search=${encodeURIComponent(`"displayName:${safeName}"`)}&$select=displayName,givenName,surname,mail,userPrincipalName&$top=25&$count=true`,
    { headers: { ConsistencyLevel: "eventual" } },
  );
  return resolveDirectoryPerson(requestedName, searched.value ?? []);
}

async function resolveRelevantPerson(
  accessToken: string,
  requestedName: string,
) {
  const safeName = requestedName.replaceAll('"', "").trim();
  if (!safeName) return null;

  const people = await graphRequest<GraphCollection<GraphPerson>>(
    accessToken,
    `/me/people?$search=${encodeURIComponent(`"${safeName}"`)}&$top=5&$select=displayName,scoredEmailAddresses`,
  );
  const candidates = (people.value ?? [])
    .map((person) => ({
      displayName: person.displayName?.trim() || requestedName,
      email: person.scoredEmailAddresses?.[0]?.address?.trim() || "",
    }))
    .filter((person) => person.email);

  const exact = candidates.filter(
    (person) =>
      person.displayName.trim().toLowerCase() === requestedName.trim().toLowerCase(),
  );
  if (exact.length === 1) return exact[0];
  return candidates.length === 1 ? candidates[0] : null;
}

export async function prepareMicrosoftMeeting({
  subject,
  attendeeNames,
  deadlineDescription,
  durationMinutes = 30,
  purpose,
  agendaItems = [],
  enableTranscription = false,
  calendarItemType = "meeting",
  onlineMeeting,
  location = "",
  address = "",
  personalNotes = [],
  menuItems = [],
  privacy = "normal",
}: {
  subject: string;
  attendeeNames: string[];
  deadlineDescription: string;
  durationMinutes?: number;
  purpose: string;
  agendaItems?: string[];
  enableTranscription?: boolean;
  calendarItemType?: MicrosoftCalendarItemType;
  onlineMeeting?: boolean;
  location?: string;
  address?: string;
  personalNotes?: string[];
  menuItems?: string[];
  privacy?: "private" | "normal" | "ask";
}): Promise<MicrosoftMeetingPreparation> {
  const client = await getMicrosoftClient();
  const account = chooseAccount(client);
  if (!account) throw new Error("Microsoft 365 is not connected.");
  const token = await acquireGraphToken(client, account);

  const attendees: MicrosoftMeetingAttendee[] = [];
  const unresolvedAttendees: string[] = [];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizedDuration = Math.max(
    15,
    Math.min(Number.isFinite(durationMinutes) ? durationMinutes : 30, 120),
  );

  let directoryPeople: DirectoryPerson[] =
    directoryPeopleCache && directoryPeopleCache.expiresAt > Date.now()
      ? directoryPeopleCache.people
      : [];
  let directoryStatus: MicrosoftMeetingPreparation["directoryStatus"] =
    "ready";
  if (attendeeNames.length > 0 && directoryPeople.length === 0) {
    try {
      const directory = await graphRequest<GraphCollection<DirectoryPerson>>(
        token.accessToken,
        "/users?$select=displayName,givenName,surname,mail,userPrincipalName&$top=999&$count=true",
        { headers: { ConsistencyLevel: "eventual" } },
      );
      directoryPeople = directory.value ?? [];
      directoryPeopleCache = {
        people: directoryPeople,
        expiresAt: Date.now() + DIRECTORY_CACHE_MS,
      };
    } catch {
      directoryStatus = "unavailable";
    }
  }

  for (const rawAttendee of splitAttendeeNames(attendeeNames)) {
    const attendee = rawAttendee.trim();
    if (!attendee) continue;

    if (emailPattern.test(attendee)) {
      attendees.push({ displayName: attendee, email: attendee });
      continue;
    }

    let match: MicrosoftMeetingAttendee | null = null;
    if (directoryStatus === "ready") {
      try {
        match = await resolveDirectoryAttendee(
          token.accessToken,
          attendee,
          directoryPeople,
        );
      } catch {
        // Continue to relevant people if directory search is still indexing.
      }
    }

    if (!match) {
      try {
        match = await resolveRelevantPerson(token.accessToken, attendee);
      } catch {
        // Ara will ask for an email instead of guessing.
      }
    }

    if (match) {
      attendees.push(match);
    } else {
      unresolvedAttendees.push(attendee);
    }
  }

  if (unresolvedAttendees.length > 0) {
    return {
      proposal: null,
      unresolvedAttendees,
      directoryStatus,
      directoryPeopleChecked: directoryPeople.length,
      conflicts: [],
    };
  }

  const now = new Date();
  const schedulingWindow = resolveSchedulingWindow(deadlineDescription, now);
  if (schedulingWindow.end <= now) {
    throw new Error("The requested deadline has already passed.");
  }
  const exactSlot = resolveRequestedCalendarSlot(
    deadlineDescription,
    normalizedDuration,
    now,
  );
  if (exactSlot && exactSlot.end <= now) {
    throw new Error("The requested time has already passed.");
  }
  const lookupStart = exactSlot
    ? new Date(
        Math.min(schedulingWindow.start.getTime(), exactSlot.start.getTime()),
      )
    : schedulingWindow.start;
  const lookupEnd = exactSlot
    ? new Date(
        Math.max(schedulingWindow.end.getTime(), exactSlot.end.getTime()),
      )
    : schedulingWindow.end;
  const calendarStart = new Date(
    Math.max(now.getTime(), lookupStart.getTime()),
  );

  const calendar = await graphRequest<GraphCollection<GraphEvent>>(
    token.accessToken,
    `/me/calendarView?startDateTime=${encodeURIComponent(calendarStart.toISOString())}&endDateTime=${encodeURIComponent(lookupEnd.toISOString())}&$top=100&$select=id,subject,start,end,isOrganizer,organizer&$orderby=start/dateTime`,
    { headers: { Prefer: 'outlook.timezone="UTC"' } },
  );
  const calendarEvents = calendar.value ?? [];
  const available = exactSlot
    ? { start: exactSlot.start, end: exactSlot.end }
    : findAvailableMeetingTime(
        calendarEvents,
        schedulingWindow.start,
        schedulingWindow.end,
        normalizedDuration,
      );

  if (!available) {
    throw new Error("No open working-hours slot was found before the deadline.");
  }

  const preparedAgenda = normalizeAgendaItems(
    calendarItemType === "meeting" ? agendaItems : [],
  );
  const finalAgenda =
    preparedAgenda.length > 0
      ? preparedAgenda
      : calendarItemType === "meeting"
        ? [
          `Confirm the objective for ${subject}`,
          "Review the relevant context and open questions",
          "Agree on decisions, owners, and deadlines",
          "Confirm next steps",
          ]
        : [];
  const finalOnlineMeeting =
    onlineMeeting ??
    (calendarItemType === "meeting" && attendees.length > 0);

  const conflicts = exactSlot
    ? calendarEvents
        .filter((event) => {
          const eventStart = parseGraphDateTime(event.start);
          const eventEnd = parseGraphDateTime(event.end);
          return Boolean(
            eventStart &&
              eventEnd &&
              exactSlot.start < eventEnd &&
              exactSlot.end > eventStart,
          );
        })
        .map((event): MicrosoftCalendarConflict | null => {
          const eventStart = parseGraphDateTime(event.start);
          const eventEnd = parseGraphDateTime(event.end);
          if (!eventStart || !eventEnd) return null;
          const suggestedRequested = findAvailableMeetingTime(
            calendarEvents,
            exactSlot.end,
            schedulingWindow.end,
            normalizedDuration,
          );
          const proposedBusyEvent: GraphEvent = {
            id: "parallel-requested-slot",
            start: { dateTime: exactSlot.start.toISOString(), timeZone: "UTC" },
            end: { dateTime: exactSlot.end.toISOString(), timeZone: "UTC" },
          };
          const existingDuration = Math.max(
            15,
            Math.round((eventEnd.getTime() - eventStart.getTime()) / 60_000),
          );
          const suggestedExisting = findAvailableMeetingTime(
            [...calendarEvents, proposedBusyEvent],
            exactSlot.end,
            schedulingWindow.end,
            existingDuration,
          );
          return {
            eventId: event.id,
            subject: event.subject ?? "Existing meeting",
            start: eventStart.toISOString(),
            end: eventEnd.toISOString(),
            displayTime: formatMeetingTime(eventStart, eventEnd),
            isOrganizer: event.isOrganizer !== false,
            suggestedRequestedStart:
              suggestedRequested?.start.toISOString() ?? null,
            suggestedRequestedEnd:
              suggestedRequested?.end.toISOString() ?? null,
            suggestedRequestedDisplayTime: suggestedRequested
              ? formatMeetingTime(
                  suggestedRequested.start,
                  suggestedRequested.end,
                )
              : null,
            suggestedExistingStart:
              suggestedExisting?.start.toISOString() ?? null,
            suggestedExistingEnd:
              suggestedExisting?.end.toISOString() ?? null,
            suggestedExistingDisplayTime: suggestedExisting
              ? formatMeetingTime(
                  suggestedExisting.start,
                  suggestedExisting.end,
                )
              : null,
          };
        })
        .filter(
          (conflict): conflict is MicrosoftCalendarConflict =>
            conflict !== null,
        )
    : [];

  return {
    proposal: {
      subject,
      purpose,
      agendaItems: finalAgenda,
      enableTranscription:
        calendarItemType === "meeting" && enableTranscription,
      attendees,
      start: available.start.toISOString(),
      end: available.end.toISOString(),
      deadline: schedulingWindow.end.toISOString(),
      durationMinutes: normalizedDuration,
      displayTime: formatMeetingTime(available.start, available.end),
      calendarItemType,
      onlineMeeting: finalOnlineMeeting,
      location: location.trim(),
      address: address.trim(),
      personalNotes: personalNotes.map((note) => note.trim()).filter(Boolean).slice(0, 8),
      menuItems: menuItems.map((item) => item.trim()).filter(Boolean).slice(0, 8),
      isPrivate: privacy === "private",
      privacyChoicePending:
        calendarItemType !== "meeting" && privacy === "ask",
      exactRequestedTime: Boolean(exactSlot),
    },
    unresolvedAttendees: [],
    directoryStatus,
    directoryPeopleChecked: directoryPeople.length,
    conflicts,
  };
}

export async function createMicrosoftMeeting(
  proposal: MicrosoftMeetingProposal,
): Promise<MicrosoftMeetingResult> {
  const client = await getMicrosoftClient();
  const account = chooseAccount(client);
  if (!account) throw new Error("Microsoft 365 is not connected.");
  const token = await acquireGraphToken(client, account);
  const meetingBody = mergeMeetingAgenda(
    null,
    proposal.agendaItems,
    proposal.purpose,
  );

  const graphEvent = await graphRequest<GraphEvent>(
    token.accessToken,
    "/me/events",
    {
      method: "POST",
      headers: { Prefer: 'outlook.timezone="UTC"' },
      body: JSON.stringify(
        buildMicrosoftCalendarPayload(
          proposal,
          crypto.randomUUID(),
          proposal.agendaItems.length > 0 ? meetingBody.content : undefined,
        ),
      ),
    },
  );

  let createdStart = parseGraphDateTime(graphEvent.start);
  let createdEnd = parseGraphDateTime(graphEvent.end);
  const expectedStart = new Date(proposal.start);
  const expectedEnd = new Date(proposal.end);
  if (
    !createdStart ||
    !createdEnd ||
    Math.abs(createdStart.getTime() - expectedStart.getTime()) > 60_000 ||
    Math.abs(createdEnd.getTime() - expectedEnd.getTime()) > 60_000
  ) {
    const corrected = await graphRequest<GraphEvent>(
      token.accessToken,
      `/me/events/${encodeURIComponent(graphEvent.id)}`,
      {
        method: "PATCH",
        headers: { Prefer: 'outlook.timezone="UTC"' },
        body: JSON.stringify({
          start: {
            dateTime: proposal.start.replace(/Z$/, ""),
            timeZone: "UTC",
          },
          end: {
            dateTime: proposal.end.replace(/Z$/, ""),
            timeZone: "UTC",
          },
        }),
      },
    );
    createdStart = parseGraphDateTime(corrected.start);
    createdEnd = parseGraphDateTime(corrected.end);
    if (
      !createdStart ||
      !createdEnd ||
      Math.abs(createdStart.getTime() - expectedStart.getTime()) > 60_000 ||
      Math.abs(createdEnd.getTime() - expectedEnd.getTime()) > 60_000
    ) {
      throw new Error(
        "Microsoft did not confirm the requested calendar time. Check Outlook before retrying.",
      );
    }
  }

  const joinUrl =
    graphEvent.onlineMeeting?.joinUrl ??
    graphEvent.onlineMeetingUrl ??
    null;
  const transcriptionStatus =
    proposal.enableTranscription && proposal.onlineMeeting
    ? await configureMicrosoftMeetingTranscription(client, account, joinUrl)
    : "not_requested";

  return {
    id: graphEvent.id,
    subject: graphEvent.subject ?? proposal.subject,
    start: createdStart.toISOString(),
    end: createdEnd.toISOString(),
    webLink: graphEvent.webLink ?? null,
    joinUrl,
    attendees: proposal.attendees,
    displayTime: formatMeetingTime(createdStart, createdEnd),
    calendarItemType: proposal.calendarItemType,
    onlineMeeting: proposal.onlineMeeting,
    transcriptionStatus,
  };
}

export async function resolveMicrosoftCalendarConflict({
  proposal,
  conflict,
  resolution,
}: {
  proposal: MicrosoftMeetingProposal;
  conflict: MicrosoftCalendarConflict;
  resolution: MicrosoftCalendarConflictResolution;
}): Promise<MicrosoftCalendarConflictResolutionResult> {
  if (resolution === "reschedule_requested") {
    if (
      !conflict.suggestedRequestedStart ||
      !conflict.suggestedRequestedEnd ||
      !conflict.suggestedRequestedDisplayTime
    ) {
      throw new Error("No clear alternative time is available that day.");
    }
    return {
      resolution,
      proposal: {
        ...proposal,
        start: conflict.suggestedRequestedStart,
        end: conflict.suggestedRequestedEnd,
        displayTime: conflict.suggestedRequestedDisplayTime,
        exactRequestedTime: false,
      },
      created: null,
      changedMeeting: null,
      changedMeetingTime: null,
    };
  }

  const client = await getMicrosoftClient();
  const account = chooseAccount(client);
  if (!account) throw new Error("Microsoft 365 is not connected.");
  const token = await acquireGraphToken(client, account);

  if (resolution === "move_existing") {
    if (!conflict.isOrganizer) {
      throw new Error("Only the organizer can move that meeting.");
    }
    if (
      !conflict.suggestedExistingStart ||
      !conflict.suggestedExistingEnd ||
      !conflict.suggestedExistingDisplayTime
    ) {
      throw new Error("No safe time is available to move the existing meeting.");
    }
    const updated = await graphRequest<GraphEvent>(
      token.accessToken,
      `/me/events/${encodeURIComponent(conflict.eventId)}`,
      {
        method: "PATCH",
        headers: { Prefer: 'outlook.timezone="UTC"' },
        body: JSON.stringify({
          start: {
            dateTime: conflict.suggestedExistingStart.replace(/Z$/, ""),
            timeZone: "UTC",
          },
          end: {
            dateTime: conflict.suggestedExistingEnd.replace(/Z$/, ""),
            timeZone: "UTC",
          },
        }),
      },
    );
    const updatedStart = parseGraphDateTime(updated.start);
    const updatedEnd = parseGraphDateTime(updated.end);
    if (
      !updatedStart ||
      !updatedEnd ||
      Math.abs(
        updatedStart.getTime() -
          new Date(conflict.suggestedExistingStart).getTime(),
      ) > 60_000 ||
      Math.abs(
        updatedEnd.getTime() -
          new Date(conflict.suggestedExistingEnd).getTime(),
      ) > 60_000
    ) {
      throw new Error(
        "Microsoft did not confirm the new time for the existing meeting.",
      );
    }
  } else {
    if (conflict.isOrganizer) {
      throw new Error("An organizer cannot decline their own meeting.");
    }
    await graphRequest<Record<string, never>>(
      token.accessToken,
      `/me/events/${encodeURIComponent(conflict.eventId)}/decline`,
      {
        method: "POST",
        body: JSON.stringify({ sendResponse: true }),
      },
    );
  }

  let created: MicrosoftMeetingResult;
  try {
    created = await createMicrosoftMeeting(proposal);
  } catch {
    throw new Error(
      resolution === "move_existing"
        ? `${conflict.subject} was moved, but ${proposal.subject} was not booked. Check the calendar before retrying.`
        : `${conflict.subject} was declined, but ${proposal.subject} was not booked. Check the calendar before retrying.`,
    );
  }
  return {
    resolution,
    proposal: null,
    created,
    changedMeeting: conflict.subject,
    changedMeetingTime:
      resolution === "move_existing"
        ? conflict.suggestedExistingDisplayTime
        : null,
  };
}

function formatEventTime(event: GraphEvent) {
  const start = parseGraphDateTime(event.start);
  const end = parseGraphDateTime(event.end);
  if (start && end) return formatMeetingTime(start, end);
  if (start) {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(start);
  }
  return "Time unavailable";
}

async function findOnlineMeeting(
  accessToken: string,
  joinUrl: string,
) {
  const escapedJoinUrl = joinUrl.replaceAll("'", "''");
  const filter = encodeURIComponent(`JoinWebUrl eq '${escapedJoinUrl}'`);
  const meetings = await graphRequest<GraphCollection<GraphOnlineMeeting>>(
    accessToken,
    `/me/onlineMeetings?$filter=${filter}`,
  );
  return meetings.value?.[0] ?? null;
}

async function configureMicrosoftMeetingTranscription(
  client: PublicClientApplication,
  account: AccountInfo,
  joinUrl: string | null,
): Promise<MicrosoftMeetingUpdateResult["transcriptionStatus"]> {
  if (!joinUrl) return "not_online";
  let token;
  try {
    token = await acquireMeetingIntelligenceToken(client, account);
  } catch {
    return "permission_required";
  }

  try {
    const onlineMeeting = await findOnlineMeeting(token.accessToken, joinUrl);
    if (!onlineMeeting) return "unavailable";
    await graphRequest<GraphOnlineMeeting>(
      token.accessToken,
      `/me/onlineMeetings/${encodeURIComponent(onlineMeeting.id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          allowTranscription: true,
          meetingSpokenLanguageTag: "en-US",
        }),
      },
    );
    return "enabled";
  } catch (error) {
    return error instanceof MicrosoftGraphError &&
      (error.status === 401 || error.status === 403)
      ? "permission_required"
      : "unavailable";
  }
}

async function resolveMeetingEvent(
  accessToken: string,
  eventId: string | undefined,
  meetingReference: string,
  requireOrganizer: boolean,
): Promise<{
  event: GraphEvent | null;
  candidates: MicrosoftMeetingUpdatePreparation["candidates"];
  reason: MicrosoftMeetingUpdatePreparation["reason"];
}> {
  const eventSelect =
    "id,subject,start,end,isOrganizer,isOnlineMeeting,onlineMeeting,onlineMeetingUrl,webLink,attendees";
  if (eventId) {
    const event = await graphRequest<GraphEvent>(
      accessToken,
      `/me/events/${encodeURIComponent(eventId)}?$select=${eventSelect}`,
      { headers: { Prefer: 'outlook.timezone="UTC"' } },
    );
    const organizerBlocked = requireOrganizer && event.isOrganizer === false;
    return {
      event: organizerBlocked ? null : event,
      candidates: [],
      reason: organizerBlocked ? "not_organizer" : "ready",
    };
  }

  const start = new Date();
  start.setDate(start.getDate() - 30);
  const end = new Date();
  end.setDate(end.getDate() + 120);
  const calendar = await graphRequest<GraphCollection<GraphEvent>>(
    accessToken,
    `/me/calendarView?startDateTime=${encodeURIComponent(start.toISOString())}&endDateTime=${encodeURIComponent(end.toISOString())}&$top=200&$select=${eventSelect}&$orderby=start/dateTime`,
    { headers: { Prefer: 'outlook.timezone="UTC"' } },
  );
  const scored = (calendar.value ?? [])
    .filter((event) => !requireOrganizer || event.isOrganizer !== false)
    .map((event) => ({
      event,
      score: scoreMeetingReference(meetingReference, {
        subject: event.subject,
        attendeeNames: event.attendees?.map(
          (attendee) => attendee.emailAddress?.name ?? "",
        ),
      }),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score);
  const candidates = scored.slice(0, 5).map(({ event }) => ({
    eventId: event.id,
    subject: event.subject ?? "Untitled meeting",
    displayTime: formatEventTime(event),
  }));
  if (scored.length === 0) {
    return { event: null, candidates, reason: "not_found" };
  }
  if (scored.length > 1 && scored[0].score === scored[1].score) {
    return { event: null, candidates, reason: "ambiguous" };
  }
  return { event: scored[0].event, candidates, reason: "ready" };
}

export async function prepareMicrosoftMeetingUpdate({
  eventId,
  meetingReference,
  agendaItems,
  objective,
  enableTranscription,
}: {
  eventId?: string;
  meetingReference: string;
  agendaItems: string[];
  objective: string;
  enableTranscription: boolean;
}): Promise<MicrosoftMeetingUpdatePreparation> {
  const client = await getMicrosoftClient();
  const account = chooseAccount(client);
  if (!account) throw new Error("Microsoft 365 is not connected.");
  const token = await acquireGraphToken(client, account);
  const resolved = await resolveMeetingEvent(
    token.accessToken,
    eventId,
    meetingReference,
    true,
  );
  if (!resolved.event) {
    return {
      proposal: null,
      candidates: resolved.candidates,
      reason: resolved.reason,
    };
  }

  const normalizedAgenda = normalizeAgendaItems(agendaItems);
  if (normalizedAgenda.length === 0) {
    throw new Error("The agenda needs at least one clear discussion item.");
  }
  const joinUrl =
    resolved.event.onlineMeeting?.joinUrl ??
    resolved.event.onlineMeetingUrl ??
    null;
  const start = parseGraphDateTime(resolved.event.start);
  return {
    proposal: {
      eventId: resolved.event.id,
      subject: resolved.event.subject ?? "Untitled meeting",
      start: start?.toISOString() ?? null,
      displayTime: formatEventTime(resolved.event),
      webLink: resolved.event.webLink ?? null,
      agendaItems: normalizedAgenda,
      objective: objective.trim(),
      enableTranscription,
      isOnlineMeeting: resolved.event.isOnlineMeeting === true,
      joinUrl,
    },
    candidates: [],
    reason: "ready",
  };
}

export async function updateMicrosoftMeeting(
  proposal: MicrosoftMeetingUpdateProposal,
): Promise<MicrosoftMeetingUpdateResult> {
  const client = await getMicrosoftClient();
  const account = chooseAccount(client);
  if (!account) throw new Error("Microsoft 365 is not connected.");
  const token = await acquireGraphToken(client, account);
  const currentEvent = await graphRequest<GraphEvent>(
    token.accessToken,
    `/me/events/${encodeURIComponent(proposal.eventId)}?$select=id,subject,body,isOrganizer,isOnlineMeeting,onlineMeeting,onlineMeetingUrl,webLink`,
  );
  if (currentEvent.isOrganizer === false) {
    throw new Error("Only the organizer can update this meeting invite.");
  }
  const body = mergeMeetingAgenda(
    currentEvent.body,
    proposal.agendaItems,
    proposal.objective,
  );
  const updatedEvent = await graphRequest<GraphEvent>(
    token.accessToken,
    `/me/events/${encodeURIComponent(proposal.eventId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ body }),
    },
  );
  const joinUrl =
    currentEvent.onlineMeeting?.joinUrl ??
    currentEvent.onlineMeetingUrl ??
    proposal.joinUrl;
  const transcriptionStatus = proposal.enableTranscription
    ? await configureMicrosoftMeetingTranscription(client, account, joinUrl)
    : "not_requested";

  return {
    eventId: proposal.eventId,
    subject: updatedEvent.subject ?? currentEvent.subject ?? proposal.subject,
    webLink:
      updatedEvent.webLink ?? currentEvent.webLink ?? proposal.webLink,
    agendaUpdated: true,
    transcriptionStatus,
  };
}

export async function readMicrosoftMeetingTranscript({
  eventId,
  meetingReference,
}: {
  eventId?: string;
  meetingReference: string;
}): Promise<MicrosoftMeetingTranscriptReadResult> {
  const client = await getMicrosoftClient();
  const account = chooseAccount(client);
  if (!account) throw new Error("Microsoft 365 is not connected.");
  const baseToken = await acquireGraphToken(client, account);
  const resolved = await resolveMeetingEvent(
    baseToken.accessToken,
    eventId,
    meetingReference,
    false,
  );
  if (!resolved.event) {
    return {
      status: resolved.reason === "ambiguous" ? "ambiguous" : "not_found",
      transcript: null,
      candidates: resolved.candidates,
    };
  }
  let meetingToken;
  try {
    meetingToken = await acquireMeetingIntelligenceToken(client, account);
  } catch {
    return { status: "permission_required", transcript: null, candidates: [] };
  }

  const joinUrl =
    resolved.event.onlineMeeting?.joinUrl ??
    resolved.event.onlineMeetingUrl ??
    null;
  if (!joinUrl) {
    return { status: "not_available", transcript: null, candidates: [] };
  }

  try {
    const onlineMeeting = await findOnlineMeeting(
      meetingToken.accessToken,
      joinUrl,
    );
    if (!onlineMeeting) {
      return { status: "not_available", transcript: null, candidates: [] };
    }
    const transcripts = await graphRequest<GraphCollection<GraphTranscript>>(
      meetingToken.accessToken,
      `/me/onlineMeetings/${encodeURIComponent(onlineMeeting.id)}/transcripts`,
    );
    const latest = [...(transcripts.value ?? [])].sort((left, right) =>
      (right.createdDateTime ?? "").localeCompare(left.createdDateTime ?? ""),
    )[0];
    if (!latest) {
      return { status: "not_available", transcript: null, candidates: [] };
    }
    const contentPath = `/me/onlineMeetings/${encodeURIComponent(onlineMeeting.id)}/transcripts/${encodeURIComponent(latest.id)}/content`;
    let speakerAttribution = true;
    let content: string;
    try {
      content = await graphTextRequest(
        meetingToken.accessToken,
        contentPath,
        "text/vtt",
      );
    } catch (error) {
      if (
        error instanceof MicrosoftGraphError &&
        error.code?.toLowerCase() === "speakerattributionnotallowed"
      ) {
        speakerAttribution = false;
        content = await graphTextRequest(
          meetingToken.accessToken,
          contentPath,
          "application/vnd.microsoft.graph.transcript+text",
        );
      } else {
        throw error;
      }
    }
    const maxTranscriptCharacters = 45_000;
    return {
      status: "ready",
      transcript: {
        eventId: resolved.event.id,
        subject: resolved.event.subject ?? "Untitled meeting",
        transcriptId: latest.id,
        content: content.slice(0, maxTranscriptCharacters),
        speakerAttribution,
        truncated: content.length > maxTranscriptCharacters,
      },
      candidates: [],
    };
  } catch (error) {
    if (
      error instanceof MicrosoftGraphError &&
      error.code?.toLowerCase() === "graphaccesstotranscriptsdisabled"
    ) {
      return { status: "admin_disabled", transcript: null, candidates: [] };
    }
    if (
      error instanceof MicrosoftGraphError &&
      (error.status === 401 || error.status === 403)
    ) {
      return { status: "permission_required", transcript: null, candidates: [] };
    }
    return { status: "not_available", transcript: null, candidates: [] };
  }
}

const PUBLISH_FOLDER_NAME = "Parallel Documents";

function chooseAvailableFileName(requestedName: string, existingNames: string[]) {
  const normalizedNames = new Set(
    existingNames.map((name) => name.trim().toLocaleLowerCase()),
  );
  if (!normalizedNames.has(requestedName.toLocaleLowerCase())) {
    return requestedName;
  }

  const extensionIndex = requestedName.lastIndexOf(".");
  const base = extensionIndex > 0 ? requestedName.slice(0, extensionIndex) : requestedName;
  const extension = extensionIndex > 0 ? requestedName.slice(extensionIndex) : "";
  let copyNumber = 2;
  let candidate = `${base} (${copyNumber})${extension}`;
  while (normalizedNames.has(candidate.toLocaleLowerCase())) {
    copyNumber += 1;
    candidate = `${base} (${copyNumber})${extension}`;
  }
  return candidate;
}

async function getOrCreatePublishingFolder(
  accessToken: string,
  driveId: string,
) {
  try {
    return await graphRequest<GraphDriveItem>(
      accessToken,
      `/drives/${encodeURIComponent(driveId)}/root:/${encodeURIComponent(PUBLISH_FOLDER_NAME)}?$select=id,name,webUrl`,
    );
  } catch (error) {
    if (!(error instanceof MicrosoftGraphError) || error.status !== 404) {
      throw error;
    }
  }

  const root = await graphRequest<GraphDriveItem>(
    accessToken,
    `/drives/${encodeURIComponent(driveId)}/root?$select=id`,
  );
  try {
    return await graphRequest<GraphDriveItem>(
      accessToken,
      `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(root.id)}/children`,
      {
        method: "POST",
        body: JSON.stringify({
          name: PUBLISH_FOLDER_NAME,
          folder: {},
          "@microsoft.graph.conflictBehavior": "fail",
        }),
      },
    );
  } catch (error) {
    if (!(error instanceof MicrosoftGraphError) || error.status !== 409) {
      throw error;
    }
    return graphRequest<GraphDriveItem>(
      accessToken,
      `/drives/${encodeURIComponent(driveId)}/root:/${encodeURIComponent(PUBLISH_FOLDER_NAME)}?$select=id,name,webUrl`,
    );
  }
}

export async function publishMicrosoftBrandedDocument({
  html,
  fileName,
}: {
  html: string;
  fileName: string;
}): Promise<MicrosoftPublishedDocument> {
  const client = await getMicrosoftClient();
  const account = chooseAccount(client);
  if (!account) throw new Error("Microsoft 365 is not connected.");
  const token = await acquireDocumentPublishingToken(client, account);

  const site = await graphRequest<GraphSite>(
    token.accessToken,
    "/sites/root?$select=id,displayName,name,webUrl",
  );
  const drive = await graphRequest<GraphDrive>(
    token.accessToken,
    `/sites/${encodeURIComponent(site.id)}/drive?$select=id,name,webUrl`,
  );
  const folder = await getOrCreatePublishingFolder(
    token.accessToken,
    drive.id,
  );
  const children = await graphRequest<GraphCollection<GraphDriveItem>>(
    token.accessToken,
    `/drives/${encodeURIComponent(drive.id)}/items/${encodeURIComponent(folder.id)}/children?$top=200&$select=name`,
  );
  const availableName = chooseAvailableFileName(
    fileName,
    (children.value ?? []).map((item) => item.name ?? ""),
  );
  const published = await graphRequest<GraphDriveItem>(
    token.accessToken,
    `/drives/${encodeURIComponent(drive.id)}/items/${encodeURIComponent(folder.id)}:/${encodeURIComponent(availableName)}:/content?@microsoft.graph.conflictBehavior=rename`,
    {
      method: "PUT",
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: html,
    },
  );

  return {
    id: published.id,
    name: published.name ?? availableName,
    webUrl: published.webUrl ?? null,
    siteName: site.displayName ?? site.name ?? "SharePoint",
    folderPath: PUBLISH_FOLDER_NAME,
  };
}
