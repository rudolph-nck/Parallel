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
  assert.doesNotMatch(html, /Start the conversation/);
  assert.match(html, /Ara(?:'|&#x27;)s live canvas/);
  assert.match(html, /Talk to Ara/);
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
  const [page, styles, route, platformRoute, microsoft365, gitignore, viteConfig, onboardingMigration] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/api/realtime/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/platform/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/microsoft-365.ts", import.meta.url), "utf8"),
    readFile(new URL("../.gitignore", import.meta.url), "utf8"),
    readFile(new URL("../vite.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0003_normal_the_enforcers.sql", import.meta.url), "utf8"),
  ]);

  assert.match(page, /new RTCPeerConnection\(\)/);
  assert.match(page, /ara-first-moment/);
  assert.match(page, /first-moment-bars/);
  assert.match(page, /legacy-experience/);
  assert.match(page, /arrivalVoicePerformance/);
  assert.match(page, /one continuous spoken performance/);
  assert.match(page, /Welcome to Parallel\./);
  assert.match(page, /I don’t know you yet…/);
  assert.match(page, /and I don’t want to pretend that I do\./);
  assert.match(page, /What’s your name\?/);
  assert.doesNotMatch(page, /What should I call you\?/);
  assert.match(page, /setArrivalPhase\("descending"\)/);
  assert.match(page, /setArrivalPhase\("revealing"\)/);
  assert.match(page, /setArrivalPhase\("rotating"\)/);
  assert.match(page, /setArrivalPhase\("illuminating"\)/);
  assert.match(page, /arrivalVisualReadyRef/);
  assert.doesNotMatch(page, /className="startup-/);
  assert.doesNotMatch(page, /first-moment-warmth/);
  assert.match(styles, /\.legacy-experience\s*\{\s*display:\s*none !important;/);
  assert.doesNotMatch(styles, /\.startup-/);
  assert.doesNotMatch(styles, /quietWarmth|quietArrival/);
  assert.match(styles, /\.ara-first-moment[\s\S]*?background:\s*#050505;/);
  assert.match(styles, /araArrivalLight[\s\S]*?1 both/);
  assert.match(styles, /transition-duration:\s*\.01ms !important/);
  assert.match(styles, /arrival-descending/);
  assert.match(styles, /arrival-revealing/);
  assert.match(styles, /arrival-rotating/);
  assert.match(styles, /arrival-illuminating/);
  assert.match(styles, /first-moment-atmosphere-ara/);
  assert.match(styles, /first-moment-atmosphere-human/);
  assert.match(styles, /--ara-ambient-opacity/);
  assert.match(styles, /--human-ambient-opacity/);
  assert.match(styles, /transform 5\.05s/);
  assert.doesNotMatch(page, /first-moment-feed/);
  assert.doesNotMatch(page, /first-moment-stream/);
  assert.doesNotMatch(page, /first-moment-wake/);
  assert.doesNotMatch(styles, /first-moment-feed/);
  assert.doesNotMatch(styles, /first-moment-stream/);
  assert.doesNotMatch(styles, /first-moment-wake/);
  assert.doesNotMatch(styles, /ara-igniting|human-igniting/);
  assert.doesNotMatch(styles, /araFeedInjection|humanFeedInjection|araWakeEcho|araBarIgnition/);
  assert.doesNotMatch(styles, /stroke-dasharray/);
  assert.match(styles, /\.ara-color-awake \.first-moment-bars i:first-child::after/);
  assert.match(styles, /\.human-color-awake \.first-moment-bars i:last-child::after/);
  assert.doesNotMatch(styles, /arrival-illuminating \.first-moment-bars i::after/);
  assert.match(styles, /--ara-line-length/);
  assert.match(styles, /--human-line-length/);
  assert.match(styles, /--ara-halo/);
  assert.match(page, /arrival-caption-toggle/);
  assert.match(page, /quiet, brief audible inhale lasting less than half a second/);
  assert.match(page, /must not sound like a sigh, gasp, ASMR effect, or dramatic performance/);
  assert.match(page, /setAraBarAwake\(true\)/);
  assert.match(page, /setHumanBarAwake\(true\)/);
  assert.match(page, /setAraAudioActive\(true\)/);
  assert.match(page, /setAraAudioActive\(false\)/);
  assert.match(page, /setHumanAudioActive\(true\)/);
  assert.match(page, /setHumanAudioActive\(false\)/);
  assert.match(page, /first-moment-integration/);
  assert.match(page, /CAPTIONS_STORAGE_KEY/);
  assert.match(page, /arrivalRecoveryKind/);
  assert.match(page, /first-moment-autoplay-gate/);
  assert.match(page, />\s*Continue\s*</);
  assert.match(page, /addTransceiver\("audio"/);
  assert.match(page, /replaceTrack\(track\)/);
  assert.match(page, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(page, /fetch\("\/api\/realtime\/"/);
  assert.match(page, /response\.output_audio\.delta/);
  assert.match(page, /search_recall/);
  assert.match(page, /approve_pending_action/);
  assert.match(page, /setMicrophoneEnabled\(false\)/);
  assert.match(page, /setRealtimeInterruptionMode/);
  assert.match(page, /create_response:\s*enabled/);
  assert.match(page, /interrupt_response:\s*enabled/);
  assert.match(page, /setRealtimeInterruptionMode\(channel, false\)/);
  assert.match(page, /setRealtimeInterruptionMode\(channelRef\.current, true, "high"\)/);
  assert.match(page, /setRealtimeInterruptionMode\(channel, true, "medium"\)/);
  assert.match(page, /fastFirstReplyRef/);
  assert.match(page, /Thoughtful pause · interrupt Ara anytime/);
  assert.match(page, /That sounds good, send it/);
  assert.match(page, /Respond naturally—“Sounds good\.”/);
  assert.match(page, /resolveCalendarConflictWithButton/);
  assert.match(page, /calendarConflicts/);
  assert.match(page, /How does that sound/);
  assert.match(page, /Looks good/);
  assert.match(page, /Draft retained safely/);
  assert.match(page, /prepare_calendar_meeting/);
  assert.match(page, /approve_calendar_meeting/);
  assert.match(page, /Book \$\{pendingMeeting\.calendarItemType\}/);
  assert.match(page, /createMicrosoftMeeting/);
  assert.match(page, /readMicrosoftCalendar/);
  assert.match(page, /read_calendar_window/);
  assert.match(page, /focus_calendar_canvas/);
  assert.match(page, /calendar-canvas/);
  assert.match(page, /calendarCanvasFocus/);
  assert.match(page, /Ara's live canvas/);
  assert.match(page, /Let Ara observe your work quietly/);
  assert.match(page, /Connect securely/);
  assert.match(page, /onboarding\.microsoft_profile/);
  assert.doesNotMatch(page, /microsoftWelcomeRequired/);
  assert.doesNotMatch(page, /className="sidebar"/);
  assert.doesNotMatch(page, /className="mobile-nav"/);
  assert.match(page, /autoArrivalAttemptedRef/);
  assert.match(page, /Ara is arriving/);
  assert.doesNotMatch(page, /Start the conversation/);
  assert.match(page, /calendar_period/);
  assert.match(page, /demoIntroductionInstruction/);
  assert.match(page, /buildFirstMeetingInstruction/);
  assert.match(page, /ara-presence-title/);
  assert.match(page, /Your right hand in Parallel/);
  assert.match(page, /Ara brought this into view/);
  assert.match(page, /operating-grid view-panel today-view/);
  assert.match(page, /__PARALLEL_RELEASE_ID__/);
  assert.match(page, /readPlatformWorkspace\(__PARALLEL_RELEASE_ID__\)/);
  assert.match(page, /save_onboarding_identity/);
  assert.match(page, /save_onboarding_work_context/);
  assert.match(page, /void updatePlatform\("onboarding\.save_identity"/);
  assert.match(page, /void updatePlatform\("onboarding\.save_work_context"/);
  assert.match(page, /prepare_workspace_connection/);
  assert.match(page, /scan_first_day_workspace/);
  assert.match(page, /check_first_day_workspace/);
  assert.match(page, /readMicrosoftFirstDayScan/);
  assert.match(page, /createBackgroundResearchController/);
  assert.doesNotMatch(page, /CONVERSATION MEMORY/);
  assert.doesNotMatch(page, /Unread Inbox/);
  assert.doesNotMatch(page, /Try asking Ara/);
  assert.match(page, /Connect Microsoft 365/);
  assert.match(page, /track\.enabled = enabled/);
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
  assert.match(route, /eagerness:\s*"medium"/);
  assert.match(route, /noise_reduction:\s*\{\s*type:\s*"far_field"/);
  assert.match(route, /interrupt_response:\s*true/);
  assert.match(route, /opening asks "What’s your name\?"/);
  assert.match(route, /one and only post-name welcome/);
  assert.match(route, /Every spoken turn must add something new/);
  assert.match(route, /Respond to a completed social turn within one beat/);
  assert.match(route, /Silent memory tools remain silent/);
  assert.match(route, /following\s+phrases\s+are forbidden during the first meeting/);
  assert.match(route, /Ground the story in the Book of Ara/);
  assert.match(route, /Familiarity is\s+not access/);
  assert.match(route, /Never ask which single\s+channel is the problem/);
  assert.match(route, /what that burden costs them/);
  assert.match(route, /I think I have what I need for now/);
  assert.match(route, /systems:[\s\S]*communication_channels:[\s\S]*systemic_pressure:[\s\S]*protected_work:/);
  assert.match(route, /small integration handoff/);
  assert.match(route, /meet, connect,[\s\S]*observe quietly,[\s\S]*return later with findings/);
  assert.match(route, /calendar_period/);
  assert.match(route, /name:\s*"read_calendar_window"/);
  assert.match(route, /name:\s*"focus_calendar_canvas"/);
  assert.match(route, /private working context, not a dashboard or visible memory/i);
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
  assert.match(route, /Never repeat the user's full request/);
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
  assert.match(route, /name:\s*"save_onboarding_identity"/);
  assert.match(route, /name:\s*"save_onboarding_work_context"/);
  assert.match(route, /name:\s*"prepare_workspace_connection"/);
  assert.match(route, /name:\s*"scan_first_day_workspace"/);
  assert.match(route, /name:\s*"check_first_day_workspace"/);
  assert.match(route, /name:\s*"complete_first_meeting"/);
  assert.match(route, /tool_choice:\s*"auto"/);
  assert.match(route, /trusted right-hand person/);
  assert.match(route, /professional friend who earns the right to know the user well/);
  assert.match(route, /walked into your office/);
  assert.match(route, /Microsoft connection is not the opening topic/);
  assert.match(route, /Simple acknowledgements: one to four words/);
  assert.match(route, /Direct task answers: one short sentence/);
  assert.match(route, /Everyday conversation: one to three natural sentences/);
  assert.match(route, /Skip preambles for direct answers/);
  assert.match(route, /Never narrate internal thought, reasoning, or impact/);
  assert.match(route, /a single soft “Mm\.” or\s+“Ah\.” is enough/);
  assert.match(route, /never restate or paraphrase the user's request/i);
  assert.match(route, /Let me pull up the full week/);
  assert.match(route, /close naturally in one to four words/i);
  assert.match(route, /quiet memory, never a conversational agenda/i);
  assert.match(route, /Answer the question the user actually asked/);
  assert.match(route, /Discovery is a relationship, not an intake interview/);
  assert.match(route, /Build the story in four layers/);
  assert.match(route, /observe-first posture/);
  assert.match(route, /does not want to change anything yet/);
  assert.match(route, /what do you do there\?/i);
  assert.match(route, /Never respond to a direct\s+question by jumping into setup/);
  assert.match(route, /Every count or percentage must come from a tool result/);
  assert.match(route, /Do not claim Teams coverage/);
  assert.match(route, /turn messy meeting notes into/i);
  assert.match(route, /How does that sound/);
  assert.match(route, /that sounds good, send/);
  assert.match(route, /bare "yes," silence, background sound/);
  assert.match(route, /Teams chat remains draft-only/);

  assert.match(platformRoute, /action === "onboarding\.reset_for_release"/);
  assert.match(platformRoute, /action === "onboarding\.microsoft_profile"/);
  assert.match(platformRoute, /Verified Microsoft profile synchronized/);
  assert.match(platformRoute, /export async function GET\(request: Request\)/);
  assert.match(platformRoute, /x-parallel-release-id/);
  assert.match(platformRoute, /resetOnboardingForRelease/);
  assert.match(platformRoute, /event_type = 'onboarding\.release_reset'/);
  assert.match(platformRoute, /lifecycle_state = 'NEW'/);
  assert.match(platformRoute, /first_scan_json = NULL/);
  assert.match(platformRoute, /microsoftConnectionPreserved: true/);
  assert.match(platformRoute, /systems_json/);
  assert.match(platformRoute, /communication_channels_json/);
  assert.match(platformRoute, /systemic_pressure/);
  assert.match(platformRoute, /protected_work/);
  assert.match(onboardingMigration, /ADD `systems_json`/);
  assert.match(onboardingMigration, /ADD `communication_channels_json`/);

  assert.match(viteConfig, /createHash\("sha256"\)/);
  assert.match(viteConfig, /function buildReleaseId/);
  assert.match(viteConfig, /__PARALLEL_RELEASE_ID__/);

  assert.match(styles, /\.friday-panel\s*\{[^}]*display:\s*block/s);
  assert.match(styles, /\.friday-visual\s*\{[^}]*margin:\s*0 auto/s);
  assert.match(styles, /\.prompt-actions\s*\{[^}]*repeat\(3/s);
  assert.match(styles, /\.ara-view \.voice-key/);
  assert.match(styles, /\.ara-context-divider/);
  assert.match(styles, /\.calendar-canvas/);
  assert.match(styles, /\.calendar-day\.focused/);
  assert.match(styles, /\.microsoft-welcome/);

  assert.match(microsoft365, /User\.ReadBasic\.All/);
  assert.match(microsoft365, /companyName/);
  assert.match(microsoft365, /jobTitle/);
  assert.match(microsoft365, /\/me\/directReports/);
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
  assert.match(microsoft365, /readMicrosoftFirstDayScan/);
  assert.match(microsoft365, /mailFolders\/inbox/);
  assert.match(microsoft365, /buildFirstDayScan/);

  assert.match(gitignore, /\.env\*/);
});
