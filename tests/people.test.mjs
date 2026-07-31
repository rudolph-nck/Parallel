import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveDirectoryPerson,
  splitAttendeeNames,
} from "../app/lib/people.ts";

const directory = [
  {
    displayName: "Noelle Carter",
    givenName: "Noelle",
    surname: "Carter",
    mail: "noelle@parallel.example",
  },
  {
    displayName: "Wesley Grant",
    givenName: "Wesley",
    surname: "Grant",
    userPrincipalName: "wes@parallel.example",
  },
  {
    displayName: "Matt Walsh",
    givenName: "Matt",
    surname: "Walsh",
    mail: "matt@parallel.example",
  },
];

test("splits names that arrive in one voice-tool argument", () => {
  assert.deepEqual(splitAttendeeNames(["Noelle and Wes", "Matt"]), [
    "Noelle",
    "Wes",
    "Matt",
  ]);
});

test("resolves common speech and short-name variations safely", () => {
  assert.equal(
    resolveDirectoryPerson("Noel", directory)?.email,
    "noelle@parallel.example",
  );
  assert.equal(
    resolveDirectoryPerson("Wes", directory)?.email,
    "wes@parallel.example",
  );
});

test("refuses an ambiguous first-name match", () => {
  assert.equal(
    resolveDirectoryPerson("Matt", [
      ...directory,
      {
        displayName: "Matt Reed",
        givenName: "Matt",
        surname: "Reed",
        mail: "matt.reed@parallel.example",
      },
    ]),
    null,
  );
});
