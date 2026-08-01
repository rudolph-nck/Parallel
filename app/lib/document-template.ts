export type BrandedDocumentKind =
  | "policy"
  | "procedure"
  | "brief"
  | "meeting_record";

export type BrandedDocumentSection = {
  heading: string;
  body: string;
  bullets: string[];
};

export type BrandedDocumentDraft = {
  kind: BrandedDocumentKind;
  title: string;
  subtitle: string;
  purpose: string;
  owner: string;
  approver: string;
  version: string;
  effectiveDate: string;
  classification: string;
  sections: BrandedDocumentSection[];
  sourceNote: string;
  html: string;
  suggestedFileName: string;
};

export type BrandedDocumentInput = Omit<
  BrandedDocumentDraft,
  "html" | "suggestedFileName"
>;

const kindLabels: Record<BrandedDocumentKind, string> = {
  policy: "Policy",
  procedure: "Procedure",
  brief: "Executive brief",
  meeting_record: "Meeting record",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanText(value: string, fallback: string) {
  return value.trim() || fallback;
}

export function normalizeDocumentSections(
  sections: Array<{
    heading?: string;
    body?: string;
    bullets?: string[];
  }>,
) {
  return sections
    .map((section, index) => ({
      heading: cleanText(section.heading ?? "", `Section ${index + 1}`),
      body: section.body?.trim() ?? "",
      bullets: (section.bullets ?? [])
        .map((bullet) => bullet.trim())
        .filter(Boolean),
    }))
    .filter((section) => section.body || section.bullets.length > 0)
    .slice(0, 18);
}

export function buildDocumentFileName(title: string, version: string) {
  const safeTitle = title
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90) || "Parallel document";
  const safeVersion = version
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/^\.+/, "")
    .slice(0, 20);
  return `${safeTitle}${safeVersion ? ` - v${safeVersion.replace(/^v/i, "")}` : ""}.html`;
}

