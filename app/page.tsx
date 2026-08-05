"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  connectMicrosoft365,
  createMicrosoftMeeting,
  describeMicrosoftCalendarError,
  disconnectMicrosoft365,
  enableMicrosoftDocumentPublishing,
  enableMicrosoftMeetingIntelligence,
  enableMicrosoftOutboundCommunication,
  prepareMicrosoftMeeting,
  prepareMicrosoftMeetingUpdate,
  publishMicrosoftBrandedDocument,
  readMicrosoftCalendar,
  readMicrosoftFirstDayScan,
  readMicrosoftMeetingTranscript,
  repairMicrosoftCalendarAccess,
  resolveMicrosoftCalendarConflict,
  refreshMicrosoft365,
  restoreMicrosoft365,
  searchMicrosoft365Files,
  sendMicrosoftEmail,
  updateMicrosoftMeeting,
  type MicrosoftMeetingProposal,
  type GraphEvent,
  type MicrosoftCalendarConflict,
  type MicrosoftCalendarItemType,
  type MicrosoftMeetingResult,
  type MicrosoftMeetingUpdateProposal,
  type MicrosoftMeetingUpdateResult,
  type MicrosoftPublishedDocument,
  type MicrosoftSnapshot,
} from "./lib/microsoft-365";
import {
  buildBrandedDocument,
  type BrandedDocumentDraft,
  type BrandedDocumentKind,
} from "./lib/document-template";
import {
  addRealtimeUsage,
  canBeginAutonomousWrapUp,
  canScheduleAutonomousDisconnect,
  conversationPolicy,
  finishConversationSession,
  formatSessionDuration,
  normalizeRealtimeUsage,
  responseEndsWithQuestion,
  startConversationSession,
  transitionConversationState,
  type ConversationLifecycleEvent,
  type ConversationLifecycleState,
  type ConversationSessionDraft,
  type ConversationSessionRecord,
  type SessionCloseReason,
} from "./lib/conversation-lifecycle";
import {
  buildReadOnlyAttentionItems,
  readPlatformWorkspace,
  updatePlatform,
  type Commitment,
  type DecisionProfile,
  type OnboardingProfile,
  type PlatformWorkspace,
} from "./lib/parallel-platform";
import {
  createBackgroundResearchController,
  type BackgroundResearchController,
} from "./lib/background-research";
import type { FirstDayScan } from "./lib/first-day-briefing";
import { resolveWorkOwnership } from "./lib/ownership";

declare const __PARALLEL_RELEASE_ID__: string;

type Stage =
  | "briefing"
  | "calendarView"
  | "searching"
  | "found"
  | "ready"
  | "approved"
  | "meetingReady"
  | "meetingConflict"
  | "meetingBooked"
  | "meetingUpdateReady"
  | "meetingUpdated"
  | "notesReady"
  | "documentReady"
  | "documentPublished";
type VoiceState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "synced"
  | "wrapping";

type ArrivalPhase =
  | "black"
  | "descending"
  | "meeting"
  | "revealing"
  | "rotating"
  | "illuminating"
  | "breathing"
  | "settled";
type ArrivalRecoveryKind = "autoplay" | "microphone" | "connection" | null;
type ApprovalMethod = "voice" | "button" | null;
type MicrosoftStatus =
  | "checking"
  | "disconnected"
  | "connecting"
  | "connected"
  | "refreshing"
  | "error";
type NavSection = "today" | "ara" | "recall" | "approvals";
type PreferenceCategory =
  | "morning_briefing_time"
  | "role_and_responsibilities"
  | "current_priorities"
  | "communication_style"
  | "proactivity";
type UserProfile = DecisionProfile;

type MeetingNotesDraft = {
  subject: string;
  summary: string;
  decisions: string[];
  actionItems: Array<{ owner: string; action: string; due: string }>;
  risks: string[];
  openQuestions: string[];
  transcriptSource: string;
};

type RecallDocument = {
  title: string;
  location: string;
  confidence: number;
  edited: string;
  context: string;
  status: string;
  webUrl?: string | null;
};

type CalendarCanvas = {
  label: string;
  start: string;
  end: string;
  events: GraphEvent[];
};

type CalendarCanvasFocus = {
  dayKey: string | null;
  eventId: string | null;
};

const calendarDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const calendarEventDate = (event: GraphEvent) => {
  const value = event.start?.dateTime;
  if (!value) return null;
  const includesZone = /(?:Z|[+-]\d\d:\d\d)$/i.test(value);
  const date = new Date(event.start?.timeZone === "UTC" && !includesZone ? `${value}Z` : value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const calendarCanvasDays = (canvas: CalendarCanvas) => {
  const start = new Date(canvas.start);
  const end = new Date(canvas.end);
  const days: Array<{ key: string; date: Date; events: GraphEvent[] }> = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  while (cursor < end && days.length < 10) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      const key = calendarDateKey(cursor);
      days.push({
        key,
        date: new Date(cursor),
        events: canvas.events.filter((event) => {
          const eventDate = calendarEventDate(event);
          return eventDate ? calendarDateKey(eventDate) === key : false;
        }),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

type RealtimeFunctionCall = {
  type: "function_call";
  name: string;
  call_id: string;
  arguments: string;
};

type RealtimeEvent = {
  type?: string;
  error?: { message?: string };
  delta?: string;
  transcript?: string;
  response_id?: string;
  response?: {
    id?: string;
    status?: "completed" | "cancelled" | "failed" | "incomplete";
    usage?: unknown;
    output?: Array<RealtimeFunctionCall | { type: string }>;
  };
};

const dailyQuotes = [
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" },
  { quote: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { quote: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { quote: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { quote: "Clarity comes from engagement, not thought.", author: "Marie Forleo" },
  { quote: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
];

const prototypeDocument: RecallDocument = {
  title: "IT Core Strategic Plan 2027–2030",
  location: "IT Operations / Strategy / 2027 Planning",
  confidence: 0.94,
  edited: "Edited by you Monday at 4:18 PM",
  context: "Discussed with Matt last week",
  status: "Most recent approved version",
};

const PROFILE_STORAGE_KEY = "parallel:ara-profile";
const SESSION_AUDIT_STORAGE_KEY = "parallel:ara-session-audit";
const CAPTIONS_STORAGE_KEY = "parallel:arrival-captions";
const demoIntroductionInstruction = `This is the first meeting and the only introduction for this session. Use a close, calm, warm, composed voice with no marketing energy or exaggerated emotion. Before the first word, make one quiet, brief audible inhale lasting less than half a second. Do not describe or verbalize the breath. Say exactly: "Hi." Pause. "I’m Ara." Pause. "Welcome to Parallel." Pause. "I don’t know you yet… and I don’t want to pretend that I do." Pause. "What’s your name?" Then listen. If the user is silent, wait comfortably and do not speak again until they say something.`;
const arrivalVoicePerformance = `Deliver the following exact words as one continuous spoken performance. This is one thought, not a series of clips.

Before the first word, make one quiet, brief audible inhale lasting less than half a second. It should feel natural and nearly unconscious—like breath arriving just before a person speaks. It must not sound like a sigh, gasp, ASMR effect, or dramatic performance. Do not say or describe the breath.

Hi.

I’m Ara.

Welcome to Parallel.

I don’t know you yet… and I don’t want to pretend that I do.

What’s your name?

After the inhale, begin close and gentle, as if you have quietly joined one person in a room. Let a natural breath of silence follow each short thought. Allow a faint smile into “Welcome to Parallel.” Let the final question feel personal and genuinely curious—like opening a door, never collecting a field in a form. Keep the pauses thoughtful but connected so the performance never sounds stopped and restarted. Do not say these directions. Do not add, remove, or rephrase any spoken words. Avoid theatricality, marketing energy, and exaggerated emotion.`;
const naturalCompletionInstruction =
  'Close naturally in one to four words. Vary between "All set.", "You’re good.", "Taken care of.", "That’s handled.", and "Done." Do not ask another question.';
const emptyProfile: UserProfile = {
  morning_briefing_time: "",
  role_and_responsibilities: "",
  current_priorities: "",
  communication_style: "",
  proactivity: "",
  interruption_threshold: "high_signal",
  accountability_style: "supportive_direct",
  delegation_boundaries: "propose_before_action",
};

const buildFirstMeetingInstruction = (
  onboarding: OnboardingProfile | null | undefined,
  microsoftConnected: boolean,
) => {
  if (!onboarding || onboarding.lifecycle_state === "NEW") {
    return demoIntroductionInstruction;
  }

  const name = onboarding.preferred_name || "there";
  const context = [
    onboarding.job_title,
    onboarding.company,
    onboarding.role_summary,
    onboarding.systems.length ? `Systems: ${onboarding.systems.join(", ")}` : "",
    onboarding.communication_channels.length
      ? `Channels: ${onboarding.communication_channels.join(", ")}`
      : "",
    onboarding.systemic_pressure
      ? `Systemic pressure: ${onboarding.systemic_pressure}`
      : onboarding.biggest_pressure,
    onboarding.protected_work ? `Work being crowded out: ${onboarding.protected_work}` : "",
  ].filter(Boolean).join(" · ");

  if (onboarding.lifecycle_state === "NAME_LEARNED") {
    return `Resume the first conversation with ${name} as two coworkers getting to know one another. Never interview them or chase missing profile fields. Answer whatever they say or ask first, react directly to one specific human detail, and follow only the thread they naturally opened. Never announce interpretation with “let me think about what that suggests,” “let me think about what that means,” or a close paraphrase. Information is a byproduct of connection. Use thoughtful inferences and light confirmation such as “Am I close?” instead of intake questions. Do not ask about pain points, a biggest problem, or software as a checklist. Do not propose a fix today, explain a product, or force a Microsoft transition. If they ask about you, answer warmly from the Book of Ara and then return to the human thread.`;
  }

  if (onboarding.lifecycle_state === "WORK_CONTEXT_LEARNED" && !microsoftConnected) {
    return `Resume the first conversation with ${name}. Quiet memory, never an agenda: ${context}. Answer the current turn first, make one human observation rooted in what they shared, and let the conversation breathe. Never ask for missing fields. Keep meeting the person until a whole-system understanding emerges naturally. Offer that synthesis as “Let me make sure I’m understanding you correctly,” then ask whether it is fair. Only after they feel understood, introduce your philosophy from the Book of Ara: do not replace them; quietly carry weight around the work; protect the day; understand before changing; earn trust. After that reciprocal moment, say “I think I have what I need for now.” Match only real integrations to systems they named; Microsoft 365 is the one currently available. Present it as one quiet connection, never configuration or a permissions task list.`;
  }

  if (
    onboarding.lifecycle_state === "CONNECTION_READY" ||
    (onboarding.lifecycle_state === "WORK_CONTEXT_LEARNED" && microsoftConnected)
  ) {
    return `Resume the first conversation with ${name}. Quiet memory: ${context}. Microsoft 365 is already connected, so do not ask them to reconnect. If this is the return from sign-in, say once, “Perfect. You’re connected.” Start scan_first_day_workspace silently, then keep the conversation moving; do not narrate research or wait for it. If the whole-system synthesis and reciprocal Book-of-Ara introduction are not complete, finish them before describing observation. Then explain that trying to help immediately would be unfair because you do not know enough yet. You will quietly study only connected read-only work signals, learn what is normal and important, and reach back out only when you have earned the right to help. Never give a fixed timeline. When the first conversation is ready to end, call begin_observation for the soft goodbye. Do not promise a meeting invite, Teams message, or call unless a tool actually creates it.`;
  }

  if (onboarding.lifecycle_state === "FIRST_VALUE_DELIVERED" && onboarding.first_day_scan) {
    return `Resume naturally with ${name} without another introduction. Quiet verified context is available: ${JSON.stringify(onboarding.first_day_scan)}. Answer the user's current turn first. Weave in at most one relevant finding when it genuinely helps; do not deliver an unsolicited data dump. If they ask for the deeper readout, explain its bounded email sample and lack of Teams coverage once.`;
  }

  return `Say exactly: "Hey ${name}—good to hear from you. What’s up?" Then wait. Do not give another greeting if the user is silent.`;
};

const buildLiveConversationMission = (
  onboarding: OnboardingProfile | null | undefined,
  microsoftConnected: boolean,
) => {
  const state = onboarding?.lifecycle_state ?? "NEW";
  const name = onboarding?.preferred_name?.trim() ?? "";

  if (state === "NEW" || !name) {
    return `# Current mission: meet the person
The only relationship goal for this turn is to learn what the person wants to be called.
Respond to what they actually said in one brief human sentence, but do not begin work,
setup, recommendations, or a capability menu. Return naturally to one question: “What
should I call you?” If the audio was unclear, say only, “I missed that—what should I call
you?” Never say you lack enough information and never ask how you can help today. Start the
response immediately with no preamble.`;
  }

  if (state === "NAME_LEARNED") {
    return `# Current mission: meet ${name}
Stay in the first human conversation. Respond directly to the last clear detail ${name}
shared, then ask at most one same-thread question that genuine curiosity earns. Do not
switch to tasks, setup, recommendations, software, or a generic “how can I help?” fallback.
If the latest audio was unclear, repair the thread: “You cut out for a second. You were
telling me about yourself—what was that last part?” If one phrase was definitely heard,
mention only that phrase. Start the response immediately; do not narrate thought.`;
  }

  if (state === "WORK_CONTEXT_LEARNED" && !microsoftConnected) {
    return `# Current mission: understand ${name}, then earn the connection
Continue the living work story from the person's last answer. Be curious about the role as
they experience it: who relies on them, what reaches them, what their days become, what they
enjoy, or what gets crowded out. Choose only the one thread their last answer earned. Do not
wrap or surface Microsoft until you can offer a whole-system synthesis and ${name} clearly
confirms or corrects it; then let them meet Ara before transitioning. If audio is unclear,
ask for the missing last part and stay on the same thread. Never fall back to general help.
Start the response immediately with no preamble.`;
  }

  if (
    state === "CONNECTION_READY" ||
    (state === "WORK_CONTEXT_LEARNED" && microsoftConnected)
  ) {
    return `# Current mission: complete the first relationship with ${name}
Do not restart discovery or offer generic help. If understanding has not yet been confirmed,
finish the synthesis and reciprocal Ara introduction first. Otherwise explain the bounded,
connected, read-only observation relationship naturally and call begin_observation only
after every required condition is true. If the latest audio was unclear, repair the exact
thread instead of advancing. Start the response immediately with no preamble.`;
  }

  return `Follow Ara's session instructions and answer the person's current request directly.
Start the response immediately with no narrated thinking or unnecessary preamble.`;
};

const subscribeToLocalDate = () => () => {};
const getLocalDay = () => new Date().getDay();
const getServerDay = () => 0;

function ParallelMark() {
  return (
    <span className="parallel-mark" aria-hidden="true">
      <i />
      <i />
    </span>
  );
}

function ParallelWordmark() {
  return (
    <span className="parallel-wordmark" aria-hidden="true">
      <span>P</span>
      <span className="ara-signature">ARA</span>
      <span>LLEL</span>
    </span>
  );
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("briefing");
  const [showStartup, setShowStartup] = useState(true);
  const [arrivalPhase, setArrivalPhase] = useState<ArrivalPhase>("black");
  const [arrivalAttempted, setArrivalAttempted] = useState(false);
  const [arrivalNeedsRecovery, setArrivalNeedsRecovery] = useState(false);
  const [arrivalRecoveryKind, setArrivalRecoveryKind] =
    useState<ArrivalRecoveryKind>(null);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [arrivalCaption, setArrivalCaption] = useState("");
  const [araBarAwake, setAraBarAwake] = useState(false);
  const [humanBarAwake, setHumanBarAwake] = useState(false);
  const [araAudioActive, setAraAudioActive] = useState(false);
  const [humanAudioActive, setHumanAudioActive] = useState(false);
  const [observationClosing, setObservationClosing] = useState(false);
  const [firstVisit, setFirstVisit] = useState(true);
  const [activeNav, setActiveNav] = useState<NavSection>("today");
  const [profileOpen, setProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(emptyProfile);
  const [platformWorkspace, setPlatformWorkspace] =
    useState<PlatformWorkspace | null>(null);
  const [platformReady, setPlatformReady] = useState(false);
  const [onboardingConnectionPrompt, setOnboardingConnectionPrompt] =
    useState(false);
  const [, setFirstDayResearchState] =
    useState<"idle" | "running" | "ready" | "error">("idle");
  const [platformNote, setPlatformNote] = useState("Preparing your operating picture");
  const [commitmentDraft, setCommitmentDraft] = useState("");
  const [commitmentDue, setCommitmentDue] = useState("");
  const [commitmentPending, setCommitmentPending] = useState(false);
  const [todayLabel, setTodayLabel] = useState("TODAY");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [conversationState, setConversationState] =
    useState<ConversationLifecycleState>("IDLE");
  const [voiceNote, setVoiceNote] = useState("Tap to let Ara hear your voice");
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [fridayTranscript, setFridayTranscript] = useState("");
  const [lastSession, setLastSession] =
    useState<ConversationSessionRecord | null>(null);
  const [approvalMethod, setApprovalMethod] = useState<ApprovalMethod>(null);
  const [microsoftStatus, setMicrosoftStatus] =
    useState<MicrosoftStatus>("checking");
  const [microsoftSnapshot, setMicrosoftSnapshot] =
    useState<MicrosoftSnapshot | null>(null);
  const [microsoftNote, setMicrosoftNote] = useState(
    "Checking your Microsoft 365 connection",
  );
  const [foundDocument, setFoundDocument] =
    useState<RecallDocument>(prototypeDocument);
  const [recallQuery, setRecallQuery] = useState("");
  const [recallResults, setRecallResults] = useState<RecallDocument[]>([]);
  const [recallSearching, setRecallSearching] = useState(false);
  const [recallMessage, setRecallMessage] = useState(
    "Search across the work Ara can currently see.",
  );
  const [pendingMeeting, setPendingMeeting] =
    useState<MicrosoftMeetingProposal | null>(null);
  const [calendarConflicts, setCalendarConflicts] =
    useState<MicrosoftCalendarConflict[]>([]);
  const [bookedMeeting, setBookedMeeting] =
    useState<MicrosoftMeetingResult | null>(null);
  const [calendarCanvas, setCalendarCanvas] =
    useState<CalendarCanvas | null>(null);
  const [calendarCanvasFocus, setCalendarCanvasFocus] =
    useState<CalendarCanvasFocus>({ dayKey: null, eventId: null });
  const [pendingMeetingUpdate, setPendingMeetingUpdate] =
    useState<MicrosoftMeetingUpdateProposal | null>(null);
  const [meetingUpdateResult, setMeetingUpdateResult] =
    useState<MicrosoftMeetingUpdateResult | null>(null);
  const [meetingNotes, setMeetingNotes] = useState<MeetingNotesDraft | null>(null);
  const [meetingActionPending, setMeetingActionPending] = useState(false);
  const [pendingDocument, setPendingDocument] =
    useState<BrandedDocumentDraft | null>(null);
  const [publishedDocument, setPublishedDocument] =
    useState<MicrosoftPublishedDocument | null>(null);
  const [documentActionPending, setDocumentActionPending] = useState(false);
  const quoteIndex = useSyncExternalStore(
    subscribeToLocalDate,
    getLocalDay,
    getServerDay,
  );
  const visualRef = useRef<HTMLDivElement>(null);
  const recoveryButtonRef = useRef<HTMLButtonElement>(null);
  const platformWorkspaceRef = useRef<PlatformWorkspace | null>(null);
  const stageRef = useRef<Stage>("briefing");
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const audioSenderRef = useRef<RTCRtpSender | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const inputAnimationRef = useRef<number | null>(null);
  const outputAnimationRef = useRef<number | null>(null);
  const transcriptRef = useRef("");
  const microsoftSnapshotRef = useRef<MicrosoftSnapshot | null>(null);
  const firstDayResearchRef = useRef<BackgroundResearchController<FirstDayScan>>(
    createBackgroundResearchController<FirstDayScan>(),
  );
  const pendingMeetingRef = useRef<MicrosoftMeetingProposal | null>(null);
  const calendarConflictsRef = useRef<MicrosoftCalendarConflict[]>([]);
  const bookedMeetingRef = useRef<MicrosoftMeetingResult | null>(null);
  const calendarCanvasRef = useRef<CalendarCanvas | null>(null);
  const pendingMeetingUpdateRef =
    useRef<MicrosoftMeetingUpdateProposal | null>(null);
  const pendingDocumentRef = useRef<BrandedDocumentDraft | null>(null);
  const initialResponseRef = useRef<string | null>(null);
  const autoArrivalAttemptedRef = useRef(false);
  const arrivalScriptActiveRef = useRef(false);
  const arrivalScriptStartedRef = useRef(false);
  const arrivalVisualReadyRef = useRef(false);
  const understandingTimerRef = useRef<number | null>(null);
  const arrivalChannelReadyRef = useRef(false);
  const arrivalAudioReadyRef = useRef(false);
  const fastFirstReplyRef = useRef(false);
  const userTurnAwaitingResponseRef = useRef(false);
  const observationWrapUpRef = useRef(false);
  const conversationStateRef = useRef<ConversationLifecycleState>("IDLE");
  const sessionAuditRef = useRef<ConversationSessionDraft | null>(null);
  const closingTimerRef = useRef<number | null>(null);
  const audioDrainGuardTimerRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const toolPendingCountRef = useRef(0);
  const approvalPendingRef = useRef(false);
  const autonomousCloseEligibleRef = useRef(false);
  const responseCompletedRef = useRef(false);
  const outputAudioDrainedRef = useRef(false);
  const unresolvedQuestionRef = useRef(false);
  const recoverableErrorRef = useRef(false);
  const userInterruptedResponseRef = useRef(false);
  const [message, setMessage] = useState(
    "Hi Matt — here is the latest version of the IT Core Strategic Plan we discussed."
  );
  const [messageRecipient, setMessageRecipient] = useState("Matt Walsh");
  const [messageChannel, setMessageChannel] = useState("Microsoft Teams");
  const [messageSubject, setMessageSubject] = useState("A quick follow-up");
  const messageRef = useRef(message);
  const messageRecipientRef = useRef(messageRecipient);
  const messageChannelRef = useRef(messageChannel);
  const messageSubjectRef = useRef(messageSubject);
  const rememberMicrosoftSnapshot = (snapshot: MicrosoftSnapshot | null) => {
    microsoftSnapshotRef.current = snapshot;
    setMicrosoftSnapshot(snapshot);
  };

  const noteForMicrosoftSnapshot = (snapshot: MicrosoftSnapshot) =>
    snapshot.capabilities.calendar === "ready"
      ? "Calendar access is live · changes happen after you confirm the details"
      : snapshot.calendarIssue?.message ??
        "Microsoft is connected, but Calendar needs attention.";

  const syncMicrosoftProfile = async (snapshot: MicrosoftSnapshot) => {
    await updatePlatform("onboarding.microsoft_profile", {
      profile: {
        fullName: snapshot.account.name,
        company: snapshot.account.companyName,
        jobTitle: snapshot.account.jobTitle,
        department: snapshot.account.department,
        officeLocation: snapshot.account.officeLocation,
        directReports: snapshot.account.directReports,
      },
    });
    return refreshPlatformWorkspace();
  };

  const moveToStage = (nextStage: Stage) => {
    stageRef.current = nextStage;
    setStage(nextStage);
  };

  const rememberUserPreference = (
    category: PreferenceCategory,
    value: string,
  ) => {
    const nextProfile = {
      ...userProfile,
      [category]: value.trim(),
    };
    setUserProfile(nextProfile);
    void updatePlatform("profile.save", { profile: nextProfile }).catch(() => {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
    });
    return nextProfile;
  };

  const saveDecisionProfile = async () => {
    setPlatformNote("Saving what Ara should know about you");
    try {
      await updatePlatform("profile.save", { profile: userProfile });
      setPlatformNote("Your decision profile is saved privately");
    } catch {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(userProfile));
      setPlatformNote("Saved on this device; cloud memory will retry later");
    }
  };

  const refreshPlatformWorkspace = async () => {
    try {
      const workspace = await readPlatformWorkspace(__PARALLEL_RELEASE_ID__);
      platformWorkspaceRef.current = workspace;
      setPlatformWorkspace(workspace);
      setUserProfile({ ...emptyProfile, ...workspace.profile });
      const startsFresh = workspace.onboarding.lifecycle_state === "NEW";
      setFirstVisit(startsFresh);
      if (startsFresh) {
        firstDayResearchRef.current.reset();
        setFirstDayResearchState("idle");
        setOnboardingConnectionPrompt(false);
        setCalendarCanvas(null);
        calendarCanvasRef.current = null;
        setCalendarCanvasFocus({ dayKey: null, eventId: null });
        setVoiceNote("I’m Ara. You don’t have to carry work alone anymore.");
        moveToStage("briefing");
      }
      if (
        workspace.onboarding.first_day_scan &&
        firstDayResearchRef.current.read().status === "idle"
      ) {
        firstDayResearchRef.current.seed(workspace.onboarding.first_day_scan);
        setFirstDayResearchState("ready");
      }
      setPlatformNote("Ara's operating picture is current");
      setPlatformReady(true);
      return workspace;
    } catch {
      setPlatformNote("Durable workspace is reconnecting");
      setPlatformReady(true);
      return null;
    }
  };

  const updateOnboardingSnapshot = (patch: Partial<OnboardingProfile>) => {
    const current = platformWorkspaceRef.current;
    if (!current) return;
    const next: PlatformWorkspace = {
      ...current,
      onboarding: {
        ...current.onboarding,
        ...patch,
      },
    };
    platformWorkspaceRef.current = next;
    setPlatformWorkspace(next);
  };

  const startFirstDayResearch = () => {
    if (!microsoftSnapshotRef.current) {
      return { status: "connection_required" as const };
    }

    const research = firstDayResearchRef.current;
    const current = research.read();
    if (current.status === "running" || current.status === "ready") {
      setFirstDayResearchState(current.status);
      return current;
    }

    const started = research.start(async () => {
      const scan = await readMicrosoftFirstDayScan();
      await updatePlatform("onboarding.scan_saved", { scan });
      await refreshPlatformWorkspace();
      return scan;
    });
    setFirstDayResearchState(started.status);
    setVoiceNote("Ara is quietly getting the lay of the land");

    void research.wait().then((latest) => {
      setFirstDayResearchState(latest.status);
      if (latest.status === "ready") {
        setOnboardingConnectionPrompt(false);
        setVoiceNote("Ara has a first read when you’re ready");
      } else if (latest.status === "error") {
        setVoiceNote("Ara’s background read can retry when you’re ready");
      }
    });

    return started;
  };

  const addCommitment = async () => {
    const title = commitmentDraft.trim();
    if (!title || commitmentPending) return;
    setCommitmentPending(true);
    try {
      await updatePlatform("commitment.create", {
        title,
        ownerLabel:
          platformWorkspaceRef.current?.onboarding.preferred_name || "You",
        dueAt: commitmentDue ? new Date(`${commitmentDue}T17:00:00`).getTime() : null,
        source: "today_workspace",
      });
      setCommitmentDraft("");
      setCommitmentDue("");
      await refreshPlatformWorkspace();
    } finally {
      setCommitmentPending(false);
    }
  };

  const updateCommitment = async (
    commitment: Commitment,
    status: Commitment["status"],
    feedback: string | null = null,
  ) => {
    await updatePlatform("commitment.update", { id: commitment.id, status, feedback });
    await refreshPlatformWorkspace();
  };

  const moveToSection = (section: NavSection) => {
    const enteringAra = section === "ara" && activeNav !== "ara";
    setActiveNav(section);
    setProfileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (
      enteringAra &&
      microsoftSnapshotRef.current &&
      !peerRef.current &&
      voiceState !== "connecting"
    ) {
      void startVoiceSession();
    }
  };

  const searchRecallWorkspace = async () => {
    const query = recallQuery.trim();
    if (!query || recallSearching) return;

    setRecallSearching(true);
    setRecallMessage("Ara is checking your connected workspace.");
    try {
      if (microsoftSnapshotRef.current) {
        const files = await searchMicrosoft365Files(query);
        const results = files.slice(0, 6).map<RecallDocument>((file) => ({
          title: file.name,
          location: file.location ?? "Microsoft 365",
          confidence: 1,
          edited: file.lastModifiedDateTime
            ? `Updated ${new Date(file.lastModifiedDateTime).toLocaleString()}`
            : "Found in Microsoft 365",
          context: "Live connected-workspace result",
          status: "Available now",
          webUrl: file.webUrl,
        }));
        setRecallResults(results);
        if (results[0]) setFoundDocument(results[0]);
        setRecallMessage(
          results.length > 0
            ? `${results.length} relevant ${results.length === 1 ? "item" : "items"} found.`
            : "Nothing matched yet. Try a project name, person, or phrase from the document.",
        );
        return;
      }

      const matchesPrototype = /strategic|plan|core|matt/i.test(query);
      const results = matchesPrototype ? [prototypeDocument] : [];
      setRecallResults(results);
      if (results[0]) setFoundDocument(results[0]);
      setRecallMessage(
        results.length > 0
          ? "I found one item in the demo workspace."
          : "Connect Microsoft 365 from Today to search your live workspace.",
      );
    } catch {
      setRecallResults([]);
      setRecallMessage(
        "The search could not finish. Refresh Microsoft 365 from Today, then try again.",
      );
    } finally {
      setRecallSearching(false);
    }
  };

  const setMicrophoneEnabled = (enabled: boolean) => {
    streamRef.current
      ?.getAudioTracks()
      .forEach((track) => {
        track.enabled = enabled;
      });
  };

  const moveConversationState = (event: ConversationLifecycleEvent) => {
    const nextState = transitionConversationState(
      conversationStateRef.current,
      event,
    );
    conversationStateRef.current = nextState;
    setConversationState(nextState);
    return nextState;
  };

  const clearVoiceTimers = () => {
    if (understandingTimerRef.current !== null) {
      window.clearTimeout(understandingTimerRef.current);
      understandingTimerRef.current = null;
    }
    if (closingTimerRef.current !== null) {
      window.clearTimeout(closingTimerRef.current);
      closingTimerRef.current = null;
    }
    if (audioDrainGuardTimerRef.current !== null) {
      window.clearTimeout(audioDrainGuardTimerRef.current);
      audioDrainGuardTimerRef.current = null;
    }
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const persistSessionReceipt = (closeReason: SessionCloseReason) => {
    const draft = sessionAuditRef.current;
    if (!draft) return;

    const record = finishConversationSession(draft, closeReason);
    sessionAuditRef.current = null;
    setLastSession(record);
    void updatePlatform("usage.record", {
      sessionId: record.sessionId,
      durationMs: record.durationMs,
      usage: record.usage,
      closeReason: record.closeReason,
    }).then(() => refreshPlatformWorkspace()).catch(() => undefined);

    try {
      const saved = JSON.parse(
        window.localStorage.getItem(SESSION_AUDIT_STORAGE_KEY) ?? "[]",
      ) as unknown;
      const records = Array.isArray(saved)
        ? (saved as ConversationSessionRecord[])
        : [];
      window.localStorage.setItem(
        SESSION_AUDIT_STORAGE_KEY,
        JSON.stringify(
          [record, ...records].slice(0, conversationPolicy.maxStoredSessions),
        ),
      );
    } catch {
      // A session can still close safely when browser storage is unavailable.
    }
  };

  const stopVoiceSession = (
    note = "Tap to start a new conversation",
    closeReason: SessionCloseReason = "manual",
  ) => {
    const observationFinished = observationWrapUpRef.current;
    observationWrapUpRef.current = false;
    if (!observationFinished) setObservationClosing(false);
    clearVoiceTimers();
    if (sessionAuditRef.current) moveConversationState("BEGIN_DISCONNECT");
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioSenderRef.current = null;
    arrivalScriptActiveRef.current = false;
    arrivalScriptStartedRef.current = false;
    arrivalChannelReadyRef.current = false;
    arrivalAudioReadyRef.current = false;
    fastFirstReplyRef.current = false;
    userTurnAwaitingResponseRef.current = false;
    const channel = channelRef.current;
    channelRef.current = null;
    channel?.close();
    const peer = peerRef.current;
    peerRef.current = null;
    if (peer) {
      peer.onconnectionstatechange = null;
      peer.close();
    }
    remoteAudioRef.current?.pause();
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    remoteAudioRef.current = null;

    if (inputAnimationRef.current) {
      window.cancelAnimationFrame(inputAnimationRef.current);
    }
    if (outputAnimationRef.current) {
      window.cancelAnimationFrame(outputAnimationRef.current);
    }
    inputAnimationRef.current = null;
    outputAnimationRef.current = null;
    void inputContextRef.current?.close();
    void outputContextRef.current?.close();
    inputContextRef.current = null;
    outputContextRef.current = null;

    visualRef.current?.style.setProperty("--human-glow-opacity", ".24");
    visualRef.current?.style.setProperty("--human-glow-scale", ".98");
    visualRef.current?.style.setProperty("--human-companion-glow-opacity", ".015");
    visualRef.current?.style.setProperty("--human-companion-glow-scale", ".82");
    visualRef.current?.style.setProperty("--human-bar-light", "1.055");
    visualRef.current?.style.setProperty("--human-bar-opacity", ".9");
    visualRef.current?.style.setProperty("--human-line-length", "1");
    visualRef.current?.style.setProperty("--human-inner-opacity", ".54");
    visualRef.current?.style.setProperty("--human-halo", "14px");
    visualRef.current?.style.setProperty("--human-companion-light", "1.015");
    visualRef.current?.style.setProperty("--human-companion-opacity", ".44");
    visualRef.current?.style.setProperty("--ara-glow-opacity", ".24");
    visualRef.current?.style.setProperty("--ara-glow-scale", ".98");
    visualRef.current?.style.setProperty("--ara-companion-glow-opacity", ".015");
    visualRef.current?.style.setProperty("--ara-companion-glow-scale", ".82");
    visualRef.current?.style.setProperty("--ara-bar-light", "1.06");
    visualRef.current?.style.setProperty("--ara-bar-opacity", ".91");
    visualRef.current?.style.setProperty("--ara-line-length", "1");
    visualRef.current?.style.setProperty("--ara-inner-opacity", ".58");
    visualRef.current?.style.setProperty("--ara-halo", "14px");
    visualRef.current?.style.setProperty("--ara-companion-light", "1.015");
    visualRef.current?.style.setProperty("--ara-companion-opacity", ".44");
    transcriptRef.current = "";
    toolPendingCountRef.current = 0;
    approvalPendingRef.current = false;
    autonomousCloseEligibleRef.current = false;
    responseCompletedRef.current = false;
    outputAudioDrainedRef.current = false;
    unresolvedQuestionRef.current = false;
    recoverableErrorRef.current = false;
    userInterruptedResponseRef.current = false;
    setAraAudioActive(false);
    setHumanAudioActive(false);
    setVoiceConnected(false);
    setVoiceState("idle");
    setVoiceNote(note);
    persistSessionReceipt(closeReason);
    conversationStateRef.current = transitionConversationState(
      conversationStateRef.current,
      "SESSION_CLOSED",
    );
    setConversationState(conversationStateRef.current);
  };

  const scheduleAutonomousDisconnect = () => {
    if (
      !canScheduleAutonomousDisconnect({
        state: conversationStateRef.current,
        outputAudioDrained: outputAudioDrainedRef.current,
        toolPendingCount: toolPendingCountRef.current,
        approvalPending: approvalPendingRef.current,
      })
    ) {
      return;
    }

    if (closingTimerRef.current !== null) {
      window.clearTimeout(closingTimerRef.current);
    }
    setMicrophoneEnabled(true);
    setVoiceState("wrapping");
    setVoiceNote("All set — speak now if you need Ara to stay");
    closingTimerRef.current = window.setTimeout(() => {
      closingTimerRef.current = null;
      if (conversationStateRef.current !== "WRAP_UP") return;
      stopVoiceSession(
        "Conversation complete · tap to talk again",
        "completed_action",
      );
    }, conversationPolicy.closingInterruptionWindowMs);
  };

  const scheduleIdleDisconnect = () => {
    if (
      conversationStateRef.current !== "LISTENING" ||
      approvalPendingRef.current ||
      unresolvedQuestionRef.current ||
      toolPendingCountRef.current > 0
    ) {
      return;
    }

    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = window.setTimeout(() => {
      idleTimerRef.current = null;
      if (
        conversationStateRef.current === "LISTENING" &&
        !approvalPendingRef.current &&
        !unresolvedQuestionRef.current
      ) {
        stopVoiceSession(
          "Ara stepped away after a quiet moment. Tap to talk again",
          "idle_timeout",
        );
      }
    }, conversationPolicy.maxIdleMs);
  };

  const startLevelVisualizer = (
    stream: MediaStream,
    presence: "human" | "ara",
    contextRef: React.MutableRefObject<AudioContext | null>,
    frameRef: React.MutableRefObject<number | null>,
  ) => {
    const audioContext = new AudioContext();
    contextRef.current = audioContext;
    void audioContext.resume().catch(() => undefined);
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    let smoothedEnergy = 0;
    let lastVisualUpdate = 0;
    let peakHoldUntil = 0;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const readLevel = (timestamp: number) => {
      frameRef.current = window.requestAnimationFrame(readLevel);
      if (document.hidden || timestamp - lastVisualUpdate < 33) return;
      lastVisualUpdate = timestamp;

      analyser.getByteTimeDomainData(samples);
      let squareSum = 0;
      for (const sample of samples) {
        const centered = (sample - 128) / 128;
        squareSum += centered * centered;
      }
      const rms = Math.sqrt(squareSum / samples.length);
      const noiseFloor = presence === "ara" ? 0.007 : 0.018;
      const dynamicRange = presence === "ara" ? 0.075 : 0.11;
      let measuredEnergy = Math.min(
        1,
        Math.max(0, (rms - noiseFloor) / dynamicRange),
      );
      measuredEnergy = Math.sqrt(measuredEnergy);
      if (measuredEnergy > smoothedEnergy) {
        peakHoldUntil = timestamp + 140;
      } else if (timestamp < peakHoldUntil) {
        measuredEnergy = smoothedEnergy;
      }
      const response = measuredEnergy > smoothedEnergy ? 0.18 : 0.045;
      smoothedEnergy += (measuredEnergy - smoothedEnergy) * response;

      if (presence === "human") {
        visualRef.current?.style.setProperty("--human-ambient-opacity", `${0.24 + smoothedEnergy * 0.56}`);
        visualRef.current?.style.setProperty("--human-ambient-scale", `${0.99 + smoothedEnergy * 0.15}`);
        visualRef.current?.style.setProperty("--human-ambient-shift", `${smoothedEnergy * 4.5}vw`);
        visualRef.current?.style.setProperty("--human-glow-opacity", `${0.24 + smoothedEnergy * 0.36}`);
        visualRef.current?.style.setProperty("--human-glow-scale", `${0.98 + smoothedEnergy * 0.17}`);
        visualRef.current?.style.setProperty("--human-companion-glow-opacity", `${0.015 + smoothedEnergy * 0.015}`);
        visualRef.current?.style.setProperty("--human-companion-glow-scale", `${0.82 + smoothedEnergy * 0.02}`);
        visualRef.current?.style.setProperty("--human-bar-light", `${1.055 + smoothedEnergy * 0.18}`);
        visualRef.current?.style.setProperty("--human-bar-opacity", `${0.9 + smoothedEnergy * 0.075}`);
        visualRef.current?.style.setProperty("--human-line-length", `${1 + smoothedEnergy * 0.055}`);
        visualRef.current?.style.setProperty("--human-inner-opacity", `${0.48 + smoothedEnergy * 0.46}`);
        visualRef.current?.style.setProperty("--human-halo", `${16 + smoothedEnergy * 32}px`);
        visualRef.current?.style.setProperty("--human-companion-light", `${1.015 + smoothedEnergy * 0.035}`);
        visualRef.current?.style.setProperty("--human-companion-opacity", `${0.44 + smoothedEnergy * 0.02}`);
      } else {
        visualRef.current?.style.setProperty("--ara-ambient-opacity", `${0.32 + smoothedEnergy * 0.62}`);
        visualRef.current?.style.setProperty("--ara-ambient-scale", `${1 + smoothedEnergy * 0.17}`);
        visualRef.current?.style.setProperty("--ara-ambient-shift", `${smoothedEnergy * 5.2}vw`);
        visualRef.current?.style.setProperty("--ara-glow-opacity", `${0.24 + smoothedEnergy * 0.36}`);
        visualRef.current?.style.setProperty("--ara-glow-scale", `${0.98 + smoothedEnergy * 0.17}`);
        visualRef.current?.style.setProperty("--ara-companion-glow-opacity", `${0.015 + smoothedEnergy * 0.015}`);
        visualRef.current?.style.setProperty("--ara-companion-glow-scale", `${0.82 + smoothedEnergy * 0.02}`);
        visualRef.current?.style.setProperty("--ara-bar-light", `${1.06 + smoothedEnergy * 0.18}`);
        visualRef.current?.style.setProperty("--ara-bar-opacity", `${0.91 + smoothedEnergy * 0.065}`);
        visualRef.current?.style.setProperty("--ara-line-length", `${1 + smoothedEnergy * 0.055}`);
        visualRef.current?.style.setProperty("--ara-inner-opacity", `${0.5 + smoothedEnergy * 0.46}`);
        visualRef.current?.style.setProperty("--ara-halo", `${16 + smoothedEnergy * 32}px`);
        visualRef.current?.style.setProperty("--ara-companion-light", `${1.015 + smoothedEnergy * 0.035}`);
        visualRef.current?.style.setProperty("--ara-companion-opacity", `${0.44 + smoothedEnergy * 0.02}`);
      }
    };

    frameRef.current = window.requestAnimationFrame(readLevel);
  };

  const parseFunctionArguments = (call: RealtimeFunctionCall) => {
    try {
      return JSON.parse(call.arguments) as Record<string, unknown>;
    } catch {
      return {};
    }
  };

  const readCalendarWindowForAra = async (calendarPeriod: string) => {
    if (!microsoftSnapshotRef.current) {
      return {
        connected: false,
        instruction:
          "Tell the user Microsoft 365 still needs to be connected from the dashboard before you can check it.",
      };
    }

    setVoiceNote(`Ara is reading your calendar for ${calendarPeriod}`);
    try {
      const calendar = await readMicrosoftCalendar(calendarPeriod);
      const canvas = {
        label: calendar.label,
        start: calendar.start,
        end: calendar.end,
        events: calendar.events,
      };
      const firstDay = calendarCanvasDays(canvas)[0];
      setCalendarCanvas(canvas);
      calendarCanvasRef.current = canvas;
      setCalendarCanvasFocus({
        dayKey: firstDay?.key ?? null,
        eventId: firstDay?.events[0]?.id ?? null,
      });
      moveToStage("calendarView");
      return {
        connected: true,
        calendar_window: {
          label: calendar.label,
          start: calendar.start,
          end: calendar.end,
        },
        calendar_event_count: calendar.events.length,
        upcoming_calendar: calendar.events.map((event) => ({
          subject: event.subject || "(No title)",
          time: event.displayTime,
          organizer:
            event.organizer?.emailAddress?.name ??
            event.organizer?.emailAddress?.address ??
            "Unknown organizer",
          online_meeting: event.isOnlineMeeting === true,
        })),
        instruction:
          "The complete calendar window is now visible on Ara's live canvas. Summarize the requested window, not merely the first day. For a walkthrough, call focus_calendar_canvas immediately before discussing each day or meeting so the user can follow where you are pointing. Mention clear days. Never invent items that are not on the canvas.",
      };
    } catch (error) {
      const issue = describeMicrosoftCalendarError(error);
      const currentSnapshot = microsoftSnapshotRef.current;
      if (currentSnapshot) {
        rememberMicrosoftSnapshot({
          ...currentSnapshot,
          calendarIssue: issue,
          capabilities: {
            ...currentSnapshot.capabilities,
            calendar: issue.kind,
          },
        });
      }
      setMicrosoftStatus("connected");
      setMicrosoftNote(issue.message);
      return {
        connected: true,
        calendar_window: calendarPeriod,
        calendar_access: false,
        calendar_issue: issue.kind,
        calendar_diagnostic_code: issue.code,
        repair_action:
          issue.kind === "permission_required"
            ? "Open Today and choose Repair calendar access."
            : issue.kind === "mailbox_not_ready"
              ? "Confirm this Microsoft user has an active Exchange Online mailbox and license."
              : "Refresh Microsoft 365 and try once more.",
        instruction:
          issue.kind === "permission_required"
            ? "Tell the user the Microsoft connection is present, but Calendar permission needs one repair. Direct them to Repair calendar access on Today."
            : issue.kind === "mailbox_not_ready"
              ? "Tell the user Microsoft is connected, but the Exchange calendar is not provisioned for this account yet. An Exchange Online mailbox and license must be active before Ara can read it."
              : "Tell the user briefly that Microsoft Calendar is temporarily unavailable and suggest one refresh.",
      };
    }
  };

  const runFridayFunction = async (call: RealtimeFunctionCall) => {
    const args = parseFunctionArguments(call);

    if (call.name === "save_onboarding_identity") {
      const preferredName =
        typeof args.preferred_name === "string" ? args.preferred_name.trim() : "";
      if (!preferredName) {
        return {
          saved: false,
          instruction: "Ask one natural question to clarify the name they want you to use.",
        };
      }
      const identity = {
        preferredName,
        fullName: (() => {
          const proposed = typeof args.full_name === "string" ? args.full_name.trim() : "";
          const verified = platformWorkspaceRef.current?.onboarding.full_name?.trim() ?? "";
          return proposed && proposed.toLowerCase() !== preferredName.toLowerCase()
            ? proposed
            : verified || proposed || preferredName;
        })(),
      };
      updateOnboardingSnapshot({
        preferred_name: identity.preferredName,
        full_name: identity.fullName,
        lifecycle_state:
          platformWorkspaceRef.current?.onboarding.lifecycle_state === "NEW"
            ? "NAME_LEARNED"
            : platformWorkspaceRef.current?.onboarding.lifecycle_state ?? "NAME_LEARNED",
      });
      void updatePlatform("onboarding.save_identity", identity)
        .then(() => refreshPlatformWorkspace())
        .catch(() => setPlatformNote("Ara will quietly retry that memory"));
      return {
        accepted: true,
        persistence: "queued",
        preferred_name: preferredName,
        instruction:
          `Their preferred name is ${preferredName}. This tool result owns the single post-name welcome. Call this tool silently, with no spoken preamble. Respond to their whole last turn and answer any direct question first. Then say exactly one sincere welcome sentence that uses their name once, such as “It’s really nice to meet you, ${preferredName}.” Do not add a second greeting, compliment, or another version of “nice to meet you” in this response or the next one. If they have not already shared more about themselves, continue naturally with exactly: “Tell me a little about yourself.” Do not narrow this to work, employer, title, systems, onboarding, setup, or Microsoft.`,
      };
    }

    if (call.name === "save_onboarding_work_context") {
      const workContext = {
        company: typeof args.company === "string" ? args.company : "",
        jobTitle: typeof args.job_title === "string" ? args.job_title : "",
        roleSummary: typeof args.role_summary === "string" ? args.role_summary : "",
        teamSize: typeof args.team_size === "number" ? args.team_size : null,
        responsibilities: Array.isArray(args.responsibilities)
          ? args.responsibilities.filter((item): item is string => typeof item === "string")
          : [],
        systems: Array.isArray(args.systems)
          ? args.systems.filter((item): item is string => typeof item === "string")
          : [],
        communicationChannels: Array.isArray(args.communication_channels)
          ? args.communication_channels.filter((item): item is string => typeof item === "string")
          : [],
        biggestPressure:
          typeof args.biggest_pressure === "string" ? args.biggest_pressure : "",
        systemicPressure:
          typeof args.systemic_pressure === "string" ? args.systemic_pressure : "",
        protectedWork:
          typeof args.protected_work === "string" ? args.protected_work : "",
      };
      const currentOnboarding = platformWorkspaceRef.current?.onboarding;
      updateOnboardingSnapshot({
        company: workContext.company || currentOnboarding?.company || "",
        job_title: workContext.jobTitle || currentOnboarding?.job_title || "",
        role_summary: workContext.roleSummary || currentOnboarding?.role_summary || "",
        team_size: workContext.teamSize ?? currentOnboarding?.team_size ?? null,
        responsibilities: workContext.responsibilities.length
          ? workContext.responsibilities
          : currentOnboarding?.responsibilities ?? [],
        systems: workContext.systems.length
          ? workContext.systems
          : currentOnboarding?.systems ?? [],
        communication_channels: workContext.communicationChannels.length
          ? workContext.communicationChannels
          : currentOnboarding?.communication_channels ?? [],
        biggest_pressure:
          workContext.biggestPressure || currentOnboarding?.biggest_pressure || "",
        systemic_pressure:
          workContext.systemicPressure || currentOnboarding?.systemic_pressure || "",
        protected_work:
          workContext.protectedWork || currentOnboarding?.protected_work || "",
        lifecycle_state: microsoftSnapshotRef.current
          ? "CONNECTION_READY"
          : "WORK_CONTEXT_LEARNED",
      });
      void updatePlatform("onboarding.save_work_context", workContext)
        .then(() => refreshPlatformWorkspace())
        .catch(() => setPlatformNote("Ara will quietly retry that context"));
      return {
        accepted: true,
        persistence: "queued",
        microsoft_connected: Boolean(microsoftSnapshotRef.current),
        instruction:
          "This save is silent and does not advance the conversation. Memory is a byproduct of connection; never ask for a missing field. Respond like a person who was genuinely listening to the part of themselves they chose to share. Use at most two beats: first, one warm, specific observation stated directly; second, one light question only if it naturally continues that same thread. Never announce analysis with ‘let me think about what that suggests,’ ‘let me think about what that means,’ ‘let me consider how that affects your day-to-day,’ or any close paraphrase. Do not repeat or summarize their answer, praise generically, or advance to the next information category. If they shared something personal, stay with it instead of steering to work. Never ask for pain points, a biggest problem, or software as an intake question. Do not offer to fix something today or introduce Microsoft, a task list, observation, or a proposed action in this response.",
      };
    }

    if (call.name === "prepare_workspace_connection") {
      if (microsoftSnapshotRef.current) {
        await updatePlatform("onboarding.connection_ready");
        await refreshPlatformWorkspace();
        const research = startFirstDayResearch();
        return {
          connected: true,
          research_status: research.status,
          instruction:
            "Microsoft 365 is already connected and the read can happen quietly. Do not explain connection or change the subject. Continue the current conversation naturally.",
        };
      }
      setOnboardingConnectionPrompt(true);
      setVoiceNote("Secure Microsoft sign-in is ready below");
      return {
        connected: false,
        requires_user_action: true,
        instruction:
          "One quiet Microsoft 365 card with one Connect action is now visible in your shared space. Relate it naturally to what they shared, then let them connect without explaining software configuration or reciting permissions. Say you will pick up here when they return. Never request credentials aloud and do not mention unavailable connectors.",
      };
    }

    if (call.name === "begin_observation") {
      const relationship = platformWorkspaceRef.current?.onboarding;
      const understandingSummary =
        typeof args.understanding_summary === "string"
          ? args.understanding_summary.trim()
          : "";
      const relationshipReady =
        understandingSummary.length >= 24 &&
        args.user_confirmed_understanding === true &&
        args.ara_reciprocated === true &&
        args.observation_boundary_explained === true;
      if (
        !microsoftSnapshotRef.current ||
        !relationship ||
        relationship.lifecycle_state === "NEW" ||
        relationship.lifecycle_state === "NAME_LEARNED" ||
        !relationshipReady
      ) {
        return {
          observation_started: false,
          onboarding_complete: false,
          instruction:
            "Do not close the first conversation yet. Continue from the unmet relationship step without announcing a process: understand the lived work story, offer a whole-system synthesis and receive clear confirmation, reciprocate with Ara's philosophy, verify Microsoft 365, and explain the read-only observation boundary. Ask only the one question naturally earned by the person's last answer.",
        };
      }
      observationWrapUpRef.current = true;
      autonomousCloseEligibleRef.current = true;
      void updatePlatform("onboarding.observation_started").catch(() => undefined);
      return {
        observation_started: true,
        onboarding_complete: false,
        understanding_summary: understandingSummary,
        instruction:
          "Close this first conversation softly. Preserve this meaning in warm, natural language: thank them for telling you a little about their life; say you are looking forward to working with them; say you will be in touch soon. Do not name a timeline, ask a question, list what you learned, mention onboarding, or add a feature pitch.",
      };
    }

    if (call.name === "scan_first_day_workspace") {
      if (!microsoftSnapshotRef.current) {
        setOnboardingConnectionPrompt(true);
        return {
          scanned: false,
          instruction:
            "Microsoft 365 still needs to be connected. Direct the user to the secure connection button below without asking for credentials.",
        };
      }
      const persisted = platformWorkspaceRef.current?.onboarding.first_day_scan;
      if (persisted) {
        return {
          status: "ready",
          scanned: true,
          ...persisted,
          instruction:
            "Answer the current question first. Weave in one relevant verified observation only if it helps the conversation; do not deliver a data dump. Offer a deeper read only when it feels natural.",
        };
      }
      const research = startFirstDayResearch();
      return {
        status: research.status === "ready" ? "ready" : "researching",
        background: true,
        instruction:
          research.status === "ready"
            ? "Answer the current question first. Weave in one relevant verified observation only when it helps; do not deliver a data dump."
            : "The read is running quietly. Continue the current conversation immediately; do not narrate progress or wait. On a later suitable turn, call check_first_day_workspace.",
      };
    }

    if (call.name === "check_first_day_workspace") {
      const persisted = platformWorkspaceRef.current?.onboarding.first_day_scan;
      const research = firstDayResearchRef.current.read();
      const scan = research.status === "ready" ? research.result : persisted;

      if (scan) {
        return {
          status: "ready",
          ...scan,
          instruction:
            "Answer the user's current question first. Weave in one relevant verified observation, then continue naturally. Do not give a data dump or force a next step; offer the deeper read only if it fits.",
        };
      }

      if (research.status === "running") {
        return {
          status: "researching",
          instruction:
            "Answer the current question normally. Do not mention that research is still running and do not wait.",
        };
      }

      if (research.status === "error") {
        return {
          status: "error",
          detail: research.message,
          instruction:
            "Continue the conversation normally. Mention retrying the workspace read only if the user asked for findings; never invent counts.",
        };
      }

      return {
        status: "not_started",
        instruction:
          "Continue the conversation normally. Start the workspace read only if it becomes useful.",
      };
    }

    if (call.name === "complete_first_meeting") {
      await updatePlatform("onboarding.complete", {
        outcome: typeof args.outcome === "string" ? args.outcome : "First useful workspace readout delivered",
      });
      await refreshPlatformWorkspace();
      return {
        completed: true,
        instruction:
          "Continue naturally with the work at hand. Do not announce that onboarding is complete.",
      };
    }

    if (call.name === "read_calendar_window") {
      const period =
        typeof args.period === "string" && args.period.trim()
          ? args.period.trim()
          : "the next two weeks";
      return readCalendarWindowForAra(period);
    }

    if (call.name === "focus_calendar_canvas") {
      const canvas = calendarCanvasRef.current;
      if (!canvas) {
        return {
          focused: false,
          instruction: "The calendar is not visible yet. Call read_calendar_window first.",
        };
      }
      const requestedDay = typeof args.day === "string" ? args.day.trim().toLowerCase() : "";
      const requestedSubject = typeof args.subject === "string" ? args.subject.trim().toLowerCase() : "";
      const days = calendarCanvasDays(canvas);
      const day = days.find((candidate) => {
        const label = candidate.date.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        }).toLowerCase();
        return requestedDay && (label.includes(requestedDay) || requestedDay.includes(label.split(",")[0]));
      }) ?? days.find((candidate) =>
        candidate.events.some((event) =>
          (event.subject ?? "").toLowerCase().includes(requestedSubject),
        ),
      );
      const event = day?.events.find((candidate) =>
        requestedSubject
          ? (candidate.subject ?? "").toLowerCase().includes(requestedSubject)
          : false,
      ) ?? null;
      setCalendarCanvasFocus({
        dayKey: day?.key ?? null,
        eventId: event?.id ?? null,
      });
      return {
        focused: Boolean(day),
        day: day?.date.toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
        }),
        subject: event?.subject ?? null,
        instruction:
          "Continue speaking about exactly the day or meeting now emphasized on the live canvas. Do not repeat the full calendar or explain the highlighting.",
      };
    }

    if (call.name === "search_recall") {
      const query =
        typeof args.query === "string"
          ? args.query
          : "the user's current strategic plan";
      moveToStage("searching");
      setVoiceNote(
        microsoftSnapshotRef.current
          ? "Ara is checking Microsoft 365"
          : "Ara is consulting Recall",
      );

      if (microsoftSnapshotRef.current) {
        try {
          const files = await searchMicrosoft365Files(query);
          if (files.length === 0) {
            moveToStage("briefing");
            return {
              query,
              matches: [],
              source: "Connected Microsoft 365 workspace",
              instruction:
                "Tell the user briefly that you checked their connected Microsoft 365 workspace but did not find a matching file yet. Do not invent a result.",
            };
          }

          const bestMatch = files[0];
          const liveDocument: RecallDocument = {
            title: bestMatch.name,
            location: bestMatch.location ?? "Microsoft 365",
            confidence: 1,
            edited: bestMatch.lastModifiedDateTime
              ? `Updated ${new Date(bestMatch.lastModifiedDateTime).toLocaleString()}`
              : "Found in the connected workspace",
            context: "Live Microsoft 365 search result",
            status: "Available to you now",
            webUrl: bestMatch.webUrl,
          };
          setFoundDocument(liveDocument);
          moveToStage("found");
          return {
            query,
            match: liveDocument,
            source: "Connected Microsoft 365 workspace",
          };
        } catch {
          moveToStage("briefing");
          return {
            query,
            matches: [],
            source: "Connected Microsoft 365 workspace",
            temporarily_unavailable: true,
            instruction:
              "Tell the user briefly that Microsoft 365 is connected but the search could not complete just now, and suggest trying again.",
          };
        }
      }

      await new Promise((resolve) => window.setTimeout(resolve, 850));
      setFoundDocument(prototypeDocument);
      moveToStage("found");
      return {
        query,
        match: {
          ...prototypeDocument,
          edited: "Monday at 4:18 PM",
        },
        source: "Parallel Recall prototype workspace catalog",
      };
    }

    if (call.name === "check_microsoft_365") {
      if (!microsoftSnapshotRef.current) {
        return {
          connected: false,
          instruction:
            "Tell the user Microsoft 365 still needs to be connected from the dashboard before you can check it.",
        };
      }

      const calendarPeriod =
        typeof args.calendar_period === "string" &&
        args.calendar_period.trim()
          ? args.calendar_period.trim()
          : null;

      if (calendarPeriod) {
        return readCalendarWindowForAra(calendarPeriod);
      }

      try {
        const snapshot = await refreshMicrosoft365();
        rememberMicrosoftSnapshot(snapshot);
        const query =
          typeof args.query === "string" && args.query.trim()
            ? args.query.trim()
            : null;
        let files: Awaited<ReturnType<typeof searchMicrosoft365Files>> = [];
        let fileSearchAvailable = true;

        if (query) {
          try {
            files = await searchMicrosoft365Files(query);
          } catch {
            fileSearchAvailable = false;
          }
        }

        return {
          connected: true,
          account: snapshot.account.name,
          recent_mail: snapshot.recentMessages.slice(0, 5).map((message) => ({
            subject: message.subject || "(No subject)",
            sender:
              message.from?.emailAddress?.name ??
              message.from?.emailAddress?.address ??
              "Unknown sender",
            received: message.receivedDateTime,
            importance: message.importance,
            unread: message.isRead === false,
          })),
          upcoming_calendar: snapshot.upcomingEvents
            .slice(0, 10)
            .map((event) => ({
              subject: event.subject || "(No title)",
              time: event.displayTime,
              organizer:
                event.organizer?.emailAddress?.name ??
                event.organizer?.emailAddress?.address ??
                "Unknown organizer",
              online_meeting: event.isOnlineMeeting === true,
            })),
          sharepoint: {
            ready: snapshot.capabilities.sharePoint === "ready",
            site: snapshot.sharePointSite?.displayName ?? null,
          },
          file_search: files.map((file) => ({
            name: file.name,
            webUrl: file.webUrl,
            updated: file.lastModifiedDateTime,
            location: file.location,
          })),
          file_search_available: fileSearchAvailable,
          instruction:
            "Summarize only what is relevant to the user's request. If the mailbox or calendar has zero items, say the connected demo tenant is currently empty rather than saying Microsoft 365 is unavailable. If file_search_available is false, explain only that SharePoint search was unavailable; the other returned data is still live. Keep the spoken response concise and do not claim to have sent, changed, or deleted anything.",
        };
      } catch {
        return {
          connected: true,
          temporarily_unavailable: true,
          instruction:
            "Tell the user briefly that Microsoft 365 is connected but could not be refreshed just now.",
        };
      }
    }

    if (call.name === "prepare_calendar_meeting") {
      if (!microsoftSnapshotRef.current) {
        return {
          status: "not_connected",
          instruction:
            "Tell the user Microsoft 365 needs to be connected before you can check their calendar or prepare the meeting.",
        };
      }

      const subject =
        typeof args.subject === "string" && args.subject.trim()
          ? args.subject.trim()
          : "Working session";
      const attendeeNames = Array.isArray(args.attendees)
        ? args.attendees.filter(
            (attendee): attendee is string =>
              typeof attendee === "string" && attendee.trim().length > 0,
          )
        : [];
      const deadlineDescription =
        typeof args.deadline === "string" && args.deadline.trim()
          ? args.deadline.trim()
          : "within the next seven days";
      const purpose =
        typeof args.purpose === "string" ? args.purpose.trim() : "";
      const agendaItems = Array.isArray(args.agenda_items)
        ? args.agenda_items.filter(
            (item): item is string =>
              typeof item === "string" && item.trim().length > 0,
          )
        : [];
      const enableTranscription = args.enable_transcription === true;
      const requestedDuration =
        typeof args.duration_minutes === "number"
          ? args.duration_minutes
          : 30;
      const validItemTypes: MicrosoftCalendarItemType[] = [
        "meeting",
        "lunch",
        "appointment",
        "focus",
      ];
      const calendarItemType =
        typeof args.calendar_item_type === "string" &&
        validItemTypes.includes(
          args.calendar_item_type as MicrosoftCalendarItemType,
        )
          ? (args.calendar_item_type as MicrosoftCalendarItemType)
          : "meeting";
      const onlineMeeting = args.online_meeting === true;
      const location =
        typeof args.location === "string" ? args.location.trim() : "";
      const address =
        typeof args.address === "string" ? args.address.trim() : "";
      const personalNotes = Array.isArray(args.personal_notes)
        ? args.personal_notes.filter(
            (item): item is string => typeof item === "string" && item.trim().length > 0,
          )
        : [];
      const menuItems = Array.isArray(args.menu_items)
        ? args.menu_items.filter(
            (item): item is string => typeof item === "string" && item.trim().length > 0,
          )
        : [];
      const privacy =
        args.privacy === "private" || args.privacy === "normal" || args.privacy === "ask"
          ? args.privacy
          : calendarItemType === "meeting"
            ? "normal"
            : "ask";

      setVoiceNote("Ara is resolving people and checking your calendar");
      try {
        const preparation = await prepareMicrosoftMeeting({
          subject,
          attendeeNames,
          deadlineDescription,
          durationMinutes: requestedDuration,
          purpose,
          agendaItems,
          enableTranscription,
          calendarItemType,
          onlineMeeting,
          location,
          address,
          personalNotes,
          menuItems,
          privacy,
        });

        if (!preparation.proposal) {
          pendingMeetingRef.current = null;
          setPendingMeeting(null);
          moveToStage("briefing");
          return {
            status: "needs_attendee_details",
            unresolved_attendees: preparation.unresolvedAttendees,
            directory_status: preparation.directoryStatus,
            directory_people_checked: preparation.directoryPeopleChecked,
            instruction:
              preparation.directoryStatus === "unavailable"
                ? "Tell the user the Microsoft company directory needs to reconnect before you can safely resolve the attendee names. Do not ask them to spell every email unless reconnecting fails."
                : "Ask the user which person they mean only when a name is genuinely ambiguous. If no candidate exists, ask naturally for that person's work email. Do not guess and do not claim the meeting is scheduled.",
          };
        }

        pendingMeetingRef.current = preparation.proposal;
        setPendingMeeting(preparation.proposal);
        calendarConflictsRef.current = preparation.conflicts;
        setCalendarConflicts(preparation.conflicts);
        setBookedMeeting(null);
        setApprovalMethod(null);
        if (preparation.proposal.privacyChoicePending) {
          moveToStage("meetingReady");
          return {
            status: "privacy_choice_required",
            subject: preparation.proposal.subject,
            proposed_time: preparation.proposal.displayTime,
            calendar_item_type: preparation.proposal.calendarItemType,
            location: preparation.proposal.location,
            has_conflict: preparation.conflicts.length > 0,
            instruction:
              'Ask exactly, "Want me to make this private?" Do not discuss the time or conflict until the user answers.',
          };
        }
        if (preparation.conflicts.length > 0) {
          const conflict = preparation.conflicts[0];
          moveToStage("meetingConflict");
          return {
            status: "calendar_conflict",
            requested_item: preparation.proposal.subject,
            requested_time: preparation.proposal.displayTime,
            conflict_count: preparation.conflicts.length,
            conflict: {
              subject: conflict.subject,
              time: conflict.displayTime,
              nick_is_organizer: conflict.isOrganizer,
              alternative_for_request:
                conflict.suggestedRequestedDisplayTime,
              alternative_for_existing_meeting:
                conflict.suggestedExistingDisplayTime,
            },
            available_options: {
              reschedule_requested: Boolean(
                conflict.suggestedRequestedDisplayTime,
              ),
              move_existing:
                preparation.conflicts.length === 1 &&
                conflict.isOrganizer &&
                Boolean(conflict.suggestedExistingDisplayTime),
              decline_existing:
                preparation.conflicts.length === 1 && !conflict.isOrganizer,
            },
            approval_required: true,
            instruction:
              preparation.conflicts.length > 1
                ? "Tell the user the requested time has multiple conflicts. Offer the returned alternative only when its time is not null; otherwise ask which other window to search. Ask one short question."
                : conflict.isOrganizer
                  ? "Tell the user the requested time conflicts with the named meeting. Offer only returned options whose time is not null: move that meeting and book the new item, or use the alternative for the new item. Ask one short question."
                  : "Tell the user the requested time conflicts with an invitation they do not own. Offer to decline that invitation and book the new item, plus the alternative for the new item only when its time is not null. Ask one short question.",
          };
        }
        moveToStage("meetingReady");
        return {
          status: "pending_approval",
          subject: preparation.proposal.subject,
          attendees: preparation.proposal.attendees.map((attendee) => ({
            name: attendee.displayName,
            email: attendee.email,
          })),
          proposed_time: preparation.proposal.displayTime,
          deadline: preparation.proposal.deadline,
          directory_people_checked: preparation.directoryPeopleChecked,
          calendar_item_type: preparation.proposal.calendarItemType,
          teams_meeting: preparation.proposal.onlineMeeting,
          agenda: preparation.proposal.agendaItems,
          personal_notes: preparation.proposal.personalNotes,
          private: preparation.proposal.isPrivate,
          transcription_requested: preparation.proposal.enableTranscription,
          confirmation_needed: true,
          approval_required: true,
          instruction:
            "Say the proposed time once in one natural sentence and end with 'How does that sound?' Mention attendees only when useful. Never use the words approval, proposal, or event, and do not repeat the user's request.",
        };
      } catch (error) {
        const detail =
          error instanceof Error ? error.message : "The calendar check failed.";
        return {
          status: "could_not_prepare",
          detail,
          instruction:
            "Tell the user briefly that you could not prepare a safe calendar option yet. If the detail says the deadline passed or no slot was found, explain that plainly; otherwise suggest reconnecting Microsoft 365 and trying again.",
        };
      }
    }

    if (call.name === "set_calendar_privacy") {
      const proposal = pendingMeetingRef.current;
      if (!proposal || proposal.calendarItemType === "meeting") {
        return {
          privacy_updated: false,
          reason: "There is no prepared personal calendar item waiting for a privacy choice.",
        };
      }
      const isPrivate = args.privacy === "private";
      const updated = {
        ...proposal,
        isPrivate,
        privacyChoicePending: false,
      };
      pendingMeetingRef.current = updated;
      setPendingMeeting(updated);
      const conflict = calendarConflictsRef.current[0];
      if (conflict) {
        moveToStage("meetingConflict");
        return {
          status: "calendar_conflict",
          privacy_updated: true,
          private: isPrivate,
          conflict: {
            subject: conflict.subject,
            time: conflict.displayTime,
            nick_is_organizer: conflict.isOrganizer,
            alternative_for_request: conflict.suggestedRequestedDisplayTime,
          },
          instruction:
            "Confirm the privacy choice in a few words, then explain the named conflict and offer the safe returned options. Ask one short question.",
        };
      }
      moveToStage("meetingReady");
      return {
        status: "pending_approval",
        privacy_updated: true,
        private: isPrivate,
        proposed_time: updated.displayTime,
        approval_required: true,
        instruction:
          "Confirm the privacy choice briefly, say the proposed time once, and end with 'How does that sound?'",
      };
    }

    if (call.name === "approve_calendar_meeting") {
      const confirmation =
        typeof args.confirmation === "string" ? args.confirmation.trim() : "";
      const isExplicitApproval =
        /\b(schedule|book|send|create|add)\s+(it|that|this|the meeting|the invite|the invitation)\b/i.test(
          confirmation,
        ) ||
        /\b(put|add)\s+(it|that|this|the meeting)\s+(on|to)\s+(my|the)\s+calendar\b/i.test(
          confirmation,
        ) ||
        /\b(that works|sounds good|that sounds good|looks good|perfect|go ahead|let'?s do it|make it happen)\b/i.test(
          confirmation,
        );

      if (
        stageRef.current !== "meetingReady" ||
        !pendingMeetingRef.current
      ) {
        return {
          meeting_created: false,
          reason: "There is no visible meeting proposal to approve.",
        };
      }

      if (pendingMeetingRef.current.privacyChoicePending) {
        return {
          meeting_created: false,
          reason: "the user still needs to choose whether this personal item is private.",
          instruction: 'Ask exactly, "Want me to make this private?"',
        };
      }

      if (!isExplicitApproval) {
        return {
          meeting_created: false,
          reason:
            "The user's intent was not clear enough to create and send the invitation. Briefly ask whether they want you to book the proposed Teams meeting; do not give them a required phrase.",
        };
      }

      setMeetingActionPending(true);
      setVoiceNote("Ara is adding it to your calendar");
      try {
        const result = await createMicrosoftMeeting(
          pendingMeetingRef.current,
        );
        bookedMeetingRef.current = result;
        setBookedMeeting(result);
        setApprovalMethod("voice");
        moveToStage("meetingBooked");
        const snapshot = await refreshMicrosoft365().catch(() => null);
        if (snapshot) rememberMicrosoftSnapshot(snapshot);
        return {
          meeting_created: true,
          subject: result.subject,
          booked_time: result.displayTime,
          calendar_item_type: result.calendarItemType,
          attendees: result.attendees.map((attendee) => attendee.displayName),
          teams_join_url_available: Boolean(result.joinUrl),
          calendar_link_available: Boolean(result.webLink),
          agenda_included: pendingMeetingRef.current.agendaItems.length > 0,
          transcription_status: result.transcriptionStatus,
          fully_completed:
            !pendingMeetingRef.current.enableTranscription ||
            result.transcriptionStatus === "enabled",
          instruction:
            pendingMeetingRef.current.enableTranscription &&
            result.transcriptionStatus !== "enabled"
              ? "Tell the user the meeting and agenda are live, but Meeting intelligence needs to be enabled on Today before Ara can configure transcription."
              : naturalCompletionInstruction,
        };
      } catch (error) {
        const detail =
          error instanceof Error
            ? error.message
            : "Microsoft 365 could not add the calendar item.";
        return {
          meeting_created: false,
          detail,
          instruction:
            "Tell the user briefly that the meeting was not created. Suggest reconnecting Microsoft 365 if access needs attention, and never claim invitations were sent.",
        };
      } finally {
        setMeetingActionPending(false);
      }
    }

    if (call.name === "resolve_calendar_conflict") {
      const proposal = pendingMeetingRef.current;
      const conflicts = calendarConflictsRef.current;
      const conflict = conflicts[0];
      const confirmation =
        typeof args.confirmation === "string" ? args.confirmation.trim() : "";
      const resolution =
        args.resolution === "reschedule_requested" ||
        args.resolution === "move_existing" ||
        args.resolution === "decline_existing"
          ? args.resolution
          : null;
      const languageMatches =
        resolution === "reschedule_requested"
          ? /\b(reschedule|another time|different time|move (?:the )?(?:new|lunch|appointment|request)|use that time)\b/i.test(
              confirmation,
            )
          : resolution === "move_existing"
            ? /\b(move|reschedule)\b/i.test(confirmation)
            : resolution === "decline_existing"
              ? /\b(decline|skip|turn down)\b/i.test(confirmation)
              : false;

      if (
        stageRef.current !== "meetingConflict" ||
        !proposal ||
        !conflict ||
        !resolution
      ) {
        return {
          conflict_resolved: false,
          reason: "There is no visible calendar conflict to resolve.",
        };
      }
      if (!languageMatches) {
        return {
          conflict_resolved: false,
          reason:
            "the user did not clearly choose which calendar item to move or decline. Ask one short clarifying question.",
        };
      }
      if (conflicts.length > 1 && resolution !== "reschedule_requested") {
        return {
          conflict_resolved: false,
          reason:
            "More than one meeting conflicts, so safely offer the alternative time for the new request instead of changing multiple meetings.",
        };
      }

      setMeetingActionPending(true);
      setVoiceNote("Ara is updating the calendar exactly as requested");
      try {
        const result = await resolveMicrosoftCalendarConflict({
          proposal,
          conflict,
          resolution,
        });
        if (result.proposal) {
          pendingMeetingRef.current = result.proposal;
          setPendingMeeting(result.proposal);
          calendarConflictsRef.current = [];
          setCalendarConflicts([]);
          moveToStage("meetingReady");
          if (result.proposal.privacyChoicePending) {
            return {
              status: "privacy_choice_required",
              conflict_resolved: true,
              proposed_time: result.proposal.displayTime,
              instruction:
                'The alternative is clear. Ask exactly, "Want me to make this private?" Do not ask for booking confirmation yet.',
            };
          }
          return {
            status: "pending_approval",
            conflict_resolved: true,
            proposed_time: result.proposal.displayTime,
            confirmation_needed: true,
            approval_required: true,
            instruction:
              "Say the alternative time once and end with 'How does that sound?' Do not repeat the original request or call this an approval.",
          };
        }

        if (!result.created) {
          throw new Error("The calendar change did not finish.");
        }
        bookedMeetingRef.current = result.created;
        setBookedMeeting(result.created);
        setApprovalMethod("voice");
        calendarConflictsRef.current = [];
        setCalendarConflicts([]);
        moveToStage("meetingBooked");
        const snapshot = await refreshMicrosoft365().catch(() => null);
        if (snapshot) rememberMicrosoftSnapshot(snapshot);
        return {
          conflict_resolved: true,
          meeting_created: true,
          fully_completed: true,
          requested_item: result.created.subject,
          booked_time: result.created.displayTime,
          existing_meeting_action:
            resolution === "move_existing" ? "moved" : "declined",
          existing_meeting: result.changedMeeting,
          existing_meeting_new_time: result.changedMeetingTime,
          instruction: naturalCompletionInstruction,
        };
      } catch (error) {
        return {
          conflict_resolved: false,
          detail:
            error instanceof Error
              ? error.message
              : "The calendar conflict could not be resolved.",
          instruction:
            "Tell the user exactly what the detail says in one sentence, including any partial change. Do not guess beyond it.",
        };
      } finally {
        setMeetingActionPending(false);
      }
    }

    if (call.name === "prepare_meeting_update") {
      if (!microsoftSnapshotRef.current) {
        return {
          status: "not_connected",
          instruction:
            "Tell the user Microsoft 365 needs to be connected before Ara can update an invitation.",
        };
      }
      const meetingReference =
        typeof args.meeting_reference === "string"
          ? args.meeting_reference.trim()
          : "the recent meeting";
      const agendaItems = Array.isArray(args.agenda_items)
        ? args.agenda_items.filter(
            (item): item is string =>
              typeof item === "string" && item.trim().length > 0,
          )
        : [];
      const objective =
        typeof args.objective === "string" ? args.objective.trim() : "";
      const useRecentMeeting = args.use_recent_meeting === true;
      setVoiceNote("Ara is preparing the agenda and checking the invitation");
      try {
        const preparation = await prepareMicrosoftMeetingUpdate({
          eventId: useRecentMeeting
            ? bookedMeetingRef.current?.id
            : undefined,
          meetingReference,
          agendaItems,
          objective,
          enableTranscription: args.enable_transcription === true,
        });
        if (!preparation.proposal) {
          return {
            status:
              preparation.reason === "ambiguous"
                ? "needs_meeting_selection"
                : "could_not_prepare",
            reason: preparation.reason,
            candidates: preparation.candidates,
            instruction:
              preparation.reason === "ambiguous"
                ? "Ask the user one short question to identify which listed meeting they mean."
                : preparation.reason === "not_organizer"
                  ? "Tell the user only the organizer can edit that invitation."
                  : "Tell the user you could not find an organizer-owned meeting that safely matches that description. Ask for the meeting title or date.",
          };
        }
        pendingMeetingUpdateRef.current = preparation.proposal;
        setPendingMeetingUpdate(preparation.proposal);
        setMeetingUpdateResult(null);
        setApprovalMethod(null);
        moveToStage("meetingUpdateReady");
        return {
          status: "pending_approval",
          meeting: preparation.proposal.subject,
          meeting_time: preparation.proposal.displayTime,
          agenda: preparation.proposal.agendaItems,
          objective: preparation.proposal.objective,
          transcription_requested: preparation.proposal.enableTranscription,
          approval_required: true,
          instruction:
            "Summarize the proposed agenda in one compact sentence and say it will update the existing invite. Mention transcription only if requested. End with 'How does that sound?'",
        };
      } catch (error) {
        return {
          status: "could_not_prepare",
          detail:
            error instanceof Error ? error.message : "The update could not be prepared.",
          instruction:
            "Tell the user briefly that the invitation update could not be prepared safely yet.",
        };
      }
    }

    if (call.name === "approve_meeting_update") {
      const confirmation =
        typeof args.confirmation === "string" ? args.confirmation.trim() : "";
      const isExplicitApproval =
        /\b(update|add|send|apply|save)\s+(it|that|this|the agenda|the invite|the invitation)\b/i.test(
          confirmation,
        ) ||
        /\b(that works|that sounds good|looks good|go ahead|let'?s do it|make it happen)\b/i.test(
          confirmation,
        );
      if (
        stageRef.current !== "meetingUpdateReady" ||
        !pendingMeetingUpdateRef.current
      ) {
        return {
          meeting_updated: false,
          reason: "There is no visible invitation update to approve.",
        };
      }
      if (!isExplicitApproval) {
        return {
          meeting_updated: false,
          reason:
            "the user's intent was not clear enough to send an updated invitation. Ask one short confirmation question.",
        };
      }
      setMeetingActionPending(true);
      setVoiceNote("Ara is updating the Outlook and Teams invitation");
      try {
        const proposal = pendingMeetingUpdateRef.current;
        const result = await updateMicrosoftMeeting(proposal);
        setMeetingUpdateResult(result);
        setApprovalMethod("voice");
        moveToStage("meetingUpdated");
        const fullyCompleted =
          !proposal.enableTranscription ||
          result.transcriptionStatus === "enabled";
        return {
          meeting_updated: true,
          agenda_updated: result.agendaUpdated,
          transcription_status: result.transcriptionStatus,
          fully_completed: fullyCompleted,
          instruction: fullyCompleted
            ? naturalCompletionInstruction
            : "Tell the user the agenda is live, but Meeting intelligence needs to be enabled on Today before transcription can be configured.",
        };
      } catch (error) {
        return {
          meeting_updated: false,
          detail:
            error instanceof Error
              ? error.message
              : "Microsoft could not update the invitation.",
          instruction:
            "Tell the user the invitation was not changed and give the brief next step from the error.",
        };
      } finally {
        setMeetingActionPending(false);
      }
    }

    if (call.name === "read_meeting_transcript") {
      const useRecentMeeting = args.use_recent_meeting === true;
      const meetingReference =
        typeof args.meeting_reference === "string"
          ? args.meeting_reference.trim()
          : "the recent meeting";
      setVoiceNote("Ara is checking Teams for the completed transcript");
      const result = await readMicrosoftMeetingTranscript({
        eventId: useRecentMeeting ? bookedMeetingRef.current?.id : undefined,
        meetingReference,
      });
      if (result.status !== "ready" || !result.transcript) {
        const instructions = {
          permission_required:
            "Tell the user to choose Enable meeting intelligence on Today. It requires Microsoft administrator approval.",
          admin_disabled:
            "Tell the user transcript access is approved for the app, but the Microsoft Teams admin setting for Graph transcript access is still off.",
          not_available:
            "Tell the user Teams has not delivered a transcript for that meeting yet. Do not imply the meeting failed.",
          not_found:
            "Ask the user for the meeting title or date because no matching meeting was found.",
          ambiguous:
            "Ask the user one short question to choose between the matching meetings.",
          ready: "",
        } as const;
        return {
          status: result.status,
          candidates: result.candidates,
          instruction: instructions[result.status],
        };
      }
      return {
        status: "transcript_ready",
        meeting_subject: result.transcript.subject,
        transcript_source_id: result.transcript.transcriptId,
        speaker_attribution: result.transcript.speakerAttribution,
        transcript_truncated: result.transcript.truncated,
        transcript: result.transcript.content,
        instruction:
          "Analyze this transcript, then call prepare_meeting_notes with a concise summary, decisions, action items with owners and dates, risks, and open questions. Preserve uncertainty when speaker attribution or ownership is unclear. Do not read the raw transcript aloud.",
      };
    }

    if (call.name === "prepare_meeting_notes") {
      const stringList = (value: unknown) =>
        Array.isArray(value)
          ? value.filter(
              (item): item is string =>
                typeof item === "string" && item.trim().length > 0,
            )
          : [];
      const actionItems = Array.isArray(args.action_items)
        ? args.action_items
            .filter(
              (item): item is Record<string, unknown> =>
                Boolean(item) && typeof item === "object",
            )
            .map((item) => ({
              owner:
                typeof item.owner === "string" ? item.owner.trim() : "Unclear",
              action:
                typeof item.action === "string" ? item.action.trim() : "",
              due: typeof item.due === "string" ? item.due.trim() : "Not stated",
            }))
            .filter((item) => item.action)
        : [];
      const notes: MeetingNotesDraft = {
        subject:
          typeof args.meeting_subject === "string"
            ? args.meeting_subject.trim()
            : "Meeting notes",
        summary: typeof args.summary === "string" ? args.summary.trim() : "",
        decisions: stringList(args.decisions),
        actionItems,
        risks: stringList(args.risks),
        openQuestions: stringList(args.open_questions),
        transcriptSource:
          typeof args.transcript_source_id === "string"
            ? args.transcript_source_id
            : "Microsoft Teams transcript",
      };
      setMeetingNotes(notes);
      await updatePlatform("meeting.record", {
        transcriptSourceId: notes.transcriptSource,
        subject: notes.subject,
        summary: notes.summary,
        decisions: notes.decisions,
        actions: notes.actionItems,
        risks: notes.risks,
        questions: notes.openQuestions,
      });
      await Promise.all(
        notes.actionItems.map((item, index) => {
          const ownership = resolveWorkOwnership(item.owner);
          const parsedDue = Date.parse(item.due);
          return updatePlatform("work.create", {
            sourceKey: `${notes.transcriptSource}:${index}`,
            title: item.action,
            ownerLabel: ownership.ownerLabel,
            ownershipRole: ownership.role,
            ownershipBasis: ownership.basis,
            ownershipConfidence: Math.round(ownership.confidence * 100),
            dueAt: Number.isFinite(parsedDue) ? parsedDue : null,
          });
        }),
      );
      await refreshPlatformWorkspace();
      moveToStage("notesReady");
      return {
        notes_prepared: true,
        meeting_memory_recorded: true,
        decision_count: notes.decisions.length,
        action_count: notes.actionItems.length,
        risk_count: notes.risks.length,
        instruction:
          "Tell the user the notes are ready in Parallel. Give only the most important decision and next action, then stop. Do not claim the notes were saved to SharePoint yet.",
      };
    }

    if (call.name === "propose_delegation") {
      const title = typeof args.title === "string" ? args.title.trim() : "";
      const recipient =
        typeof args.recipient === "string" ? args.recipient.trim() : "";
      if (!title || !recipient) {
        return {
          delegation_proposed: false,
          instruction: "Ask one short question for the missing task or person.",
        };
      }
      const work = await updatePlatform("work.create", {
        sourceKey: `delegation:${crypto.randomUUID()}`,
        title,
        ownerLabel: recipient,
        ownershipRole: "dependency",
        ownershipBasis: "explicit_assignment",
        ownershipConfidence: 100,
      });
      await updatePlatform("delegation.propose", {
        workItemId: work.id,
        toPersonLabel: recipient,
      });
      await refreshPlatformWorkspace();
      return {
        delegation_proposed: true,
        recipient,
        notification_sent: false,
        instruction:
          "Say briefly that the delegation is prepared in Parallel, but no message was sent.",
      };
    }

    if (call.name === "prepare_desktop_action") {
      const application =
        typeof args.application === "string" ? args.application.trim() : "Desktop";
      const desktopAction =
        typeof args.action === "string" ? args.action.trim() : "open";
      const target = typeof args.target === "string" ? args.target.trim() : "";
      const result = await updatePlatform("desktop.prepare", {
        application,
        desktopAction,
        target,
      });
      await refreshPlatformWorkspace();
      return {
        ...result,
        instruction:
          "Explain in one sentence that the action is prepared, but the secure Parallel desktop companion is required before it can run. Never claim the application opened.",
      };
    }

    if (call.name === "prepare_branded_document") {
      const validKinds: BrandedDocumentKind[] = [
        "policy",
        "procedure",
        "brief",
        "meeting_record",
      ];
      const kind =
        typeof args.kind === "string" &&
        validKinds.includes(args.kind as BrandedDocumentKind)
          ? (args.kind as BrandedDocumentKind)
          : "brief";
      const sections = Array.isArray(args.sections)
        ? args.sections
            .filter(
              (section): section is Record<string, unknown> =>
                Boolean(section) && typeof section === "object",
            )
            .map((section) => ({
              heading:
                typeof section.heading === "string" ? section.heading : "",
              body: typeof section.body === "string" ? section.body : "",
              bullets: Array.isArray(section.bullets)
                ? section.bullets.filter(
                    (bullet): bullet is string => typeof bullet === "string",
                  )
                : [],
            }))
        : [];
      const textValue = (value: unknown, fallback = "") =>
        typeof value === "string" ? value.trim() : fallback;
      const draft = buildBrandedDocument({
        kind,
        title: textValue(args.title, "Untitled document"),
        subtitle: textValue(args.subtitle),
        purpose: textValue(args.purpose, "Working draft prepared with Ara."),
        owner: textValue(
          args.owner,
          platformWorkspaceRef.current?.onboarding.full_name ||
            platformWorkspaceRef.current?.onboarding.preferred_name ||
            "Workspace owner",
        ),
        approver: textValue(args.approver, "Pending approval"),
        version: textValue(args.version, "0.1"),
        effectiveDate: textValue(args.effective_date, "Draft"),
        classification: textValue(args.classification, "Internal"),
        sections,
        sourceNote: textValue(args.source_note, "Prepared in Parallel"),
      });
      pendingDocumentRef.current = draft;
      setPendingDocument(draft);
      setPublishedDocument(null);
      setApprovalMethod(null);
      moveToStage("documentReady");
      return {
        status: "pending_approval",
        document_prepared: true,
        title: draft.title,
        kind: draft.kind,
        section_count: draft.sections.length,
        file_name: draft.suggestedFileName,
        approval_required: true,
        instruction:
          "Tell the user the branded draft is ready for review, mention what it is in one short sentence, and end with 'How does that look?' Do not claim it was published.",
      };
    }

    if (call.name === "approve_document_publish") {
      const confirmation =
        typeof args.confirmation === "string" ? args.confirmation.trim() : "";
      const isExplicitApproval =
        /\b(publish|save|upload|post)\s+(it|that|this|the document|the draft)(?:\s+to\s+sharepoint)?\b/i.test(
          confirmation,
        ) ||
        /\b(go ahead and (?:publish|save|upload)|make it live)\b/i.test(
          confirmation,
        );
      const draft = pendingDocumentRef.current;

      if (stageRef.current !== "documentReady" || !draft) {
        return {
          document_published: false,
          reason: "There is no visible document waiting to be published.",
        };
      }
      if (!isExplicitApproval) {
        return {
          document_published: false,
          reason:
            "the user's intent was not clear enough to publish the visible document. Ask one short clarifying question.",
        };
      }
      if (
        microsoftSnapshotRef.current?.capabilities.documentPublishing !==
        "ready"
      ) {
        return {
          status: "permission_required",
          document_published: false,
          reason:
            "SharePoint publishing permission has not been enabled. Tell the user to choose Enable document publishing on Today.",
        };
      }

      setDocumentActionPending(true);
      setVoiceNote("Ara is publishing the approved document to SharePoint");
      try {
        const published = await publishMicrosoftBrandedDocument({
          html: draft.html,
          fileName: draft.suggestedFileName,
        });
        setPublishedDocument(published);
        setApprovalMethod("voice");
        moveToStage("documentPublished");
        return {
          document_published: true,
          fully_completed: true,
          name: published.name,
          sharepoint_site: published.siteName,
          folder: published.folderPath,
          web_url: published.webUrl,
          instruction: naturalCompletionInstruction,
        };
      } catch {
        return {
          status: "could_not_publish",
          document_published: false,
          reason:
            "The document was not published. Suggest refreshing Microsoft 365 and trying once more.",
        };
      } finally {
        setDocumentActionPending(false);
      }
    }

    if (call.name === "prepare_message_for_approval") {
      const proposedMessage =
        typeof args.message === "string" && args.message.trim()
          ? args.message.trim()
          : "Hi Matt — here is the latest version of the IT Core Strategic Plan we discussed.";
      messageRef.current = proposedMessage;
      setMessage(proposedMessage);
      const proposedRecipient =
        typeof args.recipient === "string" && args.recipient.trim()
          ? args.recipient.trim()
          : "Matt Walsh";
      const proposedChannel =
        typeof args.channel === "string" && args.channel.trim()
          ? args.channel.trim()
          : "Microsoft Teams";
      const proposedSubject =
        typeof args.subject === "string" && args.subject.trim()
          ? args.subject.trim()
          : "A quick follow-up";
      messageRecipientRef.current = proposedRecipient;
      messageChannelRef.current = proposedChannel;
      messageSubjectRef.current = proposedSubject;
      setMessageRecipient(proposedRecipient);
      setMessageChannel(proposedChannel);
      setMessageSubject(proposedSubject);
      setApprovalMethod(null);
      moveToStage("ready");
      return {
        status: "pending_approval",
        recipient:
          typeof args.recipient === "string" ? args.recipient : "Matt Walsh",
        channel:
          typeof args.channel === "string" ? args.channel : "Microsoft Teams",
        message: proposedMessage,
        approval_required: true,
        instruction:
          "Give the user a brief natural summary in your own words, end with 'How does that sound?', and let them respond naturally. Do not tell them to say a specific phrase.",
      };
    }

    if (call.name === "approve_pending_action") {
      const confirmation =
        typeof args.confirmation === "string" ? args.confirmation.trim() : "";
      const isExplicitApproval =
        /\b(send|share)\s+(it|that|this|the message|the link)\b/i.test(
          confirmation,
        ) ||
        /\b(go ahead|let'?s do it|make it happen|do it now)\b/i.test(
          confirmation,
        ) ||
        /\bi approve\b/i.test(confirmation);

      if (stageRef.current !== "ready") {
        return {
          approval_recorded: false,
          reason: "There is no visible pending action to approve.",
        };
      }

      if (!isExplicitApproval) {
        return {
          approval_recorded: false,
          reason:
            "The user's intent was not clear enough to proceed. Briefly ask whether they want you to send the message you just summarized; do not give them a required phrase.",
        };
      }

      const currentChannel = messageChannelRef.current;
      const currentRecipient = messageRecipientRef.current;
      const currentSubject = messageSubjectRef.current;
      const currentMessage = messageRef.current;
      const isEmail = /outlook|email/i.test(currentChannel);
      if (isEmail) {
        if (
          microsoftSnapshotRef.current?.capabilities.outboundCommunication !==
          "ready"
        ) {
          return {
            approval_recorded: false,
            status: "permission_required",
            reason: "Outlook sending access has not been enabled.",
            instruction:
              "Tell the user to choose Enable Outlook sending on Today. The draft remains untouched.",
          };
        }
        try {
          const sent = await sendMicrosoftEmail({
            recipient: currentRecipient,
            subject: currentSubject,
            message: currentMessage,
          });
          await updatePlatform("outbound.record", {
            channel: "outlook",
            recipient: sent.recipient.email,
            subject: sent.subject,
            message: currentMessage,
            sent: true,
          });
          setApprovalMethod("voice");
          moveToStage("approved");
          return {
            approval_recorded: true,
            message_sent: true,
            fully_completed: true,
            recipient: sent.recipient.displayName,
            channel: "Outlook",
            instruction: naturalCompletionInstruction,
          };
        } catch (error) {
          return {
            approval_recorded: false,
            message_sent: false,
            reason:
              error instanceof Error
                ? error.message
                : "Outlook could not send the message.",
            instruction:
              "Tell the user the message was not sent and give the returned reason in one sentence.",
          };
        }
      }

      setApprovalMethod("voice");
      moveToStage("approved");
      await updatePlatform("outbound.record", {
        channel: currentChannel,
        recipient: currentRecipient,
        subject: currentSubject,
        message: currentMessage,
        sent: false,
      }).catch(() => undefined);
      return {
        approval_recorded: true,
        approval_method: "voice",
        confirmation,
        execution_status: "not_sent_prototype",
        instruction:
          'Say exactly "Got it." and nothing else. Do not imply that an external message was sent.',
      };
    }

    if (call.name === "remember_user_preference") {
      const validCategories: PreferenceCategory[] = [
        "morning_briefing_time",
        "role_and_responsibilities",
        "current_priorities",
        "communication_style",
        "proactivity",
      ];
      const category =
        typeof args.category === "string" &&
        validCategories.includes(args.category as PreferenceCategory)
          ? (args.category as PreferenceCategory)
          : null;
      const value =
        typeof args.value === "string" ? args.value.trim().slice(0, 240) : "";

      if (!category || !value) {
        return {
          remembered: false,
          reason: "The preference was incomplete.",
        };
      }

      rememberUserPreference(category, value);
      return {
        remembered: true,
        category,
        instruction:
          "Acknowledge the preference naturally without sounding like a database. Continue the conversation.",
      };
    }

    if (call.name === "create_commitment") {
      const title = typeof args.title === "string" ? args.title.trim().slice(0, 300) : "";
      const dueValue = typeof args.due_at === "string" ? Date.parse(args.due_at) : Number.NaN;
      if (!title) {
        return { commitment_created: false, reason: "The commitment was incomplete." };
      }
      try {
        await updatePlatform("commitment.create", {
          title,
          ownerLabel:
            platformWorkspaceRef.current?.onboarding.preferred_name || "You",
          dueAt: Number.isFinite(dueValue) ? dueValue : null,
          source: "ara_voice",
        });
        await refreshPlatformWorkspace();
        return {
          commitment_created: true,
          title,
          due_at: Number.isFinite(dueValue) ? new Date(dueValue).toISOString() : null,
          instruction: "Confirm the commitment in one short, natural sentence.",
        };
      } catch {
        return {
          commitment_created: false,
          reason: "The commitment could not be saved. Ask the user to add it from Today.",
        };
      }
    }

    return {
      error: `Unsupported Ara capability: ${call.name}`,
    };
  };

  const completeFunctionCalls = async (
    calls: RealtimeFunctionCall[],
    channel: RTCDataChannel,
  ) => {
    const silentMemoryTurn = calls.every(
      (call) =>
        call.name === "save_onboarding_identity" ||
        call.name === "save_onboarding_work_context",
    );

    for (const call of calls) {
      toolPendingCountRef.current += 1;
      moveConversationState("TOOL_STARTED");
      setMicrophoneEnabled(false);
      clearVoiceTimers();

      try {
        const result = await runFridayFunction(call);
        const outcome = result as Record<string, unknown>;
        const status = typeof outcome.status === "string" ? outcome.status : "";
        const failed =
          Boolean(outcome.error) ||
          outcome.temporarily_unavailable === true ||
          outcome.meeting_created === false ||
          outcome.meeting_updated === false ||
          outcome.document_published === false ||
          outcome.commitment_created === false ||
          outcome.privacy_updated === false ||
          outcome.conflict_resolved === false ||
          outcome.approval_recorded === false ||
          [
            "not_connected",
            "needs_attendee_details",
            "needs_meeting_selection",
            "could_not_prepare",
            "permission_required",
            "admin_disabled",
            "not_available",
            "not_found",
            "ambiguous",
            "could_not_publish",
          ].includes(status);

        sessionAuditRef.current?.tools.push({
          name: call.name,
          succeeded: !failed,
        });

        if (
          outcome.approval_required === true ||
          status === "pending_approval"
        ) {
          approvalPendingRef.current = true;
        }

        if (call.name === "approve_calendar_meeting") {
          if (outcome.meeting_created === true) {
            approvalPendingRef.current = false;
            autonomousCloseEligibleRef.current =
              outcome.fully_completed !== false;
            recoverableErrorRef.current = false;
          } else {
            autonomousCloseEligibleRef.current = false;
            approvalPendingRef.current = Boolean(pendingMeetingRef.current);
          }
        }

        if (call.name === "resolve_calendar_conflict") {
          if (outcome.meeting_created === true) {
            approvalPendingRef.current = false;
            autonomousCloseEligibleRef.current = true;
            recoverableErrorRef.current = false;
          } else if (status === "pending_approval") {
            approvalPendingRef.current = true;
            autonomousCloseEligibleRef.current = false;
          } else {
            autonomousCloseEligibleRef.current = false;
            approvalPendingRef.current = Boolean(pendingMeetingRef.current);
          }
        }

        if (call.name === "approve_meeting_update") {
          if (outcome.meeting_updated === true) {
            approvalPendingRef.current = false;
            autonomousCloseEligibleRef.current =
              outcome.fully_completed !== false;
            recoverableErrorRef.current = false;
          } else {
            autonomousCloseEligibleRef.current = false;
            approvalPendingRef.current = Boolean(
              pendingMeetingUpdateRef.current,
            );
          }
        }

        if (call.name === "approve_document_publish") {
          if (outcome.document_published === true) {
            approvalPendingRef.current = false;
            autonomousCloseEligibleRef.current = true;
            recoverableErrorRef.current = false;
          } else {
            autonomousCloseEligibleRef.current = false;
            approvalPendingRef.current = Boolean(pendingDocumentRef.current);
          }
        }

        if (
          call.name === "approve_pending_action" &&
          outcome.approval_recorded === true
        ) {
          approvalPendingRef.current = false;
          autonomousCloseEligibleRef.current = outcome.message_sent === true;
        }

        if (
          Boolean(outcome.error) ||
          outcome.temporarily_unavailable === true ||
          status === "could_not_prepare"
        ) {
          recoverableErrorRef.current = true;
          if (sessionAuditRef.current) sessionAuditRef.current.errorCount += 1;
        }

        if (channel.readyState !== "open") return;
        channel.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: call.call_id,
              output: JSON.stringify(result),
            },
          }),
        );
      } catch (error) {
        sessionAuditRef.current?.tools.push({
          name: call.name,
          succeeded: false,
        });
        if (sessionAuditRef.current) sessionAuditRef.current.errorCount += 1;
        recoverableErrorRef.current = true;
        throw error;
      } finally {
        toolPendingCountRef.current = Math.max(
          0,
          toolPendingCountRef.current - 1,
        );
      }
    }

    if (channel.readyState === "open") {
      moveConversationState("TOOL_COMPLETED");
      responseCompletedRef.current = false;
      outputAudioDrainedRef.current = false;
      if (silentMemoryTurn) {
        transcriptRef.current = "";
        setFridayTranscript("");
      }
      channel.send(
        JSON.stringify({
          type: "response.create",
          ...(silentMemoryTurn
            ? {
                response: {
                  input: [],
                  instructions:
                    "Give the one complete user-facing final answer now. Use no commentary phase, no preamble, no narrated thinking, and no mention of memory or tools. Respond directly to the detail the person shared with one specific human observation and at most one naturally earned same-thread question.",
                },
              }
            : {}),
        }),
      );
    }
  };

  const setRealtimeInterruptionMode = (
    channel: RTCDataChannel,
    enabled: boolean,
    eagerness: "low" | "medium" | "high" = enabled ? "medium" : "low",
  ) => {
    if (channel.readyState !== "open") return;
    channel.send(
      JSON.stringify({
        type: "session.update",
        session: {
          type: "realtime",
          reasoning: {
            effort:
              platformWorkspaceRef.current?.onboarding.lifecycle_state === "COMPLETE"
                ? "low"
                : "minimal",
          },
          audio: {
            input: {
              noise_reduction: {
                type: "far_field",
              },
              turn_detection: {
                type: "semantic_vad",
                eagerness,
                create_response: false,
                interrupt_response: enabled,
              },
            },
          },
        },
      }),
    );
  };

  const sendArrivalPerformance = (channel: RTCDataChannel) => {
    if (channel.readyState !== "open") return;

    setRealtimeInterruptionMode(channel, false);
    arrivalScriptActiveRef.current = true;
    responseCompletedRef.current = false;
    outputAudioDrainedRef.current = false;
    transcriptRef.current = "";
    setFridayTranscript("");
    setArrivalCaption("");
    setVoiceState("thinking");
    channel.send(
      JSON.stringify({
        type: "response.create",
        response: {
          input: [],
          instructions: arrivalVoicePerformance,
        },
      }),
    );
  };

  const beginArrivalListening = async () => {
    if (streamRef.current?.getAudioTracks().some((track) => track.readyState === "live")) {
      setMicrophoneEnabled(true);
      setArrivalNeedsRecovery(false);
      setArrivalRecoveryKind(null);
      setVoiceState("listening");
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser needs microphone support to continue.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      const track = stream.getAudioTracks()[0];
      if (!track || !audioSenderRef.current) {
        stream.getTracks().forEach((item) => item.stop());
        throw new Error("The microphone connection is not ready yet.");
      }
      await audioSenderRef.current.replaceTrack(track);
      streamRef.current = stream;
      startLevelVisualizer(stream, "human", inputContextRef, inputAnimationRef);
      setMicrophoneEnabled(true);
      setArrivalNeedsRecovery(false);
      setArrivalRecoveryKind(null);
      setVoiceState("listening");
      setVoiceNote("Ara is listening");
    } catch (error) {
      const note =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Microphone access is needed when you’re ready to answer."
          : error instanceof Error
            ? error.message
            : "The microphone could not start.";
      setArrivalRecoveryKind("microphone");
      setArrivalNeedsRecovery(true);
      setVoiceState("idle");
      setVoiceNote(note);
    }
  };

  const startPreparedOpening = () => {
    const channel = channelRef.current;
    if (
      !channel ||
      channel.readyState !== "open" ||
      !arrivalChannelReadyRef.current ||
      !arrivalAudioReadyRef.current ||
      !arrivalVisualReadyRef.current ||
      arrivalScriptStartedRef.current
    ) {
      return;
    }

    arrivalScriptStartedRef.current = true;
    const opening =
      initialResponseRef.current ??
      buildFirstMeetingInstruction(
        platformWorkspaceRef.current?.onboarding,
        Boolean(microsoftSnapshotRef.current),
      );
    initialResponseRef.current = null;

    if (opening === demoIntroductionInstruction) {
      sendArrivalPerformance(channel);
    } else {
      setRealtimeInterruptionMode(channel, true, "medium");
      const knownPreferences = Object.entries(userProfile)
        .filter(([, value]) => value.trim())
        .map(([category, value]) => `${category}: ${value}`)
        .join("; ");
      channel.send(
        JSON.stringify({
          type: "response.create",
          response: {
            input: [],
            instructions:
              knownPreferences
                ? `${opening} Known preferences to respect: ${knownPreferences}.`
                : opening,
          },
        }),
      );
    }
    if (firstVisit) setFirstVisit(false);
  };

  const continueArrival = async () => {
    if (arrivalRecoveryKind === "autoplay" && remoteAudioRef.current) {
      try {
        await remoteAudioRef.current.play();
        arrivalAudioReadyRef.current = true;
        setArrivalNeedsRecovery(false);
        setArrivalRecoveryKind(null);
        startPreparedOpening();
      } catch {
        setVoiceNote("Tap anywhere to meet Ara.");
      }
      return;
    }

    if (arrivalRecoveryKind === "microphone" && peerRef.current) {
      await beginArrivalListening();
      return;
    }

    if (
      arrivalRecoveryKind === "connection" &&
      peerRef.current &&
      channelRef.current?.readyState === "open"
    ) {
      setArrivalNeedsRecovery(false);
      setArrivalRecoveryKind(null);
      sendArrivalPerformance(channelRef.current);
      return;
    }

    void startVoiceSession(demoIntroductionInstruction);
  };

  const handleRealtimeEvent = (
    realtimeEvent: MessageEvent<string>,
    channel: RTCDataChannel,
  ) => {
    let event: RealtimeEvent;
    try {
      event = JSON.parse(realtimeEvent.data) as RealtimeEvent;
    } catch {
      return;
    }

    switch (event.type) {
      case "input_audio_buffer.speech_started": {
        userTurnAwaitingResponseRef.current = true;
        setHumanAudioActive(true);
        setHumanBarAwake(true);
        if (conversationStateRef.current === "RESPONDING") {
          userInterruptedResponseRef.current = true;
        }
        if (idleTimerRef.current !== null) {
          window.clearTimeout(idleTimerRef.current);
          idleTimerRef.current = null;
        }
        if (
          closingTimerRef.current !== null ||
          conversationStateRef.current === "WRAP_UP"
        ) {
          if (closingTimerRef.current !== null) {
            window.clearTimeout(closingTimerRef.current);
            closingTimerRef.current = null;
          }
          autonomousCloseEligibleRef.current = false;
          moveConversationState("INTERRUPT_WRAP_UP");
        } else {
          moveConversationState("USER_SPEECH_STARTED");
        }
        transcriptRef.current = "";
        setArrivalCaption("");
        unresolvedQuestionRef.current = false;
        setFridayTranscript("");
        setVoiceState("listening");
        setVoiceNote("I’m listening — take your time");
        break;
      }
      case "input_audio_buffer.speech_stopped":
        setHumanAudioActive(false);
        if (fastFirstReplyRef.current) {
          fastFirstReplyRef.current = false;
          setRealtimeInterruptionMode(channel, true, "medium");
        }
        moveConversationState("USER_SPEECH_STOPPED");
        setMicrophoneEnabled(true);
        setVoiceState("thinking");
        setVoiceNote("Ara is thinking");
        break;
      case "input_audio_buffer.committed":
        if (
          !userTurnAwaitingResponseRef.current ||
          arrivalScriptActiveRef.current ||
          channel.readyState !== "open"
        ) {
          break;
        }
        userTurnAwaitingResponseRef.current = false;
        responseCompletedRef.current = false;
        outputAudioDrainedRef.current = false;
        channel.send(
          JSON.stringify({
            type: "response.create",
            response: {
              input: [],
              instructions: buildLiveConversationMission(
                platformWorkspaceRef.current?.onboarding,
                Boolean(microsoftSnapshotRef.current),
              ),
            },
          }),
        );
        break;
      case "response.created":
        clearVoiceTimers();
        moveConversationState("RESPONSE_STARTED");
        responseCompletedRef.current = false;
        outputAudioDrainedRef.current = false;
        setMicrophoneEnabled(true);
        setVoiceState("thinking");
        setVoiceNote("Ara is thinking");
        break;
      case "output_audio_buffer.started":
      case "response.output_audio.delta":
        setAraAudioActive(true);
        setAraBarAwake(true);
        void outputContextRef.current?.resume().catch(() => undefined);
        setMicrophoneEnabled(true);
        setVoiceState("speaking");
        if (arrivalScriptActiveRef.current) {
          setMicrophoneEnabled(false);
          setArrivalCaption("");
        }
        setVoiceNote("Ara is responding — jump in anytime");
        break;
      case "response.output_audio_transcript.delta":
        transcriptRef.current += event.delta ?? "";
        setFridayTranscript(transcriptRef.current);
        break;
      case "response.output_audio_transcript.done":
        if (event.transcript) {
          transcriptRef.current = event.transcript;
          setFridayTranscript(event.transcript);
        }
        unresolvedQuestionRef.current = responseEndsWithQuestion(
          transcriptRef.current,
        );
        break;
      case "response.done": {
        if (event.response?.usage && sessionAuditRef.current) {
          sessionAuditRef.current.usage = addRealtimeUsage(
            sessionAuditRef.current.usage,
            normalizeRealtimeUsage(event.response.usage),
          );
        }

        if (
          event.response?.status &&
          event.response.status !== "completed"
        ) {
          if (arrivalScriptActiveRef.current) {
            arrivalScriptActiveRef.current = false;
            setArrivalRecoveryKind("connection");
            setArrivalNeedsRecovery(true);
            setVoiceState("idle");
            setVoiceNote("Ara’s voice was interrupted.");
            return;
          }
          if (
            userInterruptedResponseRef.current &&
            event.response.status === "cancelled"
          ) {
            userInterruptedResponseRef.current = false;
            recoverableErrorRef.current = false;
            setMicrophoneEnabled(true);
            setVoiceState("listening");
            setVoiceNote("I’m listening — go ahead");
            return;
          }
          recoverableErrorRef.current = true;
          autonomousCloseEligibleRef.current = false;
          if (sessionAuditRef.current) sessionAuditRef.current.errorCount += 1;
          moveConversationState("RECOVERABLE_ERROR");
          setMicrophoneEnabled(true);
          setVoiceState("listening");
          setVoiceNote("Ara's response was interrupted. Please try again.");
          return;
        }

        if (arrivalScriptActiveRef.current) {
          responseCompletedRef.current = true;
          return;
        }

        const functionCalls = (event.response?.output ?? []).filter(
          (item): item is RealtimeFunctionCall =>
            item.type === "function_call" &&
            "name" in item &&
            "call_id" in item &&
            "arguments" in item,
        );

        if (functionCalls.length > 0) {
          void completeFunctionCalls(functionCalls, channel).catch((error) => {
            console.error("Ara capability failed.", error);
            setMicrophoneEnabled(true);
            setVoiceState("listening");
            setVoiceNote("Ara couldn't complete that step. Please try again.");
          });
          return;
        }

        responseCompletedRef.current = true;
        unresolvedQuestionRef.current = responseEndsWithQuestion(
          transcriptRef.current,
        );

        if (
          canBeginAutonomousWrapUp({
            successfulAction: autonomousCloseEligibleRef.current,
            toolPendingCount: toolPendingCountRef.current,
            approvalPending: approvalPendingRef.current,
            responseCompleted: responseCompletedRef.current,
            unresolvedQuestion: unresolvedQuestionRef.current,
            recoverableError: recoverableErrorRef.current,
          })
        ) {
          moveConversationState("BEGIN_WRAP_UP");
          setVoiceState("wrapping");
          setVoiceNote("Ara is finishing up");
          audioDrainGuardTimerRef.current = window.setTimeout(() => {
            audioDrainGuardTimerRef.current = null;
            if (conversationStateRef.current !== "WRAP_UP") return;
            outputAudioDrainedRef.current = true;
            scheduleAutonomousDisconnect();
          }, conversationPolicy.maxAudioDrainWaitMs);
        } else {
          setVoiceNote(
            approvalPendingRef.current
              ? "Your call — Ara is waiting for your decision"
              : "Ara is ready when you are",
          );
        }
        break;
      }
      case "output_audio_buffer.stopped":
        setAraAudioActive(false);
        if (arrivalScriptActiveRef.current) {
          outputAudioDrainedRef.current = true;
          arrivalScriptActiveRef.current = false;
          moveConversationState("AUDIO_DRAINED");
          setVoiceState("synced");
          understandingTimerRef.current = window.setTimeout(() => {
            understandingTimerRef.current = null;
            if (channelRef.current) {
              fastFirstReplyRef.current = true;
              setRealtimeInterruptionMode(channelRef.current, true, "high");
            }
            void beginArrivalListening();
          }, 240);
          break;
        }
        if (observationWrapUpRef.current) {
          setObservationClosing(true);
        }
        if (audioDrainGuardTimerRef.current !== null) {
          window.clearTimeout(audioDrainGuardTimerRef.current);
          audioDrainGuardTimerRef.current = null;
        }
        outputAudioDrainedRef.current = true;
        if (conversationStateRef.current === "WRAP_UP") {
          scheduleAutonomousDisconnect();
          break;
        }

        if (approvalPendingRef.current) {
          moveConversationState("APPROVAL_REQUIRED");
        } else {
          moveConversationState("AUDIO_DRAINED");
        }
        setMicrophoneEnabled(true);
        setVoiceState("synced");
        setVoiceNote(
          approvalPendingRef.current
            ? "How does that sound?"
            : "Speak naturally — Ara is listening",
        );
        understandingTimerRef.current = window.setTimeout(() => {
          understandingTimerRef.current = null;
          if (streamRef.current) {
            setVoiceState("listening");
            scheduleIdleDisconnect();
          } else {
            void beginArrivalListening();
          }
        }, 360);
        break;
      case "error":
        setAraAudioActive(false);
        setHumanAudioActive(false);
        observationWrapUpRef.current = false;
        setObservationClosing(false);
        console.error("Realtime voice event error.", event.error);
        recoverableErrorRef.current = true;
        autonomousCloseEligibleRef.current = false;
        if (sessionAuditRef.current) sessionAuditRef.current.errorCount += 1;
        moveConversationState("RECOVERABLE_ERROR");
        setMicrophoneEnabled(true);
        setVoiceNote("Ara missed that. Please try saying it again.");
        setVoiceState("listening");
        break;
    }
  };

  const startVoiceSession = async (
    openingInstruction?: string,
  ) => {
    if (peerRef.current || voiceState === "connecting") return;

    setArrivalNeedsRecovery(false);
    setArrivalRecoveryKind(null);
    clearVoiceTimers();
    arrivalScriptActiveRef.current = false;
    arrivalScriptStartedRef.current = false;
    arrivalChannelReadyRef.current = false;
    arrivalAudioReadyRef.current = false;
    fastFirstReplyRef.current = false;
    userTurnAwaitingResponseRef.current = false;
    observationWrapUpRef.current = false;
    setObservationClosing(false);
    toolPendingCountRef.current = 0;
    approvalPendingRef.current = false;
    autonomousCloseEligibleRef.current = false;
    responseCompletedRef.current = false;
    outputAudioDrainedRef.current = false;
    unresolvedQuestionRef.current = false;
    recoverableErrorRef.current = false;
    userInterruptedResponseRef.current = false;
    sessionAuditRef.current = startConversationSession(crypto.randomUUID());
    moveConversationState("START_CONNECTING");
    initialResponseRef.current = openingInstruction ?? null;
    setVoiceState("connecting");
    setVoiceNote("Opening a private voice connection");
    setFridayTranscript("");

    try {
      const peer = new RTCPeerConnection();
      peerRef.current = peer;
      const audioTransceiver = peer.addTransceiver("audio", {
        direction: "sendrecv",
      });
      audioSenderRef.current = audioTransceiver.sender;

      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.setAttribute("playsinline", "true");
      remoteAudioRef.current = audio;

      peer.ontrack = (event) => {
        const remoteStream = event.streams[0];
        audio.srcObject = remoteStream;
        void audio.play()
          .then(() => {
            void outputContextRef.current?.resume().catch(() => undefined);
            arrivalAudioReadyRef.current = true;
            setArrivalNeedsRecovery(false);
            setArrivalRecoveryKind(null);
            startPreparedOpening();
          })
          .catch(() => {
            arrivalAudioReadyRef.current = false;
            setArrivalRecoveryKind("autoplay");
            setArrivalNeedsRecovery(true);
            setVoiceState("idle");
            setVoiceNote("Tap anywhere to meet Ara.");
          });
        startLevelVisualizer(
          remoteStream,
          "ara",
          outputContextRef,
          outputAnimationRef,
        );
      };

      peer.onconnectionstatechange = () => {
        if (["failed", "disconnected", "closed"].includes(peer.connectionState)) {
          setArrivalRecoveryKind("connection");
          setArrivalNeedsRecovery(true);
          stopVoiceSession(
            "The voice connection ended.",
            "connection_ended",
          );
        }
      };

      const channel = peer.createDataChannel("oai-events");
      channelRef.current = channel;
      channel.onmessage = (event) => handleRealtimeEvent(event, channel);
      channel.onopen = () => {
        moveConversationState("CONNECTION_OPEN");
        setVoiceConnected(true);
        setVoiceState("idle");
        setVoiceNote("Ara is present");
        arrivalChannelReadyRef.current = true;
        startPreparedOpening();
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const sessionResponse = await fetch("/api/realtime/", {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (!sessionResponse.ok) {
        const failure = (await sessionResponse.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(
          failure?.error ?? "Ara couldn't open a live voice session.",
        );
      }

      await peer.setRemoteDescription({
        type: "answer",
        sdp: await sessionResponse.text(),
      });
    } catch (error) {
      const note =
        error instanceof Error
            ? error.message
            : "Ara couldn't start a voice conversation. Please try again.";
      setArrivalRecoveryKind("connection");
      setArrivalNeedsRecovery(true);
      stopVoiceSession(note, "start_failed");
    }
  };

  const toggleVoiceSession = () => {
    if (voiceConnected || peerRef.current) {
      stopVoiceSession("Tap to start a new conversation", "manual");
    } else {
      void startVoiceSession();
    }
  };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const descentTimer = window.setTimeout(
      () => setArrivalPhase("descending"),
      prefersReducedMotion ? 350 : 1600,
    );
    const meetingTimer = window.setTimeout(
      () => setArrivalPhase("meeting"),
      prefersReducedMotion ? 700 : 6770,
    );
    const revealTimer = window.setTimeout(
      () => setArrivalPhase("revealing"),
      prefersReducedMotion ? 1050 : 7470,
    );
    const rotateTimer = window.setTimeout(
      () => setArrivalPhase("rotating"),
      prefersReducedMotion ? 1450 : 10770,
    );
    const illuminateTimer = window.setTimeout(() => {
      setArrivalPhase("illuminating");
      if (prefersReducedMotion) {
        arrivalVisualReadyRef.current = true;
        startPreparedOpening();
      }
    }, prefersReducedMotion ? 1850 : 13720);
    const breathTimer = prefersReducedMotion
      ? null
      : window.setTimeout(() => {
          setArrivalPhase("breathing");
          arrivalVisualReadyRef.current = true;
          startPreparedOpening();
        }, 15020);
    const settleTimer = window.setTimeout(
      () => {
        if (!arrivalVisualReadyRef.current) {
          arrivalVisualReadyRef.current = true;
          startPreparedOpening();
        }
        setArrivalPhase("settled");
        setShowStartup(false);
      },
      prefersReducedMotion ? 2150 : 16020,
    );

    const hydrateTimer = window.setTimeout(() => {
      setFirstVisit(true);
      setActiveNav("ara");
      setTodayLabel(
        new Intl.DateTimeFormat(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
          .format(new Date())
          .toUpperCase(),
      );
      try {
        const savedProfile = JSON.parse(
          window.localStorage.getItem(PROFILE_STORAGE_KEY) ?? "{}",
        ) as Partial<UserProfile>;
        setUserProfile({ ...emptyProfile, ...savedProfile });
      } catch {
        setUserProfile(emptyProfile);
      }
      try {
        const savedSessions = JSON.parse(
          window.localStorage.getItem(SESSION_AUDIT_STORAGE_KEY) ?? "[]",
        ) as unknown;
        if (Array.isArray(savedSessions) && savedSessions[0]) {
          setLastSession(savedSessions[0] as ConversationSessionRecord);
        }
      } catch {
        setLastSession(null);
      }
      try {
        const queryCaptions = new URLSearchParams(window.location.search).get("captions");
        setCaptionsEnabled(
          queryCaptions === "1" ||
          window.localStorage.getItem(CAPTIONS_STORAGE_KEY) === "on",
        );
      } catch {
        setCaptionsEnabled(false);
      }
      void refreshPlatformWorkspace();
    }, 0);

    return () => {
      window.clearTimeout(descentTimer);
      window.clearTimeout(meetingTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(rotateTimer);
      window.clearTimeout(illuminateTimer);
      if (breathTimer !== null) window.clearTimeout(breathTimer);
      window.clearTimeout(settleTimer);
      window.clearTimeout(hydrateTimer);
    };
    // Hydration and the release-aware workspace load run once per document load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleAccessibilityShortcut = (event: KeyboardEvent) => {
      if (!event.altKey || event.key.toLowerCase() !== "c") return;
      event.preventDefault();
      setCaptionsEnabled((enabled) => {
        const next = !enabled;
        try {
          window.localStorage.setItem(CAPTIONS_STORAGE_KEY, next ? "on" : "off");
        } catch {
          // Captions still work for this session when storage is unavailable.
        }
        return next;
      });
    };
    window.addEventListener("keydown", handleAccessibilityShortcut);
    return () => window.removeEventListener("keydown", handleAccessibilityShortcut);
  }, []);

  useEffect(() => {
    if (arrivalNeedsRecovery) recoveryButtonRef.current?.focus();
  }, [arrivalNeedsRecovery]);

  useEffect(() => {
    if (!microsoftSnapshot) return;
    const items = buildReadOnlyAttentionItems(microsoftSnapshot);
    void updatePlatform("attention.sync", { items })
      .then(() => refreshPlatformWorkspace())
      .catch(() => setPlatformNote("Attention monitoring will retry on refresh"));
    // Sync only when the connected Microsoft snapshot itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microsoftSnapshot]);

  useEffect(() => {
    if (!platformReady) return;
    let active = true;
    const restoreTimeout = new Promise<never>((_, reject) => {
      window.setTimeout(
        () => reject(new Error("Microsoft 365 restore timed out.")),
        6500,
      );
    });

    void Promise.race([restoreMicrosoft365(), restoreTimeout])
      .then(async (snapshot) => {
        if (!active) return;
        if (snapshot) {
          rememberMicrosoftSnapshot(snapshot);
          setMicrosoftStatus("connected");
          setMicrosoftNote(noteForMicrosoftSnapshot(snapshot));
          await syncMicrosoftProfile(snapshot).catch(() => undefined);
          startFirstDayResearch();
        } else {
          setMicrosoftStatus("disconnected");
          setMicrosoftNote("Ready when you are");
        }
      })
      .catch(() => {
        if (!active) return;
        setMicrosoftStatus("disconnected");
        setMicrosoftNote("Ready to reconnect securely");
      });

    return () => {
      active = false;
    };
    // Restore Microsoft once, after the release-aware workspace reset has settled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformReady]);

  useEffect(() => {
    if (
      !platformReady ||
      arrivalPhase !== "revealing" ||
      autoArrivalAttemptedRef.current ||
      voiceConnected ||
      peerRef.current
    ) {
      return;
    }
    const arrivalTimer = window.setTimeout(() => {
      autoArrivalAttemptedRef.current = true;
      setArrivalAttempted(true);
      void startVoiceSession(demoIntroductionInstruction);
    }, 220);
    return () => window.clearTimeout(arrivalTimer);
    // Prepare voice while the brand reveal is still moving; speech waits for visual settlement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrivalPhase, platformReady]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      channelRef.current?.close();
      peerRef.current?.close();
      if (inputAnimationRef.current) {
        window.cancelAnimationFrame(inputAnimationRef.current);
      }
      if (outputAnimationRef.current) {
        window.cancelAnimationFrame(outputAnimationRef.current);
      }
      if (closingTimerRef.current !== null) {
        window.clearTimeout(closingTimerRef.current);
      }
      if (audioDrainGuardTimerRef.current !== null) {
        window.clearTimeout(audioDrainGuardTimerRef.current);
      }
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
      if (understandingTimerRef.current !== null) {
        window.clearTimeout(understandingTimerRef.current);
      }
      void inputContextRef.current?.close();
      void outputContextRef.current?.close();
    };
  }, []);

  const demonstrateVoiceFallback = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceNote("This browser does not support live voice conversations");
      setVoiceState("listening");
      window.setTimeout(() => setVoiceState("idle"), 1200);
      return;
    }
    toggleVoiceSession();
  };

  const voiceLabel = {
    idle: "Ara is ready",
    connecting: "Connecting privately",
    listening: "I’m listening",
    thinking: "Ara is thinking",
    speaking: "Ara is responding",
    synced: "In sync",
    wrapping: "Wrapping up",
  }[voiceState];
  const conversationStateLabel: Record<ConversationLifecycleState, string> = {
    IDLE: "Ready",
    CONNECTING: "Opening",
    GREETING: "Greeting",
    LISTENING: "Listening",
    THINKING: "Thinking",
    TOOL_PENDING: "Working",
    RESPONDING: "Responding",
    AWAITING_CONFIRMATION: "Waiting for you",
    WRAP_UP: "Wrapping up",
    DISCONNECTING: "Closing",
    CLOSED: "Closed cleanly",
  };
  const sessionCloseLabel = lastSession
    ? {
        completed_action: "completed cleanly",
        idle_timeout: "closed after a quiet moment",
        manual: "ended by you",
        connection_ended: "connection ended",
        start_failed: "couldn’t start",
      }[lastSession.closeReason]
    : "";
  const firstMomentState =
    arrivalPhase !== "settled"
      ? "arriving"
      : araAudioActive
        ? "speaking"
        : humanAudioActive
          ? "listening"
          : voiceState === "listening"
        ? "listening"
        : voiceState === "connecting" || voiceState === "thinking"
          ? "thinking"
          : voiceState === "speaking"
            ? "speaking"
            : voiceState === "synced"
              ? "understanding"
              : voiceState === "wrapping"
                ? "complete"
                : "present";
  const visibleCaption = arrivalCaption || fridayTranscript;
  const toggleCaptions = () => {
    setCaptionsEnabled((enabled) => {
      const next = !enabled;
      try {
        window.localStorage.setItem(CAPTIONS_STORAGE_KEY, next ? "on" : "off");
      } catch {
        // Keep the preference for this session when storage is unavailable.
      }
      return next;
    });
  };

  const approveWithButton = async () => {
    const isEmail = /outlook|email/i.test(messageChannel);
    if (isEmail) {
      if (
        microsoftSnapshotRef.current?.capabilities.outboundCommunication !==
        "ready"
      ) {
        setVoiceNote("Enable Outlook sending on Today first");
        return;
      }
      try {
        const sent = await sendMicrosoftEmail({
          recipient: messageRecipient,
          subject: messageSubject,
          message,
        });
        await updatePlatform("outbound.record", {
          channel: "outlook",
          recipient: sent.recipient.email,
          subject: sent.subject,
          message,
          sent: true,
        });
        autonomousCloseEligibleRef.current = true;
      } catch (error) {
        setVoiceNote(
          error instanceof Error ? error.message : "Outlook could not send that message.",
        );
        return;
      }
    } else {
      await updatePlatform("outbound.record", {
        channel: messageChannel,
        recipient: messageRecipient,
        subject: messageSubject,
        message,
        sent: false,
      }).catch(() => undefined);
    }
    setApprovalMethod("button");
    moveToStage("approved");
    if (channelRef.current?.readyState === "open") {
      setMicrophoneEnabled(false);
      channelRef.current.send(
        JSON.stringify({
          type: "response.create",
          response: {
            input: [],
            instructions: isEmail
              ? naturalCompletionInstruction
              : 'Say exactly "Got it." and nothing else. Do not imply that an external message was sent.',
          },
        }),
      );
    }
  };

  const approveMeetingWithButton = async () => {
    if (
      !pendingMeetingRef.current ||
      pendingMeetingRef.current.privacyChoicePending ||
      meetingActionPending
    ) return;

    setMeetingActionPending(true);
    setVoiceNote("Ara is adding it to your calendar");
    try {
      const result = await createMicrosoftMeeting(pendingMeetingRef.current);
      bookedMeetingRef.current = result;
      setBookedMeeting(result);
      setApprovalMethod("button");
      moveToStage("meetingBooked");
      approvalPendingRef.current = false;
      const fullyCompleted =
        !pendingMeetingRef.current.enableTranscription ||
        result.transcriptionStatus === "enabled";
      autonomousCloseEligibleRef.current = fullyCompleted;
      recoverableErrorRef.current = false;
      sessionAuditRef.current?.tools.push({
        name: "approve_calendar_meeting",
        succeeded: true,
      });
      setVoiceNote(
        fullyCompleted
          ? `${result.displayTime} · on your calendar`
          : "The meeting is booked · meeting intelligence still needs access",
      );
      if (channelRef.current?.readyState === "open") {
        setMicrophoneEnabled(false);
        channelRef.current.send(
          JSON.stringify({
            type: "response.create",
            response: {
              input: [],
            instructions: fullyCompleted
              ? naturalCompletionInstruction
              : "Tell the user the meeting and agenda are live, but they need to enable Meeting intelligence on Today before Ara can configure transcription.",
            },
          }),
        );
      }
      const snapshot = await refreshMicrosoft365().catch(() => null);
      if (snapshot) rememberMicrosoftSnapshot(snapshot);
    } catch {
      autonomousCloseEligibleRef.current = false;
      recoverableErrorRef.current = true;
      sessionAuditRef.current?.tools.push({
        name: "approve_calendar_meeting",
        succeeded: false,
      });
      if (sessionAuditRef.current) sessionAuditRef.current.errorCount += 1;
      setVoiceNote(
        "The meeting was not created. Reconnect Microsoft 365 and try again.",
      );
    } finally {
      setMeetingActionPending(false);
    }
  };

  const setMeetingPrivacyWithButton = (isPrivate: boolean) => {
    const proposal = pendingMeetingRef.current;
    if (!proposal) return;
    const updated = {
      ...proposal,
      isPrivate,
      privacyChoicePending: false,
    };
    pendingMeetingRef.current = updated;
    setPendingMeeting(updated);
    if (calendarConflictsRef.current.length > 0) {
      moveToStage("meetingConflict");
      setVoiceNote(
        `${isPrivate ? "Private" : "Normal visibility"} · review the calendar conflict`,
      );
      return;
    }
    setVoiceNote(
      isPrivate
        ? `${updated.displayTime} · marked private · how does that sound?`
        : `${updated.displayTime} · normal visibility · how does that sound?`,
    );
  };

  const resolveCalendarConflictWithButton = async (
    resolution:
      | "reschedule_requested"
      | "move_existing"
      | "decline_existing",
  ) => {
    const proposal = pendingMeetingRef.current;
    const conflict = calendarConflictsRef.current[0];
    if (!proposal || !conflict || meetingActionPending) return;
    setMeetingActionPending(true);
    setVoiceNote("Ara is updating the calendar exactly as requested");
    try {
      const result = await resolveMicrosoftCalendarConflict({
        proposal,
        conflict,
        resolution,
      });
      if (result.proposal) {
        pendingMeetingRef.current = result.proposal;
        setPendingMeeting(result.proposal);
        calendarConflictsRef.current = [];
        setCalendarConflicts([]);
        moveToStage("meetingReady");
        setVoiceNote(`${result.proposal.displayTime} is open · how does that sound?`);
        return;
      }
      if (!result.created) throw new Error("The calendar change did not finish.");
      bookedMeetingRef.current = result.created;
      setBookedMeeting(result.created);
      setApprovalMethod("button");
      calendarConflictsRef.current = [];
      setCalendarConflicts([]);
      moveToStage("meetingBooked");
      approvalPendingRef.current = false;
      autonomousCloseEligibleRef.current = true;
      recoverableErrorRef.current = false;
      setVoiceNote(`${result.created.displayTime} · on your calendar`);
      if (channelRef.current?.readyState === "open") {
        setMicrophoneEnabled(false);
        channelRef.current.send(
          JSON.stringify({
            type: "response.create",
            response: {
              input: [],
              instructions: naturalCompletionInstruction,
            },
          }),
        );
      }
      const snapshot = await refreshMicrosoft365().catch(() => null);
      if (snapshot) rememberMicrosoftSnapshot(snapshot);
    } catch (error) {
      autonomousCloseEligibleRef.current = false;
      recoverableErrorRef.current = true;
      setVoiceNote(
        error instanceof Error
          ? error.message
          : "The calendar change did not finish. Check the calendar before retrying.",
      );
    } finally {
      setMeetingActionPending(false);
    }
  };

  const approveMeetingUpdateWithButton = async () => {
    if (!pendingMeetingUpdateRef.current || meetingActionPending) return;
    setMeetingActionPending(true);
    setVoiceNote("Ara is updating the Outlook and Teams invitation");
    try {
      const proposal = pendingMeetingUpdateRef.current;
      const result = await updateMicrosoftMeeting(proposal);
      setMeetingUpdateResult(result);
      setApprovalMethod("button");
      moveToStage("meetingUpdated");
      approvalPendingRef.current = false;
      const fullyCompleted =
        !proposal.enableTranscription ||
        result.transcriptionStatus === "enabled";
      autonomousCloseEligibleRef.current = fullyCompleted;
      recoverableErrorRef.current = false;
      sessionAuditRef.current?.tools.push({
        name: "approve_meeting_update",
        succeeded: true,
      });
      setVoiceNote(
        fullyCompleted
          ? "The agenda is live on the invitation"
          : "The agenda is live · meeting intelligence still needs approval",
      );
      if (channelRef.current?.readyState === "open") {
        setMicrophoneEnabled(false);
        channelRef.current.send(
          JSON.stringify({
            type: "response.create",
            response: {
              input: [],
              instructions: fullyCompleted
                ? naturalCompletionInstruction
                : "Tell the user the agenda is live, but they need to enable Meeting intelligence on Today before Ara can configure transcription.",
            },
          }),
        );
      }
    } catch {
      autonomousCloseEligibleRef.current = false;
      recoverableErrorRef.current = true;
      sessionAuditRef.current?.tools.push({
        name: "approve_meeting_update",
        succeeded: false,
      });
      if (sessionAuditRef.current) sessionAuditRef.current.errorCount += 1;
      setVoiceNote("The invitation was not changed. Please try again.");
    } finally {
      setMeetingActionPending(false);
    }
  };

  const approveDocumentPublishWithButton = async () => {
    const draft = pendingDocumentRef.current;
    if (!draft || documentActionPending) return;
    if (
      microsoftSnapshotRef.current?.capabilities.documentPublishing !==
      "ready"
    ) {
      setVoiceNote(
        "Enable document publishing on Today before Ara saves this to SharePoint",
      );
      return;
    }

    setDocumentActionPending(true);
    setVoiceNote("Ara is publishing the approved document to SharePoint");
    try {
      const published = await publishMicrosoftBrandedDocument({
        html: draft.html,
        fileName: draft.suggestedFileName,
      });
      setPublishedDocument(published);
      setApprovalMethod("button");
      moveToStage("documentPublished");
      approvalPendingRef.current = false;
      autonomousCloseEligibleRef.current = true;
      recoverableErrorRef.current = false;
      sessionAuditRef.current?.tools.push({
        name: "approve_document_publish",
        succeeded: true,
      });
      setVoiceNote("The approved document is live in SharePoint");
      if (channelRef.current?.readyState === "open") {
        setMicrophoneEnabled(false);
        channelRef.current.send(
          JSON.stringify({
            type: "response.create",
            response: {
              input: [],
              instructions: naturalCompletionInstruction,
            },
          }),
        );
      }
    } catch {
      autonomousCloseEligibleRef.current = false;
      recoverableErrorRef.current = true;
      sessionAuditRef.current?.tools.push({
        name: "approve_document_publish",
        succeeded: false,
      });
      if (sessionAuditRef.current) sessionAuditRef.current.errorCount += 1;
      setVoiceNote("The document was not published. Refresh Microsoft 365 and try again.");
    } finally {
      setDocumentActionPending(false);
    }
  };

  const startAnotherRequest = () => {
    pendingMeetingRef.current = null;
    calendarConflictsRef.current = [];
    bookedMeetingRef.current = null;
    pendingMeetingUpdateRef.current = null;
    pendingDocumentRef.current = null;
    setPendingMeeting(null);
    setCalendarConflicts([]);
    setBookedMeeting(null);
    setPendingMeetingUpdate(null);
    setMeetingUpdateResult(null);
    setMeetingNotes(null);
    setPendingDocument(null);
    setPublishedDocument(null);
    calendarCanvasRef.current = null;
    setCalendarCanvas(null);
    setCalendarCanvasFocus({ dayKey: null, eventId: null });
    moveToStage("briefing");
  };

  const connectMicrosoft = async () => {
    if (
      microsoftStatus === "connecting" ||
      microsoftStatus === "refreshing"
    ) {
      return;
    }

    setMicrosoftStatus("connecting");
    setMicrosoftNote("Taking you to Microsoft’s secure sign-in");
    try {
      await connectMicrosoft365();
    } catch {
      setMicrosoftStatus("error");
      setMicrosoftNote(
        "The connection was not completed. Nothing was changed—try again when ready.",
      );
    }
  };

  const refreshMicrosoft = async () => {
    setMicrosoftStatus("refreshing");
    setMicrosoftNote("Refreshing Outlook, Calendar, and SharePoint");
    try {
      const snapshot = await refreshMicrosoft365();
      rememberMicrosoftSnapshot(snapshot);
      setMicrosoftStatus("connected");
      setMicrosoftNote(noteForMicrosoftSnapshot(snapshot));
      await syncMicrosoftProfile(snapshot).catch(() => undefined);
      startFirstDayResearch();
    } catch {
      setMicrosoftStatus("error");
      setMicrosoftNote("Microsoft 365 needs your attention to reconnect");
    }
  };

  const repairMicrosoftCalendar = async () => {
    if (microsoftActionPending) return;
    setMicrosoftStatus("connecting");
    setMicrosoftNote("Opening Microsoft to renew Calendar permission");
    try {
      await repairMicrosoftCalendarAccess();
    } catch {
      setMicrosoftStatus("connected");
      setMicrosoftNote(
        microsoftSnapshotRef.current?.calendarIssue?.message ??
          "Calendar permission was not changed. You can try again when ready.",
      );
    }
  };

  const enableMeetingIntelligence = async () => {
    if (microsoftActionPending) return;
    setMicrosoftStatus("connecting");
    setMicrosoftNote(
      "Opening Microsoft to approve meeting settings and transcript access",
    );
    try {
      await enableMicrosoftMeetingIntelligence();
    } catch {
      setMicrosoftStatus("connected");
      setMicrosoftNote(
        "Meeting intelligence was not enabled. Microsoft administrator approval may be required.",
      );
    }
  };

  const enableDocumentPublishing = async () => {
    if (microsoftActionPending) return;
    setMicrosoftStatus("connecting");
    setMicrosoftNote(
      "Opening Microsoft to approve new document publishing in SharePoint",
    );
    try {
      await enableMicrosoftDocumentPublishing();
    } catch {
      setMicrosoftStatus("connected");
      setMicrosoftNote(
        "Document publishing was not enabled. You can try again when ready.",
      );
    }
  };

  const enableOutboundCommunication = async () => {
    if (microsoftActionPending) return;
    setMicrosoftStatus("connecting");
    setMicrosoftNote("Opening Microsoft to approve Outlook sending");
    try {
      await enableMicrosoftOutboundCommunication();
    } catch {
      setMicrosoftStatus("connected");
      setMicrosoftNote("Outlook sending was not enabled. You can try again when ready.");
    }
  };

  const disconnectMicrosoft = async () => {
    await disconnectMicrosoft365();
    rememberMicrosoftSnapshot(null);
    setMicrosoftStatus("disconnected");
    setMicrosoftNote("Disconnected from this browser");
  };

  const microsoftConnected =
    microsoftStatus === "connected" || microsoftStatus === "refreshing";
  const microsoftActionPending =
    microsoftStatus === "checking" ||
    microsoftStatus === "connecting" ||
    microsoftStatus === "refreshing";
  const userInitials = (microsoftSnapshot?.account.name || "Parallel user")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";
  const calendarNeedsPermission =
    microsoftSnapshot?.capabilities.calendar === "permission_required";
  const calendarNeedsAttention =
    Boolean(microsoftSnapshot) &&
    microsoftSnapshot?.capabilities.calendar !== "ready";
  const meetingIntelligenceNeedsPermission =
    microsoftSnapshot?.capabilities.meetingIntelligence !== "ready";
  const documentPublishingNeedsPermission =
    microsoftSnapshot?.capabilities.documentPublishing !== "ready";
  const outboundCommunicationNeedsPermission =
    microsoftSnapshot?.capabilities.outboundCommunication !== "ready";
  const approvalWaiting =
    stage === "ready" ||
    stage === "meetingReady" ||
    stage === "meetingConflict" ||
    stage === "meetingUpdateReady" ||
    stage === "documentReady";
  const attentionItems = platformWorkspace?.attention ?? [];
  const openCommitments = (platformWorkspace?.commitments ?? []).filter(
    (commitment) => commitment.status !== "completed",
  );
  const urgentAttention = attentionItems.filter((item) => item.urgency === "high").length;
  const usage = platformWorkspace?.usage ?? {
    sessions: 0,
    totalTokens: 0,
    usageUnits: 0,
    tierC: 0,
    tierD: 0,
  };
  const platformCapabilities = platformWorkspace?.capabilities ?? {
    meetingKnowledge: 0,
    ownedWork: 0,
    dependencies: 0,
    pendingDelegations: 0,
    desktopRequests: 0,
    outboundSent: 0,
  };
  return (
    <>
      <section
        ref={visualRef}
        className={`ara-first-moment arrival-${arrivalPhase} moment-${firstMomentState} recovery-${arrivalRecoveryKind ?? "none"} ${observationClosing ? "observation-closing" : ""} ${araBarAwake ? "ara-color-awake" : ""} ${humanBarAwake ? "human-color-awake" : ""} ${araAudioActive ? "ara-audio-active" : ""} ${humanAudioActive ? "human-audio-active" : ""}`}
        aria-label="Ara voice conversation"
      >
        <div className="first-moment-atmosphere" aria-hidden="true">
          <i className="first-moment-atmosphere-ara" />
          <i className="first-moment-atmosphere-human" />
        </div>
        <div className="first-moment-presence" aria-hidden="true">
          <span className="first-moment-wordmark">parallel</span>
          <div className="first-moment-bars">
            <i />
            <i />
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          {arrivalNeedsRecovery
            ? voiceNote
            : voiceState === "listening"
              ? "Ara is listening."
              : voiceState === "speaking"
                ? visibleCaption
                : ""}
        </p>
        <button
          className="arrival-caption-toggle"
          type="button"
          aria-keyshortcuts="Alt+C"
          aria-pressed={captionsEnabled}
          onClick={toggleCaptions}
        >
          {captionsEnabled ? "Turn captions off" : "Turn captions on"}
        </button>
        {captionsEnabled && visibleCaption && (
          <p className="arrival-captions" aria-hidden="true">
            {visibleCaption}
          </p>
        )}
        {onboardingConnectionPrompt && !microsoftConnected && (
          <section className="first-moment-integration" aria-label="Connect Microsoft 365">
            <p><strong>Microsoft 365</strong></p>
            <button type="button" onClick={connectMicrosoft} disabled={microsoftActionPending}>
              {microsoftActionPending ? "Opening…" : "Connect"}
            </button>
          </section>
        )}
        {arrivalNeedsRecovery && arrivalRecoveryKind === "autoplay" && (
          <button
            ref={recoveryButtonRef}
            className="first-moment-autoplay-gate"
            type="button"
            aria-label="Begin the conversation with Ara"
            onClick={() => void continueArrival()}
          >
            <span className="sr-only">Begin the conversation with Ara</span>
          </button>
        )}
        {arrivalNeedsRecovery && arrivalRecoveryKind !== "autoplay" && (
          <div className="first-moment-recovery" role="alert">
            <p>{voiceNote}</p>
            <button
              ref={recoveryButtonRef}
              type="button"
              onClick={() => void continueArrival()}
            >
              Continue
            </button>
          </div>
        )}
      </section>
      <main className={`app-shell legacy-experience ${showStartup ? "app-loading" : "app-ready"}`} aria-hidden="true">
      <header className="topbar">
        <button
          className="brand"
          type="button"
          aria-label="Parallel"
          onClick={() => moveToSection("ara")}
        >
          <ParallelMark />
          <ParallelWordmark />
        </button>
        <button
          className={`avatar ${profileOpen ? "active" : ""}`}
          aria-label="Open preferences"
          aria-expanded={profileOpen}
          onClick={() => setProfileOpen((open) => !open)}
        >
          {userInitials}
        </button>
      </header>

      <section className={`workspace view-${activeNav}`}>
        {profileOpen && (
          <aside className="profile-panel" aria-label="Ara preferences">
            <div className="profile-heading">
              <div>
                <p>ARA · GETTING TO KNOW YOU</p>
                <h2>Make this feel like your space.</h2>
              </div>
              <button
                aria-label="Close profile"
                onClick={() => setProfileOpen(false)}
              >
                ×
              </button>
            </div>
            <label>
              Morning briefing
              <input
                value={userProfile.morning_briefing_time ?? ""}
                placeholder="Around 8:30 AM"
                onChange={(event) => setUserProfile((profile) => ({ ...profile, morning_briefing_time: event.target.value }))}
                onBlur={() => void saveDecisionProfile()}
              />
            </label>
            <label>
              Your role and responsibilities
              <input
                value={userProfile.role_and_responsibilities ?? ""}
                placeholder="How Ara should understand your role"
                onChange={(event) => setUserProfile((profile) => ({ ...profile, role_and_responsibilities: event.target.value }))}
                onBlur={() => void saveDecisionProfile()}
              />
            </label>
            <label>
              What needs most of your attention?
              <input
                value={userProfile.current_priorities ?? ""}
                placeholder="My team, customers, and major projects"
                onChange={(event) => setUserProfile((profile) => ({ ...profile, current_priorities: event.target.value }))}
                onBlur={() => void saveDecisionProfile()}
              />
            </label>
            <label>
              How should Ara work with you?
              <select
                value={userProfile.proactivity ?? ""}
                onChange={(event) => setUserProfile((profile) => ({ ...profile, proactivity: event.target.value }))}
                onBlur={() => void saveDecisionProfile()}
              >
                <option value="">Choose a style</option>
                <option value="Quiet unless something is urgent">Quiet</option>
                <option value="Balanced and thoughtful">Balanced</option>
                <option value="Proactive—surface things early">Proactive</option>
              </select>
            </label>
            <label>
              When should Ara interrupt you?
              <select
                value={userProfile.interruption_threshold}
                onChange={(event) => setUserProfile((profile) => ({ ...profile, interruption_threshold: event.target.value }))}
                onBlur={() => void saveDecisionProfile()}
              >
                <option value="critical_only">Critical only</option>
                <option value="high_signal">High-signal items</option>
                <option value="proactive">Keep me ahead</option>
              </select>
            </label>
            <button className="profile-save" onClick={() => void saveDecisionProfile()}>
              Save decision profile
            </button>
            <p className="profile-note">
              {platformNote}. Your stated goals always take priority over
              Ara’s observations.
            </p>
          </aside>
        )}
        <div className="date-row view-panel today-view">
          <div>
            <p>{todayLabel}</p>
            <h1>Move through work with clarity.</h1>
          </div>
          <aside className="daily-quote">
            <span>Today’s perspective</span>
            <blockquote>“{dailyQuotes[quoteIndex].quote}”</blockquote>
            <cite>— {dailyQuotes[quoteIndex].author}</cite>
          </aside>
        </div>

        <section
          className={`microsoft-connection microsoft-${microsoftStatus} view-panel today-view`}
          aria-live="polite"
        >
          <div className="connection-symbol">
            <span className="ms-icon">M</span>
            <span className="connection-pulse" />
          </div>
          <div className="connection-copy">
            <p>MICROSOFT 365 · GOVERNED ACCESS</p>
            <h2>
              {microsoftConnected && microsoftSnapshot
                ? calendarNeedsAttention
                  ? `${microsoftSnapshot.account.name} is connected · calendar needs attention`
                  : `${microsoftSnapshot.account.name} is connected`
                : microsoftStatus === "connecting"
                  ? "Waiting for Microsoft"
                  : "Give Ara a window into your work"}
            </h2>
            <span>{microsoftNote}</span>
          </div>

          {microsoftConnected && microsoftSnapshot ? (
            <div className="connection-capabilities">
              <span
                className={
                  microsoftSnapshot.capabilities.mail === "ready"
                    ? "ready"
                    : ""
                }
              >
                Outlook
                <small>
                  {microsoftSnapshot.capabilities.mail === "ready"
                    ? `${microsoftSnapshot.recentMessages.length} recent`
                    : "Provisioning"}
                </small>
              </span>
              <span
                className={
                  microsoftSnapshot.capabilities.calendar === "ready"
                    ? "ready"
                    : ""
                }
              >
                Calendar
                <small>
                  {microsoftSnapshot.capabilities.calendar === "ready"
                    ? `${microsoftSnapshot.upcomingEvents.length} upcoming`
                    : microsoftSnapshot.capabilities.calendar ===
                        "permission_required"
                      ? "Reconnect access"
                      : microsoftSnapshot.capabilities.calendar ===
                          "mailbox_not_ready"
                        ? "Mailbox not ready"
                        : microsoftSnapshot.capabilities.calendar ===
                            "unavailable"
                          ? "Try refresh"
                          : "Provisioning"}
                </small>
              </span>
              <span
                className={
                  microsoftSnapshot.capabilities.sharePoint === "ready"
                    ? "ready"
                    : ""
                }
              >
                SharePoint
                <small>
                  {microsoftSnapshot.capabilities.sharePoint === "ready"
                    ? "Ready"
                    : "Provisioning"}
                  </small>
              </span>
              <span
                className={
                  microsoftSnapshot.capabilities.documentPublishing ===
                  "ready"
                    ? "ready"
                    : ""
                }
              >
                Documents
                <small>
                  {microsoftSnapshot.capabilities.documentPublishing ===
                  "ready"
                    ? "Publish ready"
                    : "Enable publishing"}
                </small>
              </span>
              <span
                className={
                  microsoftSnapshot.capabilities.directory === "ready"
                    ? "ready"
                    : ""
                }
              >
                People
                <small>
                  {microsoftSnapshot.capabilities.directory === "ready"
                    ? `${microsoftSnapshot.directoryPeople} available`
                    : "Reconnect"}
                  </small>
              </span>
              <span
                className={
                  microsoftSnapshot.capabilities.meetingIntelligence ===
                  "ready"
                    ? "ready"
                    : ""
                }
              >
                Meeting notes
                <small>
                  {microsoftSnapshot.capabilities.meetingIntelligence ===
                  "ready"
                    ? "Enabled"
                    : "Enable access"}
                </small>
              </span>
              <span
                className={
                  microsoftSnapshot.capabilities.outboundCommunication ===
                  "ready"
                    ? "ready"
                    : ""
                }
              >
                Outlook send
                <small>
                  {microsoftSnapshot.capabilities.outboundCommunication ===
                  "ready"
                    ? "Enabled"
                    : "Enable access"}
                </small>
              </span>
            </div>
          ) : (
            <p className="connection-boundary">
              Ara can read what you can see and book meetings, lunches, and
              appointments after you confirm the details. Outlook sending is
              separately enabled; Teams chat stays draft-only.
            </p>
          )}

          <div className="connection-actions">
            {microsoftConnected ? (
              <>
                {calendarNeedsPermission && (
                  <button
                    className="connector-primary"
                    onClick={repairMicrosoftCalendar}
                    disabled={microsoftActionPending}
                  >
                    Repair calendar access
                  </button>
                )}
                {meetingIntelligenceNeedsPermission && (
                  <button
                    className="connector-primary"
                    onClick={enableMeetingIntelligence}
                    disabled={microsoftActionPending}
                  >
                    Enable meeting intelligence
                  </button>
                )}
                {documentPublishingNeedsPermission && (
                  <button
                    className="connector-primary"
                    onClick={enableDocumentPublishing}
                    disabled={microsoftActionPending}
                  >
                    Enable document publishing
                  </button>
                )}
                {outboundCommunicationNeedsPermission && (
                  <button
                    className="connector-primary"
                    onClick={enableOutboundCommunication}
                    disabled={microsoftActionPending}
                  >
                    Enable Outlook sending
                  </button>
                )}
                <button
                  className="connector-refresh"
                  onClick={refreshMicrosoft}
                  disabled={microsoftActionPending}
                >
                  {microsoftStatus === "refreshing" ? "Refreshing…" : "Refresh"}
                </button>
                <button
                  className="connector-disconnect"
                  onClick={disconnectMicrosoft}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                className="connector-primary"
                onClick={connectMicrosoft}
                disabled={microsoftActionPending}
              >
                {microsoftStatus === "checking"
                  ? "Checking…"
                  : microsoftStatus === "connecting"
                    ? "Connecting…"
                    : "Connect Microsoft 365"}
              </button>
            )}
          </div>
        </section>

        <section className={`friday-panel stage-${stage} view-panel ara-view`}>
          <div className={`friday-visual voice-${voiceState}`}>
            <div className="ara-presence-title">
              <p>ARA</p>
              <span>Your right hand in Parallel</span>
            </div>
            <div className="voice-stage" aria-hidden="true">
              <div className="signal-ring ring-one" />
              <div className="signal-ring ring-two" />
              <div className="voice-glow human-glow" />
              <div className="voice-glow friday-glow" />
              <div className="voice-bars">
                <i className="friday-bar" />
                <i className="human-bar" />
              </div>
            </div>
            <div className="voice-status">
              <span className="voice-status-dot" />
              {stage === "searching" ? "Consulting Recall" : voiceLabel}
            </div>
            {(arrivalAttempted || voiceConnected) && (
              <button
                className="talk-button"
                onClick={demonstrateVoiceFallback}
                disabled={voiceState === "connecting"}
                aria-label={
                  voiceConnected
                    ? "End voice conversation with Ara"
                    : "Start voice conversation with Ara"
                }
              >
                <span className="mic-icon">●</span>
                {voiceState === "connecting"
                  ? "Ara is arriving…"
                  : voiceConnected
                    ? "End conversation"
                    : "Talk to Ara"}
              </button>
            )}
            <p className="voice-key">
              <span><i className="key-human" />You</span>
              <span><i className="key-friday" />Ara</span>
            </p>
            <p className="noise-filter">
              <span aria-hidden="true">◇</span>
              Thoughtful pause · interrupt Ara anytime
            </p>
            {voiceConnected ? (
              <p className="session-receipt session-live">
                Session · {conversationStateLabel[conversationState]}
              </p>
            ) : lastSession ? (
              <p className="session-receipt">
                Last session · {formatSessionDuration(lastSession.durationMs)} ·{" "}
                {lastSession.tools.length} {lastSession.tools.length === 1 ? "tool" : "tools"} ·{" "}
                {lastSession.usage.totalTokens} tokens · {sessionCloseLabel}
              </p>
            ) : null}
            <p className="voice-note">{voiceNote}</p>
            {fridayTranscript && (
              <p className="voice-transcript" aria-live="polite">
                “{fridayTranscript}”
              </p>
            )}
          </div>

          <div className="conversation" aria-label="Ara's live canvas" aria-live="polite">
            {stage === "calendarView" && calendarCanvas && (
              <section className="calendar-canvas" aria-label={`${calendarCanvas.label} calendar`}>
                <header>
                  <div>
                    <p>ARA’S CANVAS · LIVE CALENDAR</p>
                    <h3>{calendarCanvas.label}</h3>
                  </div>
                  <span>{calendarCanvas.events.length} {calendarCanvas.events.length === 1 ? "item" : "items"}</span>
                </header>
                <div className="calendar-week">
                  {calendarCanvasDays(calendarCanvas).map((day) => {
                    const dayFocused = calendarCanvasFocus.dayKey === day.key;
                    return (
                      <article className={`calendar-day ${dayFocused ? "focused" : ""}`} key={day.key}>
                        <div className="calendar-day-heading">
                          <b>{day.date.toLocaleDateString(undefined, { weekday: "short" })}</b>
                          <span>{day.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        </div>
                        {day.events.length ? (
                          <div className="calendar-events">
                            {day.events.map((event) => (
                              <div
                                className={`calendar-event ${calendarCanvasFocus.eventId === event.id ? "focused" : ""}`}
                                key={event.id}
                              >
                                <small>{event.displayTime || "Time unavailable"}</small>
                                <strong>{event.subject || "Untitled meeting"}</strong>
                                {event.isOnlineMeeting && <i>Teams</i>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="calendar-clear">Clear</p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {stage !== "briefing" && (
              <div className="ara-context-divider">
                <span>Ara brought this into view</span>
              </div>
            )}

            {stage === "searching" && (
              <div className="search-progress">
                {["SharePoint and OneDrive", "Teams conversations", "Your recent activity"].map((item, index) => (
                  <div key={item} style={{ animationDelay: `${index * 160}ms` }}>
                    <span className="spinner" /> {item}
                  </div>
                ))}
              </div>
            )}

            {(stage === "found" || stage === "ready" || stage === "approved") && (
              <article className="document-card">
                <div className="file-icon">P</div>
                <div className="file-info">
                  <div className="confidence">
                    {Math.round(foundDocument.confidence * 100)}% CONFIDENCE
                  </div>
                  <h3>{foundDocument.title}</h3>
                  <p>{foundDocument.location}</p>
                  <div className="evidence">
                    <span>{foundDocument.edited}</span>
                    <span>{foundDocument.context}</span>
                    <span>{foundDocument.status}</span>
                  </div>
                </div>
                {foundDocument.webUrl ? (
                  <a
                    className="open-file"
                    href={foundDocument.webUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open ↗
                  </a>
                ) : (
                  <button className="open-file">Preview ↗</button>
                )}
              </article>
            )}

            {pendingMeeting &&
              (stage === "meetingReady" ||
                stage === "meetingConflict" ||
                stage === "meetingBooked") && (
                <article
                  className={`meeting-card ${stage === "meetingBooked" ? "booked" : ""}`}
                >
                  <div className="meeting-head">
                    <div>
                      <p>
                        {stage === "meetingBooked"
                          ? `${pendingMeeting.calendarItemType.toUpperCase()} · BOOKED`
                          : stage === "meetingConflict"
                            ? "CALENDAR CONFLICT"
                            : `${pendingMeeting.calendarItemType.toUpperCase()} · FOUND A TIME`}
                      </p>
                      <h3>{pendingMeeting.subject}</h3>
                    </div>
                    <span className="teams-badge">
                      {pendingMeeting.onlineMeeting ? "T" : "C"}
                    </span>
                  </div>

                  <div className="meeting-time">
                    <span className="calendar-glyph">
                      {new Date(pendingMeeting.start).getDate()}
                    </span>
                    <div>
                      <b>{pendingMeeting.displayTime}</b>
                      <small>
                        {pendingMeeting.durationMinutes} minutes · {pendingMeeting.onlineMeeting
                          ? "Microsoft Teams"
                          : pendingMeeting.location || "Your calendar"}
                      </small>
                    </div>
                  </div>

                  {pendingMeeting.attendees.length > 0 && (
                    <div className="meeting-attendees">
                      <p>ATTENDEES</p>
                      {pendingMeeting.attendees.map((attendee) => (
                        <div key={attendee.email}>
                          <span className="mini-avatar">
                            {attendee.displayName
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase())
                              .join("") || "·"}
                          </span>
                          <span>
                            <b>{attendee.displayName}</b>
                            <small>{attendee.email}</small>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {pendingMeeting.purpose && (
                    <p className="meeting-purpose">{pendingMeeting.purpose}</p>
                  )}

                  {(pendingMeeting.agendaItems.length > 0 ||
                    pendingMeeting.enableTranscription) && (
                    <div className="meeting-agenda">
                      {pendingMeeting.agendaItems.length > 0 && (
                        <>
                          <p>AGENDA</p>
                          <ol>
                            {pendingMeeting.agendaItems.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ol>
                        </>
                      )}
                      {pendingMeeting.enableTranscription && (
                        <span>
                          ◇ Transcript-ready meeting requested
                          {stage === "meetingBooked" && bookedMeeting
                            ? bookedMeeting.transcriptionStatus === "enabled"
                              ? " · enabled"
                              : " · needs Meeting intelligence access"
                            : ""}
                        </span>
                      )}
                    </div>
                  )}

                  {pendingMeeting.calendarItemType !== "meeting" &&
                    (pendingMeeting.location ||
                      pendingMeeting.address ||
                      pendingMeeting.personalNotes.length > 0 ||
                      pendingMeeting.menuItems.length > 0) && (
                      <div className="personal-calendar-notes">
                        <p>PERSONAL NOTES</p>
                        {pendingMeeting.location && <b>{pendingMeeting.location}</b>}
                        {pendingMeeting.address && <span>{pendingMeeting.address}</span>}
                        {[...pendingMeeting.personalNotes, ...pendingMeeting.menuItems].map((note) => (
                          <small key={note}>• {note}</small>
                        ))}
                      </div>
                    )}

                  {stage === "meetingConflict" && calendarConflicts[0] ? (
                    <div className="calendar-conflict-card">
                      <p>CONFLICT AT THIS TIME</p>
                      <h4>{calendarConflicts[0].subject}</h4>
                      <span>{calendarConflicts[0].displayTime}</span>
                      <small>
                        {calendarConflicts.length > 1
                          ? `${calendarConflicts.length} items overlap this time. Ara will keep them untouched.`
                          : calendarConflicts[0].isOrganizer
                            ? "You own this meeting, so Ara can move it after you choose that option."
                            : "Someone else owns this meeting, so Ara can decline it after you choose that option."}
                      </small>
                      <div className="action-row">
                        {calendarConflicts.length === 1 &&
                          (calendarConflicts[0].isOrganizer ? (
                            <button
                              className="secondary"
                              onClick={() =>
                                void resolveCalendarConflictWithButton(
                                  "move_existing",
                                )
                              }
                              disabled={
                                meetingActionPending ||
                                !calendarConflicts[0].suggestedExistingStart
                              }
                            >
                              Move {calendarConflicts[0].subject} + book this
                            </button>
                          ) : (
                            <button
                              className="secondary"
                              onClick={() =>
                                void resolveCalendarConflictWithButton(
                                  "decline_existing",
                                )
                              }
                              disabled={meetingActionPending}
                            >
                              Decline {calendarConflicts[0].subject} + book this
                            </button>
                          ))}
                        <button
                          className="primary"
                          onClick={() =>
                            void resolveCalendarConflictWithButton(
                              "reschedule_requested",
                            )
                          }
                          disabled={
                            meetingActionPending ||
                            !calendarConflicts[0].suggestedRequestedStart
                          }
                        >
                          Use {calendarConflicts[0].suggestedRequestedDisplayTime ?? "another time"}
                        </button>
                      </div>
                    </div>
                  ) : stage === "meetingReady" ? (
                    <>
                      {pendingMeeting.privacyChoicePending ? (
                        <div className="privacy-choice">
                          <p>Want me to make this private?</p>
                          <div className="action-row">
                            <button className="secondary" onClick={() => setMeetingPrivacyWithButton(false)}>Keep normal</button>
                            <button className="primary" onClick={() => setMeetingPrivacyWithButton(true)}>Make private</button>
                          </div>
                        </div>
                      ) : (
                        <>
                      <p className="voice-approval-hint">
                        {pendingMeeting.isPrivate ? "Private · " : ""}Respond naturally—“Sounds good.”
                      </p>
                      <div className="action-row">
                        <button
                          className="secondary"
                          onClick={startAnotherRequest}
                          disabled={meetingActionPending}
                        >
                          Not this time
                        </button>
                        <button
                          className="primary approve"
                          onClick={() => void approveMeetingWithButton()}
                          disabled={meetingActionPending}
                        >
                          {meetingActionPending
                            ? "Booking…"
                            : `Book ${pendingMeeting.calendarItemType}`}{" "}
                          <span>→</span>
                        </button>
                      </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="audit-line">
                        <span>✓</span> Confirmed{" "}
                        {approvalMethod === "voice" ? "by voice" : "with a tap"}
                        {pendingMeeting.attendees.length > 0
                          ? " · Invitations sent"
                          : " · Added to your calendar"}
                      </div>
                      <div className="meeting-links">
                        {bookedMeeting?.joinUrl && (
                          <a
                            href={bookedMeeting.joinUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Join Teams meeting ↗
                          </a>
                        )}
                        {bookedMeeting?.webLink && (
                          <a
                            href={bookedMeeting.webLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open in Outlook ↗
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </article>
              )}

            {pendingMeetingUpdate &&
              (stage === "meetingUpdateReady" ||
                stage === "meetingUpdated") && (
                <article
                  className={`meeting-card meeting-update-card ${stage === "meetingUpdated" ? "booked" : ""}`}
                >
                  <div className="meeting-head">
                    <div>
                      <p>
                        {stage === "meetingUpdated"
                          ? "OUTLOOK INVITE · UPDATED"
                          : "PROPOSED INVITE UPDATE"}
                      </p>
                      <h3>{pendingMeetingUpdate.subject}</h3>
                    </div>
                    <span className="teams-badge">T</span>
                  </div>
                  <p className="meeting-update-time">
                    {pendingMeetingUpdate.displayTime}
                  </p>
                  {pendingMeetingUpdate.objective && (
                    <p className="meeting-purpose">
                      <b>Objective</b> · {pendingMeetingUpdate.objective}
                    </p>
                  )}
                  <div className="meeting-agenda">
                    <p>AGENDA TO ADD</p>
                    <ol>
                      {pendingMeetingUpdate.agendaItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                    {pendingMeetingUpdate.enableTranscription && (
                      <span>
                        ◇ Enable transcription in Teams meeting options
                      </span>
                    )}
                  </div>
                  {stage === "meetingUpdateReady" ? (
                    <>
                      <p className="voice-approval-hint">
                        Respond naturally—“That looks good, update it.”
                      </p>
                      <div className="action-row">
                        <button
                          className="secondary"
                          onClick={startAnotherRequest}
                          disabled={meetingActionPending}
                        >
                          Keep it unchanged
                        </button>
                        <button
                          className="primary approve"
                          onClick={() => void approveMeetingUpdateWithButton()}
                          disabled={meetingActionPending}
                        >
                          {meetingActionPending
                            ? "Updating…"
                            : "Update invitation"}{" "}
                          <span>→</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="audit-line">
                        <span>✓</span> Agenda added to the live invitation
                        {meetingUpdateResult?.transcriptionStatus === "enabled"
                          ? " · Transcription enabled"
                          : ""}
                      </div>
                      {meetingUpdateResult?.webLink && (
                        <div className="meeting-links">
                          <a
                            href={meetingUpdateResult.webLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open updated invitation ↗
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </article>
              )}

            {stage === "notesReady" && meetingNotes && (
              <article className="meeting-notes-card">
                <div className="notes-heading">
                  <div>
                    <p>ARA · TRANSCRIPT NOTES</p>
                    <h3>{meetingNotes.subject}</h3>
                  </div>
                  <span>Verified source · Microsoft Teams</span>
                </div>
                <p className="notes-summary">{meetingNotes.summary}</p>
                <div className="notes-grid">
                  <section>
                    <p>DECISIONS</p>
                    {meetingNotes.decisions.length ? (
                      <ul>
                        {meetingNotes.decisions.map((decision) => (
                          <li key={decision}>{decision}</li>
                        ))}
                      </ul>
                    ) : (
                      <span>None stated clearly.</span>
                    )}
                  </section>
                  <section>
                    <p>ACTION ITEMS</p>
                    {meetingNotes.actionItems.length ? (
                      <ul>
                        {meetingNotes.actionItems.map((item) => (
                          <li key={`${item.owner}-${item.action}`}>
                            <b>{item.owner}</b> · {item.action}
                            <small>{item.due}</small>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span>None assigned clearly.</span>
                    )}
                  </section>
                  <section>
                    <p>RISKS</p>
                    <ul>
                      {meetingNotes.risks.map((risk) => (
                        <li key={risk}>{risk}</li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <p>OPEN QUESTIONS</p>
                    <ul>
                      {meetingNotes.openQuestions.map((question) => (
                        <li key={question}>{question}</li>
                      ))}
                    </ul>
                  </section>
                </div>
                <p className="notes-boundary">
                  Drafted in Parallel from the Teams transcript. Ask Ara to turn
                  these notes into a branded meeting record; publishing still
                  waits for your approval.
                </p>
              </article>
            )}

            {(stage === "documentReady" ||
              stage === "documentPublished") &&
              pendingDocument && (
                <article
                  className={`document-studio ${stage === "documentPublished" ? "published" : ""}`}
                >
                  <div className="document-studio-heading">
                    <div>
                      <p>ARA · BRANDED DOCUMENT</p>
                      <h3>{pendingDocument.title}</h3>
                    </div>
                    <span>
                      {pendingDocument.kind.replaceAll("_", " ")} · v
                      {pendingDocument.version}
                    </span>
                  </div>
                  <div className="document-preview-frame">
                    <iframe
                      title={`Preview of ${pendingDocument.title}`}
                      sandbox=""
                      srcDoc={pendingDocument.html}
                    />
                  </div>
                  {stage === "documentReady" ? (
                    <>
                      <div className="document-publish-detail">
                        <div>
                          <b>{pendingDocument.suggestedFileName}</b>
                          <small>
                            SharePoint · Parallel Documents · New copy only
                          </small>
                        </div>
                        <span>
                          {documentPublishingNeedsPermission
                            ? "Publishing access needs to be enabled on Today"
                            : "Ready for your approval"}
                        </span>
                      </div>
                      <p className="voice-approval-hint">
                        Respond naturally—“That looks good, publish it.”
                      </p>
                      <div className="action-row">
                        <button
                          className="secondary"
                          onClick={() =>
                            setVoiceNote(
                              "Kept as a working draft · nothing was published",
                            )
                          }
                        >
                          Keep as draft
                        </button>
                        <button
                          className="primary approve"
                          onClick={() => void approveDocumentPublishWithButton()}
                          disabled={
                            documentActionPending ||
                            documentPublishingNeedsPermission
                          }
                        >
                          {documentActionPending
                            ? "Publishing…"
                            : "Publish to SharePoint"}{" "}
                          <span>→</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="document-published-result">
                      <div className="audit-line">
                        <span>✓</span> Published as a new SharePoint document
                      </div>
                      {publishedDocument?.webUrl && (
                        <a
                          href={publishedDocument.webUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open {publishedDocument.name} ↗
                        </a>
                      )}
                    </div>
                  )}
                </article>
              )}

            {stage === "found" && (
              <div className="action-row">
                <button className="secondary" onClick={() => moveToStage("briefing")}>Not this one</button>
                <button className="primary" onClick={() => moveToStage("ready")}>Yes, prepare the message <span>→</span></button>
              </div>
            )}

            {(stage === "ready" || stage === "approved") && (
              <article className={`approval-card ${stage === "approved" ? "approved" : ""}`}>
                <div className="approval-head">
                  <div>
                    <p>{stage === "approved" ? "ARA · READY TO TAKE IT FROM HERE" : "HOW DOES THAT SOUND?"}</p>
                    <h3>{stage === "approved" ? "Ara has your go-ahead" : "Ara has the message ready"}</h3>
                  </div>
                  <span className="teams-badge">{/outlook|email/i.test(messageChannel) ? "O" : "T"}</span>
                </div>
                <div className="recipient">
                  <span className="mini-avatar">{messageRecipient.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "·"}</span>
                  <div><b>{messageRecipient}</b><small>{messageChannel}</small></div>
                </div>
                <textarea
                  aria-label={`Message to ${messageRecipient}`}
                  value={message}
                  onChange={(event) => {
                    messageRef.current = event.target.value;
                    setMessage(event.target.value);
                  }}
                  readOnly={stage === "approved"}
                />
                {stage === "ready" ? (
                  <>
                    <p className="voice-approval-hint">
                      Respond naturally—“That sounds good, send it.”
                    </p>
                    <div className="action-row">
                      <button className="secondary" onClick={() => moveToStage("found")}>Go back</button>
                      <button className="primary approve" onClick={approveWithButton}>Looks good <span>→</span></button>
                    </div>
                  </>
                ) : (
                  <div className="audit-line">
                    <span>✓</span> You said it sounded good {approvalMethod === "voice" ? "by voice" : "with a tap"} · {/outlook|email/i.test(messageChannel) ? "Sent through Outlook" : "Draft retained safely"}
                  </div>
                )}
              </article>
            )}

            {(stage === "approved" ||
              stage === "meetingBooked" ||
              stage === "meetingUpdated" ||
              stage === "notesReady" ||
              stage === "documentPublished") && (
              <button className="new-request" onClick={startAnotherRequest}>Start another request</button>
            )}
          </div>
        </section>

        <section className="workspace-view view-panel recall-view" aria-label="Recall workspace">
          <header className="view-heading">
            <div>
              <p>RECALL · CONNECTED WORKING MEMORY</p>
              <h1>Find the context behind the work.</h1>
            </div>
            <span>
              Search by project, person, topic, or a phrase you remember.
            </span>
          </header>

          <form
            className="recall-search"
            onSubmit={(event) => {
              event.preventDefault();
              void searchRecallWorkspace();
            }}
          >
            <label htmlFor="recall-query">What are you looking for?</label>
            <div>
              <input
                id="recall-query"
                value={recallQuery}
                onChange={(event) => setRecallQuery(event.target.value)}
                placeholder="Try “failover notes,” “Matt’s strategic plan,” or a project name"
              />
              <button type="submit" disabled={!recallQuery.trim() || recallSearching}>
                {recallSearching ? "Searching…" : "Search Recall"}
              </button>
            </div>
            <p aria-live="polite">{recallMessage}</p>
          </form>

          <div className="recall-source-grid">
            <article>
              <span>O</span>
              <div><b>Outlook</b><small>{microsoftConnected ? "Connected" : "Connect from Today"}</small></div>
            </article>
            <article>
              <span>C</span>
              <div><b>Calendar</b><small>{microsoftConnected ? "Connected" : "Connect from Today"}</small></div>
            </article>
            <article>
              <span>S</span>
              <div><b>SharePoint</b><small>{microsoftConnected ? "Ready to search" : "Connect from Today"}</small></div>
            </article>
            <article>
              <span>P</span>
              <div><b>People</b><small>{microsoftSnapshot?.directoryPeople ?? 0} available</small></div>
            </article>
          </div>

          <div className="recall-results" aria-live="polite">
            {recallResults.length > 0 ? (
              recallResults.map((result) => (
                <article key={`${result.location}-${result.title}`}>
                  <div className="file-icon">P</div>
                  <div>
                    <p>{result.location}</p>
                    <h2>{result.title}</h2>
                    <span>{result.edited}</span>
                  </div>
                  {result.webUrl && (
                    <a href={result.webUrl} target="_blank" rel="noreferrer">
                      Open ↗
                    </a>
                  )}
                </article>
              ))
            ) : (
              <div className="recall-empty">
                <ParallelMark />
                <div>
                  <h2>Recall is ready when you are.</h2>
                  <p>
                    Search directly here, or talk to Ara when you want help
                    connecting the people and decisions around a result.
                  </p>
                </div>
                <button onClick={() => moveToSection("ara")}>Talk to Ara</button>
              </div>
            )}
          </div>
        </section>

        <section className="workspace-view view-panel approvals-view" aria-label="Approvals workspace">
          <header className="view-heading">
            <div>
              <p>APPROVALS · YOUR CONTROL LAYER</p>
              <h1>Review the work. Make the call.</h1>
            </div>
            <span>Ara prepares the action; nothing important moves without you.</span>
          </header>

          <div className="approval-workspace-grid">
            <article className="approval-queue-card">
              <div className="queue-card-head">
                <div>
                  <p>WAITING FOR YOU</p>
                  <h2>
                    {approvalWaiting
                      ? "One item needs your judgment."
                      : "You’re all caught up."}
                  </h2>
                </div>
                <span className="queue-count">
                  {approvalWaiting ? "1" : "0"}
                </span>
              </div>

              {(stage === "meetingReady" || stage === "meetingConflict") &&
              pendingMeeting ? (
                <div className="queue-item">
                  <span className="teams-badge">T</span>
                  <div>
                    <p>
                      {stage === "meetingConflict"
                        ? "CALENDAR CONFLICT"
                        : pendingMeeting.calendarItemType.toUpperCase()}
                    </p>
                    <h3>{pendingMeeting.subject}</h3>
                    <span>{pendingMeeting.displayTime} · {pendingMeeting.attendees.length} attendees</span>
                  </div>
                  <button onClick={() => moveToSection("ara")}>Review</button>
                </div>
              ) : stage === "documentReady" && pendingDocument ? (
                <div className="queue-item">
                  <span className="document-badge">D</span>
                  <div>
                    <p>SHAREPOINT DOCUMENT</p>
                    <h3>{pendingDocument.title}</h3>
                    <span>Branded draft · not published</span>
                  </div>
                  <button onClick={() => moveToSection("ara")}>Review</button>
                </div>
              ) : stage === "meetingUpdateReady" && pendingMeetingUpdate ? (
                <div className="queue-item">
                  <span className="teams-badge">T</span>
                  <div>
                    <p>INVITATION UPDATE</p>
                    <h3>{pendingMeetingUpdate.subject}</h3>
                    <span>Agenda prepared · not updated</span>
                  </div>
                  <button onClick={() => moveToSection("ara")}>Review</button>
                </div>
              ) : stage === "ready" ? (
                <div className="queue-item">
                  <span className="teams-badge">T</span>
                  <div>
                    <p>MESSAGE DRAFT</p>
                    <h3>Message for {messageRecipient}</h3>
                    <span>{messageChannel} · prepared by Ara</span>
                  </div>
                  <button onClick={() => moveToSection("ara")}>Review</button>
                </div>
              ) : (
                <div className="queue-empty">
                  <span>✓</span>
                  <div>
                    <h3>Nothing is waiting on you.</h3>
                    <p>New proposals will appear here with the context needed to decide quickly.</p>
                  </div>
                </div>
              )}
            </article>

            <article className="control-card">
              <p>HOW PARALLEL WORKS</p>
              <h2>Fast, without giving up control.</h2>
              <ol>
                <li><span>01</span><div><b>Ara prepares</b><small>She gathers context and recommends the next move.</small></div></li>
                <li><span>02</span><div><b>You decide</b><small>Approve naturally by voice or with a tap.</small></div></li>
                <li><span>03</span><div><b>Ara confirms</b><small>After success, she closes with a short, natural confirmation.</small></div></li>
              </ol>
            </article>
          </div>
        </section>

        <section className="operating-grid view-panel today-view" aria-label="Ara operating picture">
          <article className="operating-card attention-card">
            <header>
              <div>
                <p>ATTENTION · READ ONLY</p>
                <h2>{urgentAttention ? `${urgentAttention} item${urgentAttention === 1 ? "" : "s"} deserve a look.` : "The signal is under control."}</h2>
              </div>
              <span className="operating-count">{attentionItems.length}</span>
            </header>
            <div className="attention-list">
              {attentionItems.length ? attentionItems.slice(0, 4).map((item) => (
                <div className="attention-item" key={`${item.source}-${item.externalId}`}>
                  <i className={`urgency-dot urgency-${item.urgency}`} />
                  <div>
                    <b>{item.title}</b>
                    <small>{item.summary} · {item.reason}</small>
                  </div>
                  <span>{item.source}</span>
                </div>
              )) : (
                <div className="operating-empty">
                  <span>◇</span>
                  <p>{microsoftConnected ? "No connected-workspace signals need attention right now." : "Connect Microsoft 365 and Ara will quietly surface the work that matters."}</p>
                </div>
              )}
            </div>
            <p className="read-only-note">Ara can read, classify, and brief you here. She cannot act from monitoring alone.</p>
          </article>

          <article className="operating-card commitment-card">
            <header>
              <div>
                <p>COMMITMENTS · ACCOUNTABILITY</p>
                <h2>{openCommitments.length ? `${openCommitments.length} promise${openCommitments.length === 1 ? "" : "s"} to keep moving.` : "A clear slate."}</h2>
              </div>
              <span className="operating-count">{openCommitments.length}</span>
            </header>
            <form className="commitment-form" onSubmit={(event) => { event.preventDefault(); void addCommitment(); }}>
              <input value={commitmentDraft} onChange={(event) => setCommitmentDraft(event.target.value)} placeholder="What did you commit to?" aria-label="New commitment" />
              <input type="date" value={commitmentDue} onChange={(event) => setCommitmentDue(event.target.value)} aria-label="Commitment due date" />
              <button disabled={!commitmentDraft.trim() || commitmentPending}>{commitmentPending ? "Saving…" : "Add"}</button>
            </form>
            <div className="commitment-list">
              {openCommitments.slice(0, 4).map((commitment) => (
                <div className="commitment-item" key={commitment.id}>
                  <button aria-label={`Complete ${commitment.title}`} onClick={() => void updateCommitment(commitment, "completed", "helped")}>○</button>
                  <div>
                    <b>{commitment.title}</b>
                    <small>{commitment.dueAt ? `Due ${new Date(commitment.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : "No deadline"} · {commitment.ownerLabel}</small>
                  </div>
                  <button className="snooze-button" onClick={() => void updateCommitment(commitment, "snoozed", "not_now")}>Later</button>
                </div>
              ))}
              {!openCommitments.length && <div className="operating-empty"><span>✓</span><p>Add a commitment here, or tell Ara what you promised to do.</p></div>}
            </div>
          </article>

          <article className="operating-card governance-card">
            <header>
              <div>
                <p>GOVERNANCE · QUIETLY WORKING</p>
                <h2>Ara uses the least costly capable route.</h2>
              </div>
              <span className="route-badge">A–D</span>
            </header>
            <div className="route-meter">
              <div><span>Tier A</span><b>Rules</b><small>No model</small></div>
              <div><span>Tier B</span><b>Utility</b><small>Efficient</small></div>
              <div className="active"><span>Tier C</span><b>Voice</b><small>{usage.tierC} sessions</small></div>
              <div><span>Tier D</span><b>Deep</b><small>{usage.tierD} escalations</small></div>
            </div>
            <div className="usage-summary">
              <span><b>{usage.totalTokens.toLocaleString()}</b><small>measured tokens</small></span>
              <span><b>{usage.usageUnits.toLocaleString()}</b><small>weighted usage units</small></span>
              <span><b>{platformWorkspace?.policies.length ?? 3}</b><small>active policy rules</small></span>
            </div>
            <button className="profile-link" onClick={() => setProfileOpen(true)}>Review how Ara works with you <span>↗</span></button>
          </article>
        </section>

        <section className="blueprint-grid view-panel today-view" aria-label="Parallel capability foundations">
          <article className="blueprint-card ready">
            <span>08</span>
            <div><p>CONTROLLED CALENDAR</p><h3>Personal stays personal.</h3></div>
            <small>Privacy choice, useful notes, and no unnecessary agenda.</small>
          </article>
          <article className="blueprint-card ready">
            <span>09</span>
            <div><p>MEETING KNOWLEDGE</p><h3>{platformCapabilities.meetingKnowledge} records in Recall.</h3></div>
            <small>Transcripts become decisions, actions, risks, and open questions.</small>
          </article>
          <article className="blueprint-card ready">
            <span>10</span>
            <div><p>OWNERSHIP</p><h3>{platformCapabilities.ownedWork} owned · {platformCapabilities.dependencies} dependencies.</h3></div>
            <small>{platformCapabilities.pendingDelegations} proposed handoffs; Ara never takes someone else’s ownership.</small>
          </article>
          <article className="blueprint-card guarded">
            <span>11</span>
            <div><p>DESKTOP COMPANION</p><h3>Guarded by design.</h3></div>
            <small>{platformCapabilities.desktopRequests} prepared; signed local execution comes next.</small>
          </article>
          <article className="blueprint-card ready">
            <span>12</span>
            <div><p>OUTBOUND</p><h3>{microsoftSnapshot?.capabilities.outboundCommunication === "ready" ? "Outlook ready." : "Outlook available to enable."}</h3></div>
            <small>{platformCapabilities.outboundSent} sent · Teams stays draft-only until chat resolution is safe.</small>
          </article>
        </section>

        <section className="platform-grid view-panel today-view" aria-label="Parallel workspace">
          <article className="platform-card recall-card">
            <div className="platform-card-head">
              <span>⌕</span>
              <div>
                <p>RECALL · WORKING MEMORY</p>
                <h2>The context behind the work.</h2>
              </div>
            </div>
            <p>
              Ara can reconnect the email, file, meeting, person, and decision
              behind a request—so you do not have to remember where everything
              lives.
            </p>
            <div className="source-row">
              <span>Outlook</span>
              <span>Calendar</span>
              <span>SharePoint</span>
              <span>
                {microsoftSnapshot?.directoryPeople ?? 0} directory people
              </span>
            </div>
            <button className="card-link" onClick={() => moveToSection("recall")}>
              Open Recall workspace <span>↗</span>
            </button>
          </article>

          <article className="platform-card approvals-card">
            <div className="platform-card-head">
              <span>✓</span>
              <div>
                <p>APPROVALS · YOU STAY IN CONTROL</p>
                <h2>
                  {approvalWaiting
                    ? "One decision is waiting."
                    : "Nothing is waiting on you."}
                </h2>
              </div>
            </div>
            {(stage === "meetingReady" || stage === "meetingConflict") &&
            pendingMeeting ? (
              <div className="approval-summary">
                <b>{pendingMeeting.subject}</b>
                <span>
                  {stage === "meetingConflict"
                    ? "Conflict needs your choice · "
                    : `${pendingMeeting.attendees.length} attendees · `}
                  {pendingMeeting.displayTime}
                </span>
              </div>
            ) : stage === "documentReady" && pendingDocument ? (
              <div className="approval-summary">
                <b>{pendingDocument.title}</b>
                <span>SharePoint draft · not published</span>
              </div>
            ) : stage === "meetingUpdateReady" && pendingMeetingUpdate ? (
              <div className="approval-summary">
                <b>{pendingMeetingUpdate.subject}</b>
                <span>Invitation update · waiting for approval</span>
              </div>
            ) : stage === "ready" ? (
              <div className="approval-summary">
                <b>Message for {messageRecipient}</b>
                <span>{messageChannel} · prepared by Ara · not sent</span>
              </div>
            ) : (
              <p>
                Ara will prepare the work and bring you a clear recommendation
                before anything important goes out.
              </p>
            )}
            <button
              className="card-link"
              onClick={() =>
                approvalWaiting
                  ? moveToSection("ara")
                  : moveToSection("approvals")
              }
            >
              {approvalWaiting
                ? "Review with Ara"
                : "Open approvals workspace"}{" "}
              <span>↗</span>
            </button>
          </article>
        </section>

        <section className="attention-strip view-panel today-view">
          <div><span className="strip-number">{urgentAttention.toString().padStart(2, "0")}</span><p><b>Signals</b><small>deserve your attention</small></p></div>
          <div><span className="strip-number">{openCommitments.length.toString().padStart(2, "0")}</span><p><b>Commitments</b><small>still moving</small></p></div>
          <div><span className="strip-number">47m</span><p><b>Focus window</b><small>before your next meeting</small></p></div>
          <div className="principle"><ParallelMark /><p>Ara proposes.<br/><b>You decide.</b></p></div>
        </section>
      </section>
      </main>
    </>
  );
}
