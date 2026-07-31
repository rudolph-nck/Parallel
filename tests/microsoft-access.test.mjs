import assert from "node:assert/strict";
import test from "node:test";

import { describeMicrosoftCalendarError } from "../app/lib/microsoft-access.ts";

test("identifies calendar permission failures that need renewed consent", () => {
  const issue = describeMicrosoftCalendarError({
    status: 403,
    code: "ErrorAccessDenied",
  });

  assert.equal(issue.kind, "permission_required");
});

test("identifies an Exchange mailbox that is not provisioned", () => {
  const issue = describeMicrosoftCalendarError({
    status: 404,
    code: "MailboxNotEnabledForRESTAPI",
  });

  assert.equal(issue.kind, "mailbox_not_ready");
});

test("keeps unknown calendar failures recoverable", () => {
  const issue = describeMicrosoftCalendarError({ status: 503 });

  assert.equal(issue.kind, "unavailable");
});