export function buildBrandedDocument(input: BrandedDocumentInput) {
  const normalized: BrandedDocumentInput = {
    ...input,
    title: cleanText(input.title, "Untitled document"),
    subtitle: input.subtitle.trim(),
    purpose: cleanText(input.purpose, "Working draft prepared with Ara."),
    owner: cleanText(input.owner, "Nick Rudolph"),
    approver: cleanText(input.approver, "Pending approval"),
    version: cleanText(input.version, "0.1"),
    effectiveDate: cleanText(input.effectiveDate, "Draft"),
    classification: cleanText(input.classification, "Internal"),
    sourceNote: cleanText(input.sourceNote, "Prepared in Parallel"),
    sections: normalizeDocumentSections(input.sections),
  };

  const sectionMarkup = normalized.sections
    .map(
      (section, index) => `
        <section class="document-section">
          <div class="section-number">${String(index + 1).padStart(2, "0")}</div>
          <div>
            <h2>${escapeHtml(section.heading)}</h2>
            ${section.body ? `<p>${escapeHtml(section.body).replaceAll("\n", "<br>")}</p>` : ""}
            ${
              section.bullets.length
                ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`
                : ""
            }
          </div>
        </section>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(normalized.title)}</title>
  <style>
    :root { --ink:#102033; --navy:#0b1726; --blue:#3f86d9; --teal:#36a99b; --mist:#edf4f7; --line:#d9e4e9; }
    * { box-sizing:border-box; }
    body { margin:0; color:var(--ink); background:#eef3f6; font-family:Arial,Helvetica,sans-serif; }
    .page { width:min(920px,100%); min-height:100vh; margin:0 auto; background:#fff; box-shadow:0 24px 70px rgba(13,31,48,.12); }
    header { padding:48px 58px 42px; color:#fff; background:radial-gradient(circle at 86% 18%,rgba(54,169,155,.3),transparent 30%),linear-gradient(135deg,var(--navy),#102b46); }
    .brand { display:flex; align-items:center; gap:12px; margin-bottom:64px; font-size:13px; font-weight:700; letter-spacing:.24em; }
    .mark { display:inline-flex; gap:4px; }
    .mark i { width:3px; height:22px; border-radius:4px; background:linear-gradient(var(--teal),#67a9f2); }
    .ara { color:#bff8ef; text-shadow:0 0 18px rgba(92,228,207,.35); }
    .kind { margin:0 0 13px; color:#8ec6ff; font-size:11px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; }
    h1 { max-width:700px; margin:0; font-family:Georgia,'Times New Roman',serif; font-size:46px; font-weight:400; line-height:1.08; }
    .subtitle { max-width:690px; margin:18px 0 0; color:#bdcbd8; font-size:16px; line-height:1.55; }
    main { padding:42px 58px 50px; }
    .purpose { margin:0 0 34px; padding:22px 24px; border-left:3px solid var(--teal); background:var(--mist); font-family:Georgia,'Times New Roman',serif; font-size:17px; line-height:1.55; }
    .metadata { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; margin:-18px 0 38px; border:1px solid var(--line); background:var(--line); }
    .metadata div { padding:13px 15px; background:#fff; }
    .metadata small { display:block; margin-bottom:5px; color:#718192; font-size:8px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; }
    .metadata b { font-size:11px; font-weight:600; }
    .document-section { display:grid; grid-template-columns:42px 1fr; gap:18px; padding:26px 0; border-top:1px solid var(--line); }
    .section-number { padding-top:5px; color:var(--teal); font-size:10px; font-weight:700; letter-spacing:.12em; }
    h2 { margin:0 0 10px; font-family:Georgia,'Times New Roman',serif; font-size:23px; font-weight:400; }
    .document-section p,.document-section li { color:#405267; font-size:13px; line-height:1.7; }
    .document-section p { margin:0; }
    ul { margin:12px 0 0; padding-left:20px; }
    footer { display:flex; justify-content:space-between; gap:24px; padding:22px 58px; color:#768595; border-top:1px solid var(--line); font-size:9px; line-height:1.5; }
    @media (max-width:640px) { header,main { padding-left:28px; padding-right:28px; } h1 { font-size:34px; } .brand { margin-bottom:44px; } .metadata { grid-template-columns:1fr 1fr; } footer { padding:20px 28px; } }
  </style>
</head>
<body>
  <article class="page">
    <header>
      <div class="brand"><span class="mark"><i></i><i></i></span><span>P<span class="ara">ARA</span>LLEL</span></div>
      <p class="kind">${escapeHtml(kindLabels[normalized.kind])} · Working draft</p>
      <h1>${escapeHtml(normalized.title)}</h1>
      ${normalized.subtitle ? `<p class="subtitle">${escapeHtml(normalized.subtitle)}</p>` : ""}
    </header>
    <main>
      <div class="metadata">
        <div><small>Owner</small><b>${escapeHtml(normalized.owner)}</b></div>
        <div><small>Approver</small><b>${escapeHtml(normalized.approver)}</b></div>
        <div><small>Version</small><b>${escapeHtml(normalized.version)}</b></div>
        <div><small>Effective</small><b>${escapeHtml(normalized.effectiveDate)}</b></div>
      </div>
      <p class="purpose">${escapeHtml(normalized.purpose)}</p>
      ${sectionMarkup || '<section class="document-section"><div class="section-number">01</div><div><h2>Draft content</h2><p>Add the working content here.</p></div></section>'}
    </main>
    <footer><span>${escapeHtml(normalized.sourceNote)}</span><span>${escapeHtml(normalized.classification)} · Version ${escapeHtml(normalized.version)}</span></footer>
  </article>
</body>
</html>`;

  return {
    ...normalized,
    html,
    suggestedFileName: buildDocumentFileName(
      normalized.title,
      normalized.version,
    ),
  } satisfies BrandedDocumentDraft;
}
