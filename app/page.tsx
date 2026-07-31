"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  connectMicrosoft365,
  createMicrosoftMeeting,
  disconnectMicrosoft365,
  prepareMicrosoftMeeting,
  refreshMicrosoft365,
  restoreMicrosoft365,
  searchMicrosoft365Files,
  type MicrosoftMeetingProposal,
  type MicrosoftMeetingResult,
  type MicrosoftSnapshot,
} from "./lib/microsoft-365";

type Stage =
  | "briefing"
  | "searching"
  | "found"
  | "ready"
  | "approved"
  | "meetingReady"
  | "meetingBooked";
type VoiceState = "idle" | "connecting" | "listening" | "speaking" | "synced";
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
type UserProfile = Partial<Record<PreferenceCategory, string>>;

type RecallDocument = {
  title: string;
  location: string;
  confidence: number;
  edited: string;
  context: string;
  status: string;
  webUrl?: string | null;
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
  response?: {
    output?: Array<RealtimeFunctionCall | { type: string }>;
  };
};

const conversations = {
  briefing: {
    eyebrow: "Ara · Morning briefing",
    title: "Good morning, Nick.",
    body: "I reviewed your workspace. You have three decisions that deserve your attention, but we can start wherever you need.",
  },
  searching: {
    eyebrow: "Ara is consulting Recall",
    title: "I’m looking for your strategic plan.",
    body: "Recall is connecting the people, timing, conversations, and files around your request—not just matching a filename.",
  },
  found: {
    eyebrow: "Recall · Likely match",
    title: "I found the plan you’re probably referring to.",
    body: "It’s the newest version, you edited it Monday, and it appeared in your recent conversation with Matt.",
  },
  ready: {
    eyebrow: "Ara · Ready when you are",
    title: "I have it ready for Matt.",
    body: "I found the right plan and drafted a short Teams note. Take a look—how does that sound?",
  },
  approved: {
    eyebrow: "Ara · In sync",
    title: "Perfect—I’ve got it.",
    body: "Your go-ahead is recorded. Once Teams is connected, Ara will take it from here.",
  },
  meetingReady: {
    eyebrow: "Ara · Calendar proposal",
    title: "I found a clear opening.",
    body: "I resolved the attendees and checked your calendar. Review the Teams meeting below—how does that sound?",
  },
  meetingBooked: {
    eyebrow: "Ara · Meeting booked",
    title: "Done—it’s on the calendar.",
    body: "The Teams meeting is live and invitations have been sent to everyone listed below.",
  },
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
const WELCOME_STORAGE_KEY = "parallel:ara-welcomed";
const defaultIntroduction =
  "Hey Nick—I’m Ara. I’m genuinely excited to start working with you. Think of me as the calm, connected friend who helps you make sense of the noise and get the right things moving. Before we dive in, what would make today feel like a win?";
const capabilityIntroduction =
  "Nick asked what he can ask you. Give him an energizing, conversational tour of four or five surprisingly useful ways you can help across his work, grounded in your actual capabilities. End by asking which one would make his day easier right now.";

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
  const [firstVisit, setFirstVisit] = useState(true);
  const [activeNav, setActiveNav] = useState<NavSection>("today");
  const [profileOpen, setProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [todayLabel, setTodayLabel] = useState("TODAY");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceNote, setVoiceNote] = useState("Tap to let Ara hear your voice");
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [fridayTranscript, setFridayTranscript] = useState("");
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
  const [pendingMeeting, setPendingMeeting] =
    useState<MicrosoftMeetingProposal | null>(null);
  const [bookedMeeting, setBookedMeeting] =
    useState<MicrosoftMeetingResult | null>(null);
  const [meetingActionPending, setMeetingActionPending] = useState(false);
  const quoteIndex = useSyncExternalStore(
    subscribeToLocalDate,
    getLocalDay,
    getServerDay,
  );
  const visualRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Stage>("briefing");
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const inputAnimationRef = useRef<number | null>(null);
  const outputAnimationRef = useRef<number | null>(null);
  const transcriptRef = useRef("");
  const microsoftSnapshotRef = useRef<MicrosoftSnapshot | null>(null);
  const pendingMeetingRef = useRef<MicrosoftMeetingProposal | null>(null);
  const initialResponseRef = useRef<string | null>(null);
  const [message, setMessage] = useState(
    "Hi Matt — here is the latest version of the IT Core Strategic Plan we discussed."
  );
  const copy = conversations[stage];

  const rememberMicrosoftSnapshot = (snapshot: MicrosoftSnapshot | null) => {
    microsoftSnapshotRef.current = snapshot;
    setMicrosoftSnapshot(snapshot);
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
    window.localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(nextProfile),
    );
    return nextProfile;
  };

  const moveToSection = (section: NavSection) => {
    setActiveNav(section);
    document
      .getElementById(section)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const askFriday = () => {
    moveToStage("searching");
    window.setTimeout(() => moveToStage("found"), 1250);
  };

  const setMicrophoneEnabled = (enabled: boolean) => {
    streamRef.current
      ?.getAudioTracks()
      .forEach((track) => {
        track.enabled = enabled;
      });
  };

  const stopVoiceSession = (note = "Tap to start a new conversation") => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
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

    visualRef.current?.style.setProperty("--human-height", "46px");
    visualRef.current?.style.setProperty("--friday-height", "50px");
    transcriptRef.current = "";
    setVoiceConnected(false);
    setVoiceState("idle");
    setVoiceNote(note);
  };

  const startLevelVisualizer = (
    stream: MediaStream,
    property: "--human-height" | "--friday-height",
    contextRef: React.MutableRefObject<AudioContext | null>,
    frameRef: React.MutableRefObject<number | null>,
  ) => {
    const audioContext = new AudioContext();
    contextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.68;
    source.connect(analyser);
    const levels = new Uint8Array(analyser.frequencyBinCount);

    const readLevel = () => {
      analyser.getByteFrequencyData(levels);
      const average =
        levels.reduce((total, level) => total + level, 0) / levels.length;
      const energy = Math.min(1, average / 58);
      visualRef.current?.style.setProperty(
        property,
        `${46 + energy * 50}px`,
      );
      frameRef.current = window.requestAnimationFrame(readLevel);
    };

    readLevel();
  };

  const parseFunctionArguments = (call: RealtimeFunctionCall) => {
    try {
      return JSON.parse(call.arguments) as Record<string, unknown>;
    } catch {
      return {};
    }
  };

  const runFridayFunction = async (call: RealtimeFunctionCall) => {
    const args = parseFunctionArguments(call);

    if (call.name === "search_recall") {
      const query =
        typeof args.query === "string"
          ? args.query
          : "Nick's current strategic plan";
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
                "Tell Nick briefly that you checked his connected Microsoft 365 workspace but did not find a matching file yet. Do not invent a result.",
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
              "Tell Nick briefly that Microsoft 365 is connected but the search could not complete just now, and suggest trying again.",
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
            "Tell Nick Microsoft 365 still needs to be connected from the dashboard before you can check it.",
        };
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
            .slice(0, 5)
            .map((event) => ({
              subject: event.subject || "(No title)",
              start: event.start?.dateTime,
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
            "Summarize only what is relevant to Nick's request. If the mailbox or calendar has zero items, say the connected demo tenant is currently empty rather than saying Microsoft 365 is unavailable. If file_search_available is false, explain only that SharePoint search was unavailable; the other returned data is still live. Keep the spoken response concise and do not claim to have sent, changed, or deleted anything.",
        };
      } catch {
        return {
          connected: true,
          temporarily_unavailable: true,
          instruction:
            "Tell Nick briefly that Microsoft 365 is connected but could not be refreshed just now.",
        };
      }
    }

    if (call.name === "prepare_calendar_meeting") {
      if (!microsoftSnapshotRef.current) {
        return {
          status: "not_connected",
          instruction:
            "Tell Nick Microsoft 365 needs to be connected before you can check his calendar or prepare the meeting.",
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
      const requestedDuration =
        typeof args.duration_minutes === "number"
          ? args.duration_minutes
          : 30;

      setVoiceNote("Ara is resolving people and checking your calendar");
      try {
        const preparation = await prepareMicrosoftMeeting({
          subject,
          attendeeNames,
          deadlineDescription,
          durationMinutes: requestedDuration,
          purpose,
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
                ? "Tell Nick the Microsoft company directory needs to reconnect before you can safely resolve the attendee names. Do not ask him to spell every email unless reconnecting fails."
                : "Ask Nick which person he means only when a name is genuinely ambiguous. If no candidate exists, ask naturally for that person's work email. Do not guess and do not claim the meeting is scheduled.",
          };
        }

        pendingMeetingRef.current = preparation.proposal;
        setPendingMeeting(preparation.proposal);
        setBookedMeeting(null);
        setApprovalMethod(null);
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
          teams_meeting: true,
          approval_required: true,
          instruction:
            "Briefly summarize the meeting, attendees, and proposed time in a natural way. End with 'How does that sound?' Do not say it has been scheduled yet.",
        };
      } catch (error) {
        const detail =
          error instanceof Error ? error.message : "The calendar check failed.";
        return {
          status: "could_not_prepare",
          detail,
          instruction:
            "Tell Nick briefly that you could not prepare a safe calendar option yet. If the detail says the deadline passed or no slot was found, explain that plainly; otherwise suggest reconnecting Microsoft 365 and trying again.",
        };
      }
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
        /\b(that works|that sounds good|looks good|go ahead|let'?s do it|make it happen)\b/i.test(
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

      if (!isExplicitApproval) {
        return {
          meeting_created: false,
          reason:
            "Nick's intent was not clear enough to create and send the invitation. Briefly ask whether he wants you to book the proposed Teams meeting; do not give him a required phrase.",
        };
      }

      setMeetingActionPending(true);
      setVoiceNote("Ara is creating the Teams meeting");
      try {
        const result = await createMicrosoftMeeting(
          pendingMeetingRef.current,
        );
        setBookedMeeting(result);
        setApprovalMethod("voice");
        moveToStage("meetingBooked");
        const snapshot = await refreshMicrosoft365().catch(() => null);
        if (snapshot) rememberMicrosoftSnapshot(snapshot);
        return {
          meeting_created: true,
          subject: result.subject,
          start: result.start,
          attendees: result.attendees.map((attendee) => attendee.displayName),
          teams_join_url_available: Boolean(result.joinUrl),
          calendar_link_available: Boolean(result.webLink),
          instruction:
            "Confirm naturally in one brief sentence that the Teams meeting is now on Nick's calendar and the invitations were sent.",
        };
      } catch (error) {
        const detail =
          error instanceof Error
            ? error.message
            : "Microsoft 365 could not create the event.";
        return {
          meeting_created: false,
          detail,
          instruction:
            "Tell Nick briefly that the meeting was not created. Suggest reconnecting Microsoft 365 if access needs attention, and never claim invitations were sent.",
        };
      } finally {
        setMeetingActionPending(false);
      }
    }

    if (call.name === "prepare_message_for_approval") {
      const proposedMessage =
        typeof args.message === "string" && args.message.trim()
          ? args.message.trim()
          : "Hi Matt — here is the latest version of the IT Core Strategic Plan we discussed.";
      setMessage(proposedMessage);
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
          "Give Nick a brief natural summary in your own words, end with 'How does that sound?', and let him respond naturally. Do not tell him to say a specific phrase.",
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
            "Nick's intent was not clear enough to proceed. Briefly ask whether he wants you to send the message you just summarized; do not give him a required phrase.",
        };
      }

      setApprovalMethod("voice");
      moveToStage("approved");
      return {
        approval_recorded: true,
        approval_method: "voice",
        confirmation,
        execution_status: "not_sent_prototype",
        instruction:
          "Respond naturally in one sentence: confirm you have Nick's go-ahead and say you'll take it from here once Teams is connected. Do not say an external message was sent.",
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

    return {
      error: `Unsupported Ara capability: ${call.name}`,
    };
  };

  const completeFunctionCalls = async (
    calls: RealtimeFunctionCall[],
    channel: RTCDataChannel,
  ) => {
    for (const call of calls) {
      const result = await runFridayFunction(call);
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
    }

    if (channel.readyState === "open") {
      channel.send(JSON.stringify({ type: "response.create" }));
    }
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
      case "input_audio_buffer.speech_started":
        transcriptRef.current = "";
        setFridayTranscript("");
        setVoiceState("listening");
        setVoiceNote("Speak naturally — Ara is listening");
        break;
      case "input_audio_buffer.speech_stopped":
        setMicrophoneEnabled(false);
        setVoiceNote("Ara is thinking");
        break;
      case "response.created":
        setMicrophoneEnabled(false);
        setVoiceNote("Ara is thinking");
        break;
      case "response.output_audio.delta":
        setMicrophoneEnabled(false);
        setVoiceState("speaking");
        setVoiceNote("Ara is responding — your mic is paused");
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
        break;
      case "response.done": {
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

        setVoiceState("synced");
        setVoiceNote("Ara is ready when you are");
        window.setTimeout(() => {
          if (peerRef.current?.connectionState === "connected") {
            setMicrophoneEnabled(true);
            setVoiceState("listening");
          }
        }, 900);
        break;
      }
      case "error":
        console.error("Realtime voice event error.", event.error);
        setMicrophoneEnabled(true);
        setVoiceNote("Ara missed that. Please try saying it again.");
        setVoiceState("listening");
        break;
    }
  };

  const startVoiceSession = async (openingInstruction?: string) => {
    if (peerRef.current || voiceState === "connecting") return;

    initialResponseRef.current = openingInstruction ?? null;
    setVoiceState("connecting");
    setVoiceNote("Opening a private voice connection");
    setFridayTranscript("");

    try {
      const peer = new RTCPeerConnection();
      peerRef.current = peer;

      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.playsInline = true;
      remoteAudioRef.current = audio;

      peer.ontrack = (event) => {
        const remoteStream = event.streams[0];
        audio.srcObject = remoteStream;
        void audio.play().catch(() => {
          setVoiceNote("Audio playback was blocked by the browser");
        });
        startLevelVisualizer(
          remoteStream,
          "--friday-height",
          outputContextRef,
          outputAnimationRef,
        );
      };

      peer.onconnectionstatechange = () => {
        if (["failed", "disconnected", "closed"].includes(peer.connectionState)) {
          stopVoiceSession("The voice connection ended. Tap to reconnect.");
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      startLevelVisualizer(
        stream,
        "--human-height",
        inputContextRef,
        inputAnimationRef,
      );

      const channel = peer.createDataChannel("oai-events");
      channelRef.current = channel;
      channel.onmessage = (event) => handleRealtimeEvent(event, channel);
      channel.onopen = () => {
        setMicrophoneEnabled(false);
        setVoiceConnected(true);
        setVoiceState("speaking");
        setVoiceNote("Ara is joining you");
        const knownPreferences = Object.entries(userProfile)
          .filter(([, value]) => value.trim())
          .map(([category, value]) => `${category}: ${value}`)
          .join("; ");
        const opening =
          initialResponseRef.current ??
          (firstVisit
            ? `Introduce yourself by saying this naturally in your own voice: "${defaultIntroduction}"`
            : "Greet Nick warmly in one brief sentence, then invite him to tell you what needs his attention.");
        channel.send(
          JSON.stringify({
            type: "response.create",
            response: {
              input: [],
              instructions: knownPreferences
                ? `${opening} Known preferences to respect: ${knownPreferences}.`
                : opening,
            },
          }),
        );
        initialResponseRef.current = null;
        if (firstVisit) {
          window.localStorage.setItem(WELCOME_STORAGE_KEY, "true");
          setFirstVisit(false);
        }
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
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Microphone access is needed to hear you"
          : error instanceof Error
            ? error.message
            : "Ara couldn't start a voice conversation. Please try again.";
      stopVoiceSession(note);
    }
  };

  const toggleVoiceSession = () => {
    if (voiceConnected || peerRef.current) {
      stopVoiceSession();
    } else {
      void startVoiceSession();
    }
  };

  const askAraWhatSheCanDo = () => {
    setActiveNav("ara");
    if (channelRef.current?.readyState === "open") {
      setMicrophoneEnabled(false);
      setVoiceState("speaking");
      setVoiceNote("Ara is showing you what’s possible");
      channelRef.current.send(
        JSON.stringify({
          type: "response.create",
          response: {
            input: [],
            instructions: capabilityIntroduction,
          },
        }),
      );
      return;
    }

    void startVoiceSession(capabilityIntroduction);
  };

  const meetAra = () => {
    setActiveNav("ara");
    void startVoiceSession(
      `Introduce yourself by saying this naturally in your own voice: "${defaultIntroduction}"`,
    );
  };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const startupTimer = window.setTimeout(
      () => setShowStartup(false),
      prefersReducedMotion ? 250 : 2300,
    );

    const hydrateTimer = window.setTimeout(() => {
      setFirstVisit(
        window.localStorage.getItem(WELCOME_STORAGE_KEY) !== "true",
      );
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
        ) as UserProfile;
        setUserProfile(savedProfile);
      } catch {
        setUserProfile({});
      }
    }, 0);

    return () => {
      window.clearTimeout(startupTimer);
      window.clearTimeout(hydrateTimer);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const restoreTimeout = new Promise<never>((_, reject) => {
      window.setTimeout(
        () => reject(new Error("Microsoft 365 restore timed out.")),
        6500,
      );
    });

    void Promise.race([restoreMicrosoft365(), restoreTimeout])
      .then((snapshot) => {
        if (!active) return;
        if (snapshot) {
          rememberMicrosoftSnapshot(snapshot);
          setMicrosoftStatus("connected");
          setMicrosoftNote("Read access is live · calendar actions need your approval");
        } else {
          setMicrosoftStatus("disconnected");
          setMicrosoftNote("Ready for your approval");
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
  }, []);

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
    speaking: "Ara is responding",
    synced: "In sync",
  }[voiceState];

  const approveWithButton = () => {
    setApprovalMethod("button");
    moveToStage("approved");
  };

  const approveMeetingWithButton = async () => {
    if (!pendingMeetingRef.current || meetingActionPending) return;

    setMeetingActionPending(true);
    setVoiceNote("Ara is creating the Teams meeting");
    try {
      const result = await createMicrosoftMeeting(pendingMeetingRef.current);
      setBookedMeeting(result);
      setApprovalMethod("button");
      moveToStage("meetingBooked");
      setVoiceNote("The Teams meeting is on your calendar");
      const snapshot = await refreshMicrosoft365().catch(() => null);
      if (snapshot) rememberMicrosoftSnapshot(snapshot);
    } catch {
      setVoiceNote(
        "The meeting was not created. Reconnect Microsoft 365 and try again.",
      );
    } finally {
      setMeetingActionPending(false);
    }
  };

  const startAnotherRequest = () => {
    pendingMeetingRef.current = null;
    setPendingMeeting(null);
    setBookedMeeting(null);
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
      setMicrosoftNote("Read access is live · calendar actions need your approval");
    } catch {
      setMicrosoftStatus("error");
      setMicrosoftNote("Microsoft 365 needs your attention to reconnect");
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

  return (
    <>
      {showStartup && (
        <div className="startup-screen" role="status" aria-label="Opening Parallel">
          <div className="startup-aura" aria-hidden="true" />
          <div className="startup-identity">
            <ParallelMark />
            <ParallelWordmark />
          </div>
          <div className="startup-signal" aria-hidden="true">
            <i />
            <i />
          </div>
          <p>Thoughtful work, already in motion.</p>
        </div>
      )}
      <main className={`app-shell ${showStartup ? "app-loading" : "app-ready"}`}>
      <header className="topbar">
        <a className="brand" href="#" aria-label="Parallel home">
          <ParallelMark />
          <ParallelWordmark />
        </a>
        <div className="status-pill">
          <span className={`status-dot ${microsoftConnected ? "" : "waiting"}`} />
          {microsoftConnected ? "Microsoft 365 connected" : "Workspace ready"}
        </div>
        <button
          className={`avatar ${profileOpen ? "active" : ""}`}
          aria-label="Open profile"
          aria-expanded={profileOpen}
          onClick={() => setProfileOpen((open) => !open)}
        >
          NR
        </button>
      </header>

      <aside className="sidebar">
        <nav aria-label="Primary navigation">
          <button
            className={`nav-item ${activeNav === "today" ? "active" : ""}`}
            onClick={() => moveToSection("today")}
          >
            <span>◫</span>Today
          </button>
          <button
            className={`nav-item ${activeNav === "ara" ? "active" : ""}`}
            onClick={() => moveToSection("ara")}
          >
            <span>◉</span>Ara
          </button>
          <button
            className={`nav-item ${activeNav === "recall" ? "active" : ""}`}
            onClick={() => moveToSection("recall")}
          >
            <span>⌕</span>Recall
          </button>
          <button
            className={`nav-item ${activeNav === "approvals" ? "active" : ""}`}
            onClick={() => moveToSection("approvals")}
          >
            <span>✓</span>Approvals
            {(stage === "ready" || stage === "meetingReady") && <b>1</b>}
          </button>
        </nav>
        <div className="sidebar-foot">
          <p>Connected systems</p>
          <button
            className="system-row system-button"
            onClick={
              microsoftConnected
                ? refreshMicrosoft
                : connectMicrosoft
            }
            disabled={microsoftActionPending}
          >
            <span className="ms-icon">M</span>
            Microsoft 365
            <i>{microsoftConnected ? "Live" : "Connect"}</i>
          </button>
          <div className="system-row"><span className="sn-icon">S</span>ServiceNow <i>Demo</i></div>
        </div>
      </aside>

      <section className="workspace" id="today">
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
                onChange={(event) =>
                  rememberUserPreference(
                    "morning_briefing_time",
                    event.target.value,
                  )
                }
              />
            </label>
            <label>
              What needs most of your attention?
              <input
                value={userProfile.current_priorities ?? ""}
                placeholder="My team, customers, and major projects"
                onChange={(event) =>
                  rememberUserPreference(
                    "current_priorities",
                    event.target.value,
                  )
                }
              />
            </label>
            <label>
              How should Ara work with you?
              <select
                value={userProfile.proactivity ?? ""}
                onChange={(event) =>
                  rememberUserPreference("proactivity", event.target.value)
                }
              >
                <option value="">Choose a style</option>
                <option value="Quiet unless something is urgent">Quiet</option>
                <option value="Balanced and thoughtful">Balanced</option>
                <option value="Proactive—surface things early">Proactive</option>
              </select>
            </label>
            <p className="profile-note">
              Saved privately on this device. Ara will learn naturally as you
              work together.
            </p>
          </aside>
        )}
        <div className="date-row">
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
          className={`microsoft-connection microsoft-${microsoftStatus}`}
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
                ? `${microsoftSnapshot.account.name} is connected`
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
            </div>
          ) : (
            <p className="connection-boundary">
              Ara can read what you can see and book calendar meetings after
              you approve them. Messages, file edits, and deletions remain off.
            </p>
          )}

          <div className="connection-actions">
            {microsoftConnected ? (
              <>
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

        <section className={`friday-panel stage-${stage}`} id="ara">
          <div ref={visualRef} className={`friday-visual voice-${voiceState}`}>
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
                ? "Connecting…"
                : voiceConnected
                  ? "End conversation"
                  : "Talk to Ara"}
            </button>
            <p className="voice-key">
              <span><i className="key-human" />You</span>
              <span><i className="key-friday" />Ara</span>
            </p>
            <p className="noise-filter">
              <span aria-hidden="true">◇</span>
              Noise filter on · mic pauses while Ara speaks
            </p>
            <p className="voice-note">{voiceNote}</p>
            {fridayTranscript && (
              <p className="voice-transcript" aria-live="polite">
                “{fridayTranscript}”
              </p>
            )}
          </div>

          <div className="conversation">
            {firstVisit ? (
              <>
                <p className="eyebrow">ARA · NICE TO MEET YOU</p>
                <h2>Hey Nick—I’m really glad you’re here.</h2>
                <p className="conversation-copy">
                  Think of me as the calm, connected friend who helps you find
                  the signal, make the call, and keep work moving without
                  carrying all of it alone.
                </p>
                <div className="welcome-actions">
                  <button className="primary meet-ara" onClick={meetAra}>
                    Meet Ara <span>→</span>
                  </button>
                  <button
                    className="secondary"
                    onClick={askAraWhatSheCanDo}
                  >
                    What can I ask you?
                  </button>
                </div>
                <p className="welcome-note">
                  A conversation—not a setup wizard. Ara will get to know you
                  naturally over time.
                </p>
              </>
            ) : (
              <>
                <p className="eyebrow">{copy.eyebrow}</p>
                <h2>{copy.title}</h2>
                <p className="conversation-copy">{copy.body}</p>
              </>
            )}

            {stage === "briefing" && !firstVisit && (
              <div className="prompt-card">
                <p>Try asking Ara</p>
                <div className="prompt-actions">
                  <button onClick={askAraWhatSheCanDo}>
                    “What can I ask you that I might not think of?”
                    <span>↗</span>
                  </button>
                  <button onClick={askFriday}>
                    “Find my strategic plan and reconnect the surrounding
                    context.”
                    <span>↗</span>
                  </button>
                </div>
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
              (stage === "meetingReady" || stage === "meetingBooked") && (
                <article
                  className={`meeting-card ${stage === "meetingBooked" ? "booked" : ""}`}
                >
                  <div className="meeting-head">
                    <div>
                      <p>
                        {stage === "meetingBooked"
                          ? "TEAMS MEETING · BOOKED"
                          : "PROPOSED TEAMS MEETING"}
                      </p>
                      <h3>{pendingMeeting.subject}</h3>
                    </div>
                    <span className="teams-badge">T</span>
                  </div>

                  <div className="meeting-time">
                    <span className="calendar-glyph">
                      {new Date(pendingMeeting.start).getDate()}
                    </span>
                    <div>
                      <b>{pendingMeeting.displayTime}</b>
                      <small>
                        {pendingMeeting.durationMinutes} minutes · Microsoft
                        Teams
                      </small>
                    </div>
                  </div>

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

                  {pendingMeeting.purpose && (
                    <p className="meeting-purpose">{pendingMeeting.purpose}</p>
                  )}

                  {stage === "meetingReady" ? (
                    <>
                      <p className="voice-approval-hint">
                        Respond naturally—“That works, book it.”
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
                            : "Book Teams meeting"}{" "}
                          <span>→</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="audit-line">
                        <span>✓</span> Nick approved{" "}
                        {approvalMethod === "voice" ? "by voice" : "with a tap"}{" "}
                        · Invitations sent
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
                  <span className="teams-badge">T</span>
                </div>
                <div className="recipient">
                  <span className="mini-avatar">MW</span>
                  <div><b>Matt Walsh</b><small>Microsoft Teams · Direct message</small></div>
                </div>
                <textarea
                  aria-label="Message to Matt"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
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
                    <span>✓</span> Nick said it sounded good {approvalMethod === "voice" ? "by voice" : "with a tap"} · Ready for the Teams connection
                  </div>
                )}
              </article>
            )}

            {(stage === "approved" || stage === "meetingBooked") && (
              <button className="new-request" onClick={startAnotherRequest}>Start another request</button>
            )}
          </div>
        </section>

        <section className="platform-grid" aria-label="Parallel workspace">
          <article className="platform-card recall-card" id="recall">
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
            <button className="card-link" onClick={askFriday}>
              Ask Ara to find the missing context <span>↗</span>
            </button>
          </article>

          <article className="platform-card approvals-card" id="approvals">
            <div className="platform-card-head">
              <span>✓</span>
              <div>
                <p>APPROVALS · YOU STAY IN CONTROL</p>
                <h2>
                  {stage === "meetingReady" || stage === "ready"
                    ? "One decision is waiting."
                    : "Nothing is waiting on you."}
                </h2>
              </div>
            </div>
            {stage === "meetingReady" && pendingMeeting ? (
              <div className="approval-summary">
                <b>{pendingMeeting.subject}</b>
                <span>
                  {pendingMeeting.attendees.length} attendees ·{" "}
                  {pendingMeeting.displayTime}
                </span>
              </div>
            ) : stage === "ready" ? (
              <div className="approval-summary">
                <b>Message for Matt</b>
                <span>Prepared by Ara · not sent</span>
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
                stage === "meetingReady" || stage === "ready"
                  ? moveToSection("ara")
                  : askAraWhatSheCanDo()
              }
            >
              {stage === "meetingReady" || stage === "ready"
                ? "Review with Ara"
                : "See what Ara can prepare"}{" "}
              <span>↗</span>
            </button>
          </article>
        </section>

        <section className="attention-strip">
          <div><span className="strip-number">03</span><p><b>Decisions</b><small>need your judgment</small></p></div>
          <div><span className="strip-number">02</span><p><b>Approvals</b><small>waiting safely</small></p></div>
          <div><span className="strip-number">47m</span><p><b>Focus window</b><small>before your next meeting</small></p></div>
          <div className="principle"><ParallelMark /><p>Ara proposes.<br/><b>You decide.</b></p></div>
        </section>
      </section>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {(["today", "ara", "recall", "approvals"] as NavSection[]).map(
          (section) => (
            <button
              key={section}
              className={activeNav === section ? "active" : ""}
              onClick={() => moveToSection(section)}
            >
              <span>
                {section === "today"
                  ? "◫"
                  : section === "ara"
                    ? "◉"
                    : section === "recall"
                      ? "⌕"
                      : "✓"}
              </span>
              {section}
            </button>
          ),
        )}
      </nav>
      </main>
    </>
  );
}
