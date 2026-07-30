"use client";

import { useState } from "react";

type Stage = "briefing" | "searching" | "found" | "ready" | "sent";

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
  const [message, setMessage] = useState(
    "Hi Matt — here is the latest version of the IT Core Strategic Plan we discussed."
  );
  const copy = conversations[stage];

  const askFriday = () => {
    setStage("searching");
    window.setTimeout(() => setStage("found"), 1250);
  };

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
            <h1>Your attention, clarified.</h1>
          </div>
          <button className="quiet-button">•••</button>
        </div>

        <section className={`friday-panel stage-${stage}`}>
          <div className="friday-visual" aria-hidden="true">
            <div className="orb">
              <div className="orb-core"><ParallelMark /></div>
            </div>
            <span>{stage === "searching" ? "Consulting Recall" : stage === "sent" ? "Listening" : "Friday is ready"}</span>
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
