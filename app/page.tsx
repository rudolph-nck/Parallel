"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Stage = "briefing" | "searching" | "found" | "ready" | "sent";
type VoiceState = "idle" | "connecting" | "listening" | "speaking" | "synced";

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
    output?: RealtimeFunctionCall[];
  };
};

const conversations = {
  briefing: {
    eyebrow: "Friday · Morning briefing",
    title: "Good morning, Nick.",
    body: "I reviewed your workspace. You have three decisions that deserve your attention, but we can start wherever you need.",
  },
  searching: {
    eyebrow: "Friday is consulting Recall",
    title: "I’m looking for your strategic plan.",
    body: "Recall is connecting the people, timing, conversations, and files around your request—not just matching a filename.",
  },
  found: {
    eyebrow: "Recall · Likely match",
    title: "I found the plan you’re probably referring to.",
    body: "It’s the newest version, you edited it Monday, and it appeared in your recent conversation with Matt.",
  },
  ready: {
    eyebrow: "Friday · Action prepared",
    title: "I’ve prepared the message for Matt.",
    body: "Nothing leaves Parallel until you approve it. You can review the recipient, channel, file, and exact wording first.",
  },
  sent: {
    eyebrow: "Friday · Complete",
    title: "Done. Matt has the current plan.",
    body: "I also taught Recall that “my strategic plan” means this document, so you won’t need to remember the path next time.",
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

export default function Home() {
  const [stage, setStage] = useState<Stage>("briefing");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceNote, setVoiceNote] = useState("Tap to let Friday hear your voice");
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [fridayTranscript, setFridayTranscript] = useState("");
  const quoteIndex = useSyncExternalStore(
    subscribeToLocalDate,
    getLocalDay,
    getServerDay,
  );
  const visualRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const inputAnimationRef = useRef<number | null>(null);
  const outputAnimationRef = useRef<number | null>(null);
  const transcriptRef = useRef("");
  const [message, setMessage] = useState(
    "Hi Matt — here is the latest version of the IT Core Strategic Plan we discussed."
  );
  const copy = conversations[stage];

  const askFriday = () => {
    setStage("searching");
    window.setTimeout(() => setStage("found"), 1250);
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

  const completeRecallSearch = (
    call: RealtimeFunctionCall,
    channel: RTCDataChannel,
  ) => {
    let query = "Nick's current strategic plan";
    try {
      const parsed = JSON.parse(call.arguments) as { query?: string };
      if (parsed.query) query = parsed.query;
    } catch {
      // The fallback query still gives Friday a useful, bounded prototype result.
    }

    setStage("searching");
    setVoiceNote("Friday is consulting Recall");

    window.setTimeout(() => {
      const result = {
        query,
        match: {
          title: "IT Core Strategic Plan 2027–2030",
          location: "IT Operations / Strategy / 2027 Planning",
          confidence: 0.94,
          edited: "Monday at 4:18 PM",
          context: "Discussed with Matt last week",
          status: "Most recent approved version",
        },
        source: "Parallel Recall prototype workspace catalog",
      };

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
      channel.send(JSON.stringify({ type: "response.create" }));
      setStage("found");
    }, 850);
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
        setVoiceNote("Speak naturally — Friday is listening");
        break;
      case "input_audio_buffer.speech_stopped":
        setVoiceNote("Friday is thinking");
        break;
      case "response.created":
        setVoiceNote("Friday is thinking");
        break;
      case "response.output_audio.delta":
        setVoiceState("speaking");
        setVoiceNote("Friday is responding");
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
        const functionCall = event.response?.output?.find(
          (item) =>
            item.type === "function_call" && item.name === "search_recall",
        );

        if (functionCall) {
          completeRecallSearch(functionCall, channel);
          return;
        }

        setVoiceState("synced");
        setVoiceNote("Friday is ready when you are");
        window.setTimeout(() => {
          if (peerRef.current?.connectionState === "connected") {
            setVoiceState("listening");
          }
        }, 900);
        break;
      }
      case "error":
        console.error("Realtime voice event error.", event.error);
        setVoiceNote("Friday missed that. Please try saying it again.");
        setVoiceState("listening");
        break;
    }
  };

  const startVoiceSession = async () => {
    if (peerRef.current || voiceState === "connecting") return;

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
        setVoiceConnected(true);
        setVoiceState("speaking");
        setVoiceNote("Friday is joining you");
        channel.send(
          JSON.stringify({
            type: "response.create",
            response: {
              input: [],
              instructions:
                "Greet Nick warmly in one brief sentence, then invite him to tell you what needs his attention.",
            },
          }),
        );
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const sessionResponse = await fetch("/api/realtime", {
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
          failure?.error ?? "Friday couldn't open a live voice session.",
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
            : "Friday couldn't start a voice conversation. Please try again.";
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
    idle: "Friday is ready",
    connecting: "Connecting privately",
    listening: "I’m listening",
    speaking: "Friday is responding",
    synced: "In sync",
  }[voiceState];

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Parallel home">
          <ParallelMark />
          <span>PARALLEL</span>
        </a>
        <div className="status-pill">
          <span className="status-dot" />
          Workspace connected
        </div>
        <button className="avatar" aria-label="Open profile">NR</button>
      </header>

      <aside className="sidebar">
        <nav aria-label="Primary navigation">
          <button className="nav-item active"><span>◫</span>Today</button>
          <button className="nav-item"><span>◉</span>Friday</button>
          <button className="nav-item"><span>⌕</span>Recall</button>
          <button className="nav-item"><span>✓</span>Approvals <b>2</b></button>
        </nav>
        <div className="sidebar-foot">
          <p>Connected systems</p>
          <div className="system-row"><span className="ms-icon">M</span>Microsoft 365 <i>Live</i></div>
          <div className="system-row"><span className="sn-icon">S</span>ServiceNow <i>Demo</i></div>
        </div>
      </aside>

      <section className="workspace">
        <div className="date-row">
          <div>
            <p>THURSDAY · JULY 30</p>
            <h1>Move through work with clarity.</h1>
          </div>
          <aside className="daily-quote">
            <span>Today’s perspective</span>
            <blockquote>“{dailyQuotes[quoteIndex].quote}”</blockquote>
            <cite>— {dailyQuotes[quoteIndex].author}</cite>
          </aside>
        </div>

        <section className={`friday-panel stage-${stage}`}>
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
                  ? "End voice conversation with Friday"
                  : "Start voice conversation with Friday"
              }
            >
              <span className="mic-icon">●</span>
              {voiceState === "connecting"
                ? "Connecting…"
                : voiceConnected
                  ? "End conversation"
                  : "Talk to Friday"}
            </button>
            <p className="voice-key">
              <span><i className="key-human" />You</span>
              <span><i className="key-friday" />Friday</span>
            </p>
            <p className="voice-note">{voiceNote}</p>
            {fridayTranscript && (
              <p className="voice-transcript" aria-live="polite">
                “{fridayTranscript}”
              </p>
            )}
          </div>

          <div className="conversation">
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2>{copy.title}</h2>
            <p className="conversation-copy">{copy.body}</p>

            {stage === "briefing" && (
              <div className="prompt-card">
                <p>Try asking Friday</p>
                <button onClick={askFriday}>
                  “Find my strategic plan in SharePoint and send the link to Matt through Teams.”
                  <span>↗</span>
                </button>
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

            {(stage === "found" || stage === "ready" || stage === "sent") && (
              <article className="document-card">
                <div className="file-icon">P</div>
                <div className="file-info">
                  <div className="confidence">94% CONFIDENCE</div>
                  <h3>IT Core Strategic Plan 2027–2030</h3>
                  <p>IT Operations / Strategy / 2027 Planning</p>
                  <div className="evidence">
                    <span>Edited by you Monday at 4:18 PM</span>
                    <span>Discussed with Matt last week</span>
                    <span>Most recent approved version</span>
                  </div>
                </div>
                <button className="open-file">Preview ↗</button>
              </article>
            )}

            {stage === "found" && (
              <div className="action-row">
                <button className="secondary" onClick={() => setStage("briefing")}>Not this one</button>
                <button className="primary" onClick={() => setStage("ready")}>Yes, prepare the message <span>→</span></button>
              </div>
            )}

            {(stage === "ready" || stage === "sent") && (
              <article className={`approval-card ${stage === "sent" ? "approved" : ""}`}>
                <div className="approval-head">
                  <div>
                    <p>{stage === "sent" ? "SENT THROUGH MICROSOFT TEAMS" : "YOUR APPROVAL IS REQUIRED"}</p>
                    <h3>{stage === "sent" ? "Message sent to Matt Walsh" : "Review before Friday acts"}</h3>
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
                  readOnly={stage === "sent"}
                />
                {stage === "ready" ? (
                  <div className="action-row">
                    <button className="secondary" onClick={() => setStage("found")}>Go back</button>
                    <button className="primary approve" onClick={() => setStage("sent")}>Approve and send <span>→</span></button>
                  </div>
                ) : (
                  <div className="audit-line"><span>✓</span> Approved by Nick · Recorded in activity history</div>
                )}
              </article>
            )}

            {stage === "sent" && (
              <button className="new-request" onClick={() => setStage("briefing")}>Start another request</button>
            )}
          </div>
        </section>

        <section className="attention-strip">
          <div><span className="strip-number">03</span><p><b>Decisions</b><small>need your judgment</small></p></div>
          <div><span className="strip-number">02</span><p><b>Approvals</b><small>waiting safely</small></p></div>
          <div><span className="strip-number">47m</span><p><b>Focus window</b><small>before your next meeting</small></p></div>
          <div className="principle"><ParallelMark /><p>Friday proposes.<br/><b>You decide.</b></p></div>
        </section>
      </section>
    </main>
  );
}
