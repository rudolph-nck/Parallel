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
  resolveSchedulingWindow,
} from "./calendar-window";
import {
  describeMicrosoftCalendarError,
  type MicrosoftCalendarAccessIssue,
} from "./microsoft-access";

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

type GraphCollection<T> = {
  value?: T[];
  "@odata.count"?: number;
};

type GraphProfile = {
  displayName?: string;
  mail?: string | null;
  userPrincipalName?: string;
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
    email: string;
  };
  recentMessages: GraphMessage[];
  upcomingEvents: GraphEvent[];
  sharePointSite: GraphSite | null;
  directoryPeople: number;
  calendarIssue: MicrosoftCalendarAccessIssue | null;
  capabilities: {
    mail: MicrosoftCapabilityState;
    calendar: MicrosoftCapabilityState;
    sharePoint: MicrosoftCapabilityState;
    directory: MicrosoftCapabilityState;
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

export type MicrosoftMeetingAttendee = {
  displayName: string;
  email: string;
};

export type MicrosoftMeetingProposal = {
  subject: string;
  purpose: string;
  attendees: MicrosoftMeetingAttendee[];
  start: string;
  end: string;
  deadline: string;
  durationMinutes: number;
  displayTime: string;
};

export type MicrosoftMeetingPreparation = {
  proposal: MicrosoftMeetingProposal | null;
  unresolvedAttendees: string[];
  directoryStatus: "ready" | "unavailable";
  directoryPeopleChecked: number;
};

export type MicrosoftMeetingResult = {
  id: string;
  subject: string;
  start: string;
  end: string;
  webLink: string | null;
  joinUrl: string | null;
  attendees: MicrosoftMeetingAttendee[];
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
  constructor(
    public status: number,
    public code: string | null,
  ) {
    super(`Microsoft 365 returned ${status}.`);
    this.name = "MicrosoftGraphError";
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
    let code: string | null = null;
    try {
      const body = JSON.parse(responseText) as {
        error?: { code?: string };
      };
      code = body.error?.code ?? null;
    } catch {
      // Status remains enough to select a safe recovery path.
    }
    throw new MicrosoftGraphError(response.status, code);
  }

  return (responseText ? JSON.parse(responseText) : {}) as T;
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
  rounded.setMinutes(minutes <= 30 ? 30 : 60);
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
    "/me?$select=displayName,mail,userPrincipalName",
  );

  const [mailResult, calendarResult, sharePointResult, directoryResult] =
    await Promise.allSettled([
      graphRequest<GraphCollection<GraphMessage>>(
        token.accessToken,
        "/me/messages?$top=12&$select=id,subject,from,receivedDateTime,importance,isRead,webLink&$orderby=receivedDateTime%20desc",
      ),
      graphRequest<GraphCollection<GraphEvent>>(
        token.accessToken,
        `/me/calendarView?startDateTime=${encodeURIComponent(now.toISOString())}&endDateTime=${encodeURIComponent(calendarEnd.toISOString())}&$top=50&$select=id,subject,start,end,organizer,isOnlineMeeting,onlineMeetingUrl,webLink&$orderby=start/dateTime`,
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
      email:
        profile.mail ??
        profile.userPrincipalName ??
        account.username ??
        "Connected account",
    },
    recentMessages:
      mailResult.status === "fulfilled" ? mailResult.value.value ?? [] : [],
    upcomingEvents:
      calendarResult.status === "fulfilled"
        ? calendarResult.value.value ?? []
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
    },
  };
}

export async function connectMicrosoft365() {
  const client = await getMicrosoftClient();
  await client.loginRedirect({
    scopes: [...MICROSOFT_GRAPH_SCOPES],
    redirectUri: getRedirectUri(),
    prompt: "select_account",
  });
}

export async function repairMicrosoftCalendarAccess() {
  const client = await getMicrosoftClient();
  await client.loginRedirect({
    scopes: [...MICROSOFT_GRAPH_SCOPES],
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
  );

  return {
    label: window.label,
    start: window.start.toISOString(),
    end: window.end.toISOString(),
    events: calendar.value ?? [],
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
}: {
  subject: string;
  attendeeNames: string[];
  deadlineDescription: string;
  durationMinutes?: number;
  purpose: string;
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

  if (attendeeNames.length === 0) {
    return {
      proposal: null,
      unresolvedAttendees: ["the attendee"],
      directoryStatus: "ready",
      directoryPeopleChecked: 0,
    };
  }

  let directoryPeople: DirectoryPerson[] =
    directoryPeopleCache && directoryPeopleCache.expiresAt > Date.now()
      ? directoryPeopleCache.people
      : [];
  let directoryStatus: MicrosoftMeetingPreparation["directoryStatus"] =
    "ready";
  if (directoryPeople.length === 0) {
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
    };
  }

  const now = new Date();
  const schedulingWindow = resolveSchedulingWindow(deadlineDescription, now);
  if (schedulingWindow.end <= now) {
    throw new Error("The requested deadline has already passed.");
  }
  const calendarStart = new Date(
    Math.max(now.getTime(), schedulingWindow.start.getTime()),
  );

  const calendar = await graphRequest<GraphCollection<GraphEvent>>(
    token.accessToken,
    `/me/calendarView?startDateTime=${encodeURIComponent(calendarStart.toISOString())}&endDateTime=${encodeURIComponent(schedulingWindow.end.toISOString())}&$top=100&$select=id,subject,start,end&$orderby=start/dateTime`,
  );
  const available = findAvailableMeetingTime(
    calendar.value ?? [],
    schedulingWindow.start,
    schedulingWindow.end,
    normalizedDuration,
  );

  if (!available) {
    throw new Error("No open working-hours slot was found before the deadline.");
  }

  return {
    proposal: {
      subject,
      purpose,
      attendees,
      start: available.start.toISOString(),
      end: available.end.toISOString(),
      deadline: schedulingWindow.end.toISOString(),
      durationMinutes: normalizedDuration,
      displayTime: formatMeetingTime(available.start, available.end),
    },
    unresolvedAttendees: [],
    directoryStatus,
    directoryPeopleChecked: directoryPeople.length,
  };
}

export async function createMicrosoftMeeting(
  proposal: MicrosoftMeetingProposal,
): Promise<MicrosoftMeetingResult> {
  const client = await getMicrosoftClient();
  const account = chooseAccount(client);
  if (!account) throw new Error("Microsoft 365 is not connected.");
  const token = await acquireGraphToken(client, account);

  const graphEvent = await graphRequest<GraphEvent>(
    token.accessToken,
    "/me/events",
    {
      method: "POST",
      body: JSON.stringify({
        subject: proposal.subject,
        body: {
          contentType: "text",
          content:
            proposal.purpose ||
            "Scheduled with Ara through Parallel after Nick's approval.",
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
        isOnlineMeeting: true,
        onlineMeetingProvider: "teamsForBusiness",
        transactionId: crypto.randomUUID(),
      }),
    },
  );

  return {
    id: graphEvent.id,
    subject: graphEvent.subject ?? proposal.subject,
    start: proposal.start,
    end: proposal.end,
    webLink: graphEvent.webLink ?? null,
    joinUrl:
      graphEvent.onlineMeeting?.joinUrl ??
      graphEvent.onlineMeetingUrl ??
      null,
    attendees: proposal.attendees,
  };
}
