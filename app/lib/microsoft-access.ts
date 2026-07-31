export type MicrosoftCalendarAccessIssue = {
  kind: "permission_required" | "mailbox_not_ready" | "unavailable";
  code: string | null;
  status: number | null;
  message: string;
};

type MicrosoftFailureShape = {
  status?: unknown;
  code?: unknown;
  errorCode?: unknown;
};

export function describeMicrosoftCalendarError(
  error: unknown,
): MicrosoftCalendarAccessIssue {
  const failure =
    error && typeof error === "object"
      ? (error as MicrosoftFailureShape)
      : {};
  const status =
    typeof failure.status === "number" ? failure.status : null;
  const code =
    typeof failure.code === "string"
      ? failure.code
      : typeof failure.errorCode === "string"
        ? failure.errorCode
        : null;
  const normalizedCode = code?.toLowerCase() ?? "";

  if (
    status === 401 ||
    status === 403 ||
    /interaction_required|consent_required|login_required|invalidauthenticationtoken/.test(
      normalizedCode,
    )
  ) {
    return {
      kind: "permission_required",
      code,
      status,
      message: "Calendar permission needs to be approved again.",
    };
  }

  if (
    status === 404 ||
    /mailboxnotenabled|mailbox.*restapi|mailboxmoveinprogress|erroritemnotfound/.test(
      normalizedCode,
    )
  ) {
    return {
      kind: "mailbox_not_ready",
      code,
      status,
      message:
        "Microsoft is connected, but this account’s Exchange calendar is not ready yet.",
    };
  }

  return {
    kind: "unavailable",
    code,
    status,
    message: "Microsoft Calendar is temporarily unavailable.",
  };
}
