import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBrandedDocument,
  buildDocumentFileName,
  normalizeDocumentSections,
} from "../app/lib/document-template.ts";

test("builds a self-contained Parallel-branded document", () => {
  const document = buildBrandedDocument({
    kind: "procedure",
    title: "Failover Procedure",
    subtitle: "A controlled recovery path",
    purpose: "Restore service safely.",
    owner: "IT Operations",
    approver: "Pending approval",
    version: "0.1",
    effectiveDate: "Draft",
    classification: "Internal",
    sections: [
      {
        heading: "Activation",
        body: "Declare the incident.",
        bullets: ["Notify the response lead"],
      },
    ],
    sourceNote: "Prepared from the approved meeting record",
  });

  assert.match(document.html, /P<span class="ara">ARA<\/span>LLEL/);
  assert.match(document.html, /Failover Procedure/);
  assert.match(document.html, /Notify the response lead/);
  assert.equal(document.suggestedFileName, "Failover Procedure - v0.1.html");
});

test("escapes document content before placing it in the preview", () => {
  const document = buildBrandedDocument({
    kind: "brief",
    title: "<script>alert('x')</script>",
    subtitle: "",
    purpose: "Safe & clear",
    owner: "Nick",
    approver: "Pending",
    version: "1.0",
    effectiveDate: "Draft",
    classification: "Internal",
    sections: [{ heading: "Overview", body: "<img src=x>", bullets: [] }],
    sourceNote: "Parallel",
  });

  assert.doesNotMatch(document.html, /<script>/);
  assert.doesNotMatch(document.html, /<img src=x>/);
  assert.match(document.html, /&lt;script&gt;/);
  assert.match(document.html, /Safe &amp; clear/);
});

test("normalizes sections and produces a path-safe file name", () => {
  assert.deepEqual(
    normalizeDocumentSections([
      { heading: "  Steps ", body: "  Follow these  ", bullets: [" One ", ""] },
      { heading: "Empty", body: "", bullets: [] },
    ]),
    [{ heading: "Steps", body: "Follow these", bullets: ["One"] }],
  );
  assert.equal(
    buildDocumentFileName("../../Quarterly: Brief?", "v1/0"),
    "Quarterly Brief - v10.html",
  );
});
