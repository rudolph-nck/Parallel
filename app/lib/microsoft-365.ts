"use client";

import {
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AccountInfo,
} from "@azure/msal-browser";

const MICROSOFT_CLIENT_ID = "ba9ccb38-2b16-4279-ac4f-bb42b6eb45bb";
const MICROSOFT_TENANT_ID = "31e192cb-bf66-49fb-9f79-15df4a40efda";
const REDIRECT_PATH = "/auth/microsoft/callback";

export const MICROSOFT_GRAPH_SCOPES = [
  "User.Read",
  "Mail.Read",
  "Calendars.Read",
  "Sites.Read.All",
] as const;

type GraphCollection<T> = {
  value?: T[];
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

type GraphEvent = {
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
  webLink?: string;
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

export type MicrosoftCapabilityState = "ready" | "provisioning";

export type MicrosoftSnapshot = {
  account: {
    name: string;
    email: string;
  };
  recentMessages: GraphMessage[];
  upcomingEvents: GraphEvent[];
  sharePointSite: GraphSite | null;
  capabilities: {
    mail: MicrosoftCapabilityState;
    calendar: MicrosoftCapabilityState;
    sharePoint: MicrosoftCapabilityState;
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

let microsoftClientPromise: Promise<PublicClientApplication> | null = null;

function getRedirectUri() {
  return `${window.location.origin}${REDIRECT_PATH}`;
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
  allowInteraction: boolean,
) {
  try {
    return await client.acquireTokenSilent({
      account,
      scopes: [...MICROSOFT_GRAPH_SCOPES],
    });
  } catch (error) {
    if (!allowInteraction || !(error instanceof InteractionRequiredAuthError)) {
      throw error;
    }

    return client.acquireTokenPopup({
      account,
      scopes: [...MICROSOFT_GRAPH_SCOPES],
      redirectUri: getRedirectUri(),
    });
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

  if (!response.ok) {
    throw new Error(`Microsoft 365 returned ${response.status}.`);
  }

  return (await response.json()) as T;
}

async function readMicrosoftSnapshot(
  client: PublicClientApplication,
  account: AccountInfo,
  allowInteraction: boolean,
): Promise<MicrosoftSnapshot> {
  const token = await acquireGraphToken(client, account, allowInteraction);
  const now = new Date();
  const calendarEnd = new Date(now);
  calendarEnd.setDate(calendarEnd.getDate() + 7);

  const profile = await graphRequest<GraphProfile>(
    token.accessToken,
    "/me?$select=displayName,mail,userPrincipalName",
  );

  const [mailResult, calendarResult, sharePointResult] =
    await Promise.allSettled([
      graphRequest<GraphCollection<GraphMessage>>(
        token.accessToken,
        "/me/messages?$top=12&$select=id,subject,from,receivedDateTime,importance,isRead,webLink&$orderby=receivedDateTime%20desc",
      ),
      graphRequest<GraphCollection<GraphEvent>>(
        token.accessToken,
        `/me/calendarView?startDateTime=${encodeURIComponent(now.toISOString())}&endDateTime=${encodeURIComponent(calendarEnd.toISOString())}&$top=10&$select=id,subject,start,end,organizer,isOnlineMeeting,onlineMeetingUrl,webLink&$orderby=start/dateTime`,
      ),
      graphRequest<GraphSite>(
        token.accessToken,
        "/sites/root?$select=id,displayName,name,webUrl",
      ),
    ]);

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
    capabilities: {
      mail: mailResult.status === "fulfilled" ? "ready" : "provisioning",
      calendar:
        calendarResult.status === "fulfilled" ? "ready" : "provisioning",
      sharePoint:
        sharePointResult.status === "fulfilled" ? "ready" : "provisioning",
    },
  };
}

export async function connectMicrosoft365() {
  const client = await getMicrosoftClient();
  const login = await client.loginPopup({
    scopes: [...MICROSOFT_GRAPH_SCOPES],
    redirectUri: getRedirectUri(),
    prompt: "select_account",
  });
  const account = chooseAccount(client, login.account);
  if (!account) throw new Error("Microsoft sign-in did not return an account.");
  return readMicrosoftSnapshot(client, account, true);
}

export async function restoreMicrosoft365() {
  const client = await getMicrosoftClient();
  const account = chooseAccount(client);
  if (!account) return null;
  return readMicrosoftSnapshot(client, account, false);
}

export async function refreshMicrosoft365() {
  const client = await getMicrosoftClient();
  const account = chooseAccount(client);
  if (!account) throw new Error("Microsoft 365 is not connected.");
  return readMicrosoftSnapshot(client, account, true);
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
  const token = await acquireGraphToken(client, account, true);
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
