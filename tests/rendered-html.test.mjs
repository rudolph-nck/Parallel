import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Parallel Ara dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Parallel — Move through work with clarity<\/title>/i);
  assert.match(html, /Move through work with clarity\./);
  assert.match(html, /Hey Nick—I’m really glad you’re here\./);
  assert.match(html, /Talk to Ara/);
  assert.match(html, /What can I ask you/);
  assert.match(html, /Find the signal in the noise/);
  assert.match(html, /Turn decisions into momentum/);
  assert.match(html, /Recall · Working Memory/i);
  assert.match(html, /Approvals · You Stay in Control/i);
  assert.match(html, /Find the context behind the work/i);
  assert.match(html, /Review the work. Make the call./i);
  assert.match(html, /Search Recall/i);
  assert.match(html, /Ara proposes\./);
  assert.match(html, /class="ara-signature">ARA<\/span>/);
  assert.match(html, /You decide\./);
  assert.match(html, /ATTENTION · READ ONLY/i);
  assert.match(html, /COMMITMENTS · ACCOUNTABILITY/i);
  assert.match(html, /Ara uses the least costly capable route/i);
  assert.match(html, /CONTROLLED CALENDAR/i);
  assert.match(html, /MEETING KNOWLEDGE/i);
  assert.match(html, /DESKTOP COMPANION/i);
  assert.match(html, /OUTBOUND/i);
  assert.match(html, /\/og-ara\.png/);
  assert.doesNotMatch(html, /\/og-v2\.png/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("keeps the permanent key on the server and configures live Recall voice", async () => {
  const [page, route, microsoft365, gitignore] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/realtime/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/microsoft-365.ts", import.meta.url), "utf8"),
    readFile(new URL("../.gitignore", import.meta.url), "utf8"),
  ]);

  assert.match(page, /new RTCPeerConnection\(\)/);
  assert.match(page, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(page, /fetch\("\/api\/realtime\/"/);
  assert.match(page, /response\.output_audio\.delta/);
  assert.match(page, /search_recall/);
  assert.match(page, /approve_pending_action/);
  assert.match(page, /setMicrophoneEnabled\(false\)/);
  assert.match(page, /Thoughtful pause · interrupt Ara anytime/);
  assert.match(page, /That sounds good, send it/);
  assert.match(page, /Respond naturally—“Sounds good\.”/);
  assert.match(page, /resolveCalendarConflictWithButton/);
  assert.match(page, /calendarConflicts/);
  assert.match(page, /How does that sound/);
  assert.match(page, /Looks good/);
  assert.match(page, /kept safely as a draft/);
  assert.match(page, /prepare_calendar_meeting/);
  assert.match(page, /approve_calendar_meeting/);
  assert.match(page, /Book \$\{pendingMeeting\.calendarItemType\}/);
  assert.match(page, /createMicrosoftMeeting/);
  assert.match(page, /readMicrosoftCalendar/);
  assert.match(page, /read_calendar_window/);
  assert.match(page, /calendar_period/);
  assert.match(page, /demoIntroductionInstruction/);
  assert.match(page, /track\.enabled = false/);
  assert.match(page, /repairMicrosoftCalendarAccess/);
  assert.match(page, /describeMicrosoftCalendarError/);
  assert.match(page, /Repair calendar access/);
  assert.match(page, /audioDrainGuardTimerRef/);
  assert.match(page, /autonomousCloseEligibleRef\.current = fullyCompleted/);
  assert.match(page, /prepareMicrosoftMeetingUpdate/);
  assert.match(page, /updateMicrosoftMeeting/);
  assert.match(page, /readMicrosoftMeetingTranscript/);
  assert.match(page, /Enable meeting intelligence/);
  assert.match(page, /Enable document publishing/);
  assert.match(page, /approveDocumentPublishWithButton/);
  assert.match(page, /Publish to SharePoint/);
  assert.match(page, /Transcript-ready meeting requested/);
  assert.match(page, /searchRecallWorkspace/);
  assert.match(page, /Close naturally in one to four words/);
  assert.match(page, /Want me to make this private/);
  assert.match(page, /sendMicrosoftEmail/);
  assert.match(page, /resolveWorkOwnership/);
  assert.doesNotMatch(page, /scrollIntoView/);
  assert.doesNotMatch(page, /YOUR APPROVAL IS REQUIRED/);
  assert.doesNotMatch(page, /say 'I approve'/i);
  assert.doesNotMatch(page, /OPENAI_API_KEY/);
  assert.doesNotMatch(page, /ara-welcomed/);

  assert.match(route, /process\.env\.OPENAI_API_KEY/);
  assert.match(route, /https:\/\/api\.openai\.com\/v1\/realtime\/calls/);
  assert.match(route, /gpt-realtime-2\.1/);
  assert.match(route, /reasoning:\s*\{\s*effort:\s*"low"/);
  assert.match(route, /voice:\s*"marin"/);
  assert.match(route, /name:\s*"search_recall"/);
  assert.match(route, /type:\s*"semantic_vad"/);
  assert.match(route, /eagerness:\s*"low"/);
  assert.match(route, /interrupt_response:\s*true/);
  assert.match(route, /calendar_period/);
  assert.match(route, /name:\s*"read_calendar_window"/);
  assert.match(route, /following Monday through Friday/);
  assert.match(route, /name:\s*"prepare_message_for_approval"/);
  assert.match(route, /name:\s*"approve_pending_action"/);
  assert.match(route, /name:\s*"prepare_calendar_meeting"/);
  assert.match(route, /name:\s*"approve_calendar_meeting"/);
  assert.match(route, /name:\s*"resolve_calendar_conflict"/);
  assert.match(route, /calendar_item_type/);
  assert.match(route, /online_meeting/);
  assert.match(route, /never ask "Would you like me to book it\?"/);
  assert.match(route, /lunch with a spouse, family member, or friend/);
  assert.match(route, /Never repeat Nick's full request/);
  assert.match(route, /name:\s*"prepare_meeting_update"/);
  assert.match(route, /name:\s*"approve_meeting_update"/);
  assert.match(route, /name:\s*"read_meeting_transcript"/);
  assert.match(route, /name:\s*"prepare_meeting_notes"/);
  assert.match(route, /name:\s*"prepare_branded_document"/);
  assert.match(route, /name:\s*"approve_document_publish"/);
  assert.match(route, /new, non-overwriting branded HTML document/);
  assert.match(route, /name:\s*"remember_user_preference"/);
  assert.match(route, /name:\s*"create_commitment"/);
  assert.match(route, /name:\s*"set_calendar_privacy"/);
  assert.match(route, /name:\s*"propose_delegation"/);
  assert.match(route, /name:\s*"prepare_desktop_action"/);
  assert.match(route, /tool_choice:\s*"auto"/);
  assert.match(route, /trusted right-hand person/);
  assert.match(route, /professional friend who knows Nick well/);
  assert.match(route, /Simple acknowledgements: one to four words/);
  assert.match(route, /Direct answers: one short sentence/);
  assert.match(route, /Skip preambles for direct answers/);
  assert.match(route, /never restate or paraphrase Nick's request/i);
  assert.match(route, /Let me pull up the full week/);
  assert.match(route, /close naturally in one to four words/i);
  assert.match(route, /What’s on your mind/);
  assert.match(route, /turn messy meeting notes into/i);
  assert.match(route, /How does that sound/);
  assert.match(route, /that sounds good, send/);
  assert.match(route, /bare "yes," silence, background sound/);
  assert.match(route, /Teams chat remains draft-only/);

  assert.match(microsoft365, /User\.ReadBasic\.All/);
  assert.match(microsoft365, /resolveDirectoryAttendee/);
  assert.match(microsoft365, /splitAttendeeNames/);
  assert.match(microsoft365, /directoryPeopleChecked/);
  assert.match(microsoft365, /ConsistencyLevel:\s*"eventual"/);
  assert.match(microsoft365, /resolveCalendarReadWindow/);
  assert.match(microsoft365, /\$top=100/);
  assert.match(microsoft365, /prompt:\s*"consent"/);
  assert.match(microsoft365, /MicrosoftGraphError/);
  assert.match(microsoft365, /calendarIssue/);
  assert.match(microsoft365, /OnlineMeetings\.ReadWrite/);
  assert.match(microsoft365, /OnlineMeetingTranscript\.Read\.All/);
  assert.match(microsoft365, /mergeMeetingAgenda/);
  assert.match(microsoft365, /allowTranscription:\s*true/);
  assert.match(microsoft365, /resolveRequestedCalendarSlot/);
  assert.match(microsoft365, /outlook\.timezone=\"UTC\"/);
  assert.match(microsoft365, /resolveMicrosoftCalendarConflict/);
  assert.match(microsoft365, /Files\.ReadWrite/);
  assert.match(microsoft365, /Parallel Documents/);
  assert.match(microsoft365, /publishMicrosoftBrandedDocument/);
  assert.match(microsoft365, /Mail\.Send/);
  assert.match(microsoft365, /sendMicrosoftEmail/);

  assert.match(gitignore, /\.env\*/);
});
