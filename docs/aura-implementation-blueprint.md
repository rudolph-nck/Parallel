# Parallel + Aura — Foundational Product and Implementation Blueprint for Codex

**Version 4.0 — North-Star Architecture Edition**

This document is the permanent product, architecture, governance, and implementation source of truth for Parallel and Aura. Codex must read the foundational sections before proposing or implementing changes.

---

## Part I — Parallel North Star

### 1. Category Definition

**Parallel is the operating system for the human + AI workforce.**

Parallel is not merely an assistant, chatbot, voice interface, workflow tool, or collection of agents. It is the enterprise management and operating layer through which organizations can design, onboard, govern, coordinate, measure, and improve human and AI work together.

People should not simply install software in Parallel.

> **They should be able to hire, manage, and collaborate with digital coworkers.**

### 2. Mission

Parallel enables organizations to build a coordinated workforce in which humans and AI employees work together with clear roles, authority, goals, memory, accountability, and governance.

Parallel exists to help people:

- focus on the work that truly needs them;
- make better decisions with the right context;
- reduce forgotten commitments and duplicated effort;
- preserve organizational knowledge;
- coordinate work across people, systems, and AI employees;
- understand how the organization actually operates;
- safely delegate appropriate work to AI;
- measure whether AI is creating meaningful value;
- simulate organizational change before acting.

### 3. Ara’s Role

**Ara is the first AI employee in Parallel.**

Ara’s initial role is **AI Chief of Staff**. She protects the user’s attention, understands priorities, prepares decisions, orchestrates meetings, tracks commitments, coordinates follow-through, preserves relevant knowledge, and holds the user accountable to the goals they declared.

Ara is not the whole of Parallel. She is the first proof that Parallel can create a trusted, governed, role-based AI coworker.

### 4. The Long-Term Product

Over time, organizations should be able to create additional AI employees, such as:

- AI Chief of Staff;
- AI Project Manager;
- AI Knowledge Manager;
- AI Operations Analyst;
- AI Research Analyst;
- AI Finance Analyst;
- AI Change Manager;
- AI Infrastructure or Service Operations Analyst;
- organization-specific AI roles.

Every AI employee must have:

- a unique identity;
- a role and job description;
- a department;
- a human manager or accountable owner;
- responsibilities;
- goals and KPIs;
- permissions and authority;
- accessible knowledge domains;
- memory boundaries;
- assigned systems and tools;
- workload and status;
- cost and usage records;
- quality and performance metrics;
- an audit history;
- training and policy versions;
- escalation and delegation rules.

### 5. Human + AI Organization Model

Parallel must support a unified organization model containing:

- people;
- AI employees;
- teams;
- departments;
- reporting lines;
- roles;
- responsibilities;
- decision rights;
- delegation relationships;
- systems;
- processes;
- policies;
- projects;
- goals;
- KPIs;
- risks;
- commitments;
- knowledge;
- meetings;
- workflows;
- dependencies.

A manager should eventually be able to see both **human coworkers** and **AI coworkers** within the same governed operating structure without confusing the two.

### 6. Organizational Intelligence

Parallel should develop an organizational model that understands:

- mission, vision, and values;
- strategy and annual priorities;
- organizational structure;
- responsibilities and decision authority;
- policies and procedures;
- systems and data;
- meetings and decisions;
- projects and dependencies;
- risks and controls;
- budgets and resource constraints;
- performance measures;
- institutional knowledge;
- communication and operating rhythms.

This model should become the context through which AI employees reason. They should not operate only from generic model knowledge.

### 7. Organizational Digital Twin

The long-term destination is a governed **digital twin of the organization**: a continuously updated representation of how the business is structured, how work moves, where knowledge lives, who owns decisions, and where risks or bottlenecks exist.

The digital twin must be evidence-based, permission-aware, explainable, and separated from speculative model output.

### 8. Simulation Engine

Once the organization model is sufficiently mature, Parallel should help leaders explore questions such as:

- What breaks if a critical employee leaves?
- Which services have single points of dependency?
- What happens if the company acquires another organization?
- Which teams become bottlenecks if volume increases?
- What work should be automated, delegated, reassigned, or staffed?
- What are the likely consequences of changing a process or policy?
- Which AI employee would produce the greatest measurable benefit?
- What risks emerge if a system, vendor, or role becomes unavailable?

Simulation outputs must state assumptions, evidence, confidence, and uncertainty. They must never be presented as guaranteed outcomes.

### 9. Product Evolution

```text
Phase 1  — Personal AI Chief of Staff
Phase 2  — Proactive attention and accountability system
Phase 3  — Knowledge-aware meeting and workflow orchestration
Phase 4  — Multi-user coordination with personal AI coworkers
Phase 5  — Department-level AI workforce
Phase 6  — Enterprise AI workforce management
Phase 7  — Organizational digital twin
Phase 8  — Organizational simulation and continuous optimization
```

Each phase must create immediate value while preserving the architectural path to later phases.

---

## Part II — The Parallel Constitution

These principles are non-negotiable. Product features and implementation decisions must be evaluated against them.

### Article I — Human Accountability

AI may augment judgment, prepare decisions, recommend actions, and perform approved work. Humans and organizations remain accountable for consequential decisions.

### Article II — Defined Employment Context

Every AI employee must have an identifiable role, manager or accountable owner, responsibilities, authority, knowledge scope, and measurable expectations.

### Article III — Least Privilege

AI employees receive only the data and capabilities required for their role. Access must be scoped by tenant, user, role, device, application, resource, and action.

### Article IV — Explainable Action

Every material recommendation and action must be explainable. Parallel must preserve the evidence, rules, context, model calls, permissions, and reasoning path that led to the outcome.

### Article V — Governed Autonomy

Autonomy is granted by policy, not assumed by the model. Actions must operate within explicit modes: observe, recommend, prepare, confirm then act, act within guardrails, or prohibited.

### Article VI — No Silent Duplication

AI employees must coordinate through shared action records and ownership rules. They must not independently duplicate work already owned or underway.

### Article VII — Knowledge Stewardship

Organizational knowledge belongs to the organization and remains governed by source authority, access controls, retention, and provenance. Personal memory must remain separate from organizational memory.

### Article VIII — Behavioral Learning Cannot Override Declared Goals

Observed habits are evidence about behavior, not proof of importance. Repeated avoidance of a declared priority should create an accountability signal rather than silently lowering its priority.

### Article IX — Restraint Builds Trust

Parallel should choose the least disruptive effective action. It should avoid unnecessary interruptions, excessive autonomy, needless model usage, overcollection of data, and overconfident conclusions.

### Article X — Cost Is an Engineering Constraint

Parallel must use the least expensive capable method while preserving an excellent user experience. Deterministic rules, cached context, low-cost models, selective reasoning, and dormant workflows are foundational.

### Article XI — Secure by Design

Permission checks, identity resolution, data boundaries, auditability, secret handling, device trust, and revocation must be architectural primitives, not later additions.

### Article XII — Reversible by Default

Where practical, AI actions should be reviewable, cancellable, undoable, or recoverable. High-risk or irreversible actions require stronger approval.

### Article XIII — Honest Uncertainty

When identity, ownership, intent, policy, evidence, or outcome is uncertain, the AI must say so and seek clarification rather than invent certainty.

### Article XIV — One Consistent Relationship

Users should experience one coherent Aura personality and relationship even when different models, tools, services, or communication channels perform the work.

### Article XV — AI Coworkers Cooperate

AI employees may share governed organizational facts and coordinate handoffs, but personal preferences, private coaching, drafts, and user-scoped memory must not leak across users.

---

## Part III — Foundational Platform Architecture

### 10. Architectural Primitives

Codex must treat the following as durable platform primitives rather than Aura-specific shortcuts:

1. **Tenant**
2. **Person**
3. **User account**
4. **Human role**
5. **AI employee**
6. **Department and team**
7. **Reporting and management relationship**
8. **Responsibility**
9. **Goal and KPI**
10. **Policy**
11. **Permission and authority**
12. **Resource and knowledge object**
13. **System and connector**
14. **Event**
15. **Decision**
16. **Commitment**
17. **Action item**
18. **Workflow**
19. **Delegation and handoff**
20. **Meeting**
21. **Project**
22. **Risk**
23. **Memory object**
24. **Evidence and provenance**
25. **Model invocation**
26. **Cost record**
27. **Audit event**
28. **Device**
29. **Application**
30. **Simulation scenario**

Aura may use these primitives, but they must not be named or structured in ways that prevent future AI employees from using them.

### 11. Platform Layers

```text
Experience Layer
- Voice, chat, web, mobile, Teams, phone, notifications

AI Employee Layer
- Ara and future role-based AI coworkers
- Role identity, personality, goals, capabilities, performance

Orchestration Layer
- Conversation lifecycle
- Attention engine
- Meeting orchestration
- Workflow engine
- Delegation and handoff
- Communication channel routing

Decision Layer
- Context engine
- Decision engine
- Accountability engine
- Policy engine
- Model router
- Confidence and escalation

Organization Intelligence Layer
- Organization graph
- Strategic goals
- Responsibilities and authority
- Knowledge graph
- Commitments and dependencies
- Organizational memory

Integration Layer
- Microsoft Graph
- SharePoint, OneDrive, Teams, Outlook, Calendar
- Case and ticket systems
- Business applications
- Local desktop agent

Trust and Operations Layer
- Identity
- Permissions
- Audit
- Data governance
- Security
- Observability
- Cost metering
- Evaluation
- Device trust

Data Layer
- Tenant-scoped operational data
- Personal memory
- Organizational memory
- Evidence and provenance
- Event history
- Simulation models
```

### 12. Multi-Tenant and Multi-User Foundation

From the beginning:

- every record must have a tenant boundary;
- user-scoped data must be distinguishable from organization-scoped data;
- AI employee instances must have explicit owners and roles;
- action execution must identify the responsible AI employee;
- shared actions must have one canonical ownership record;
- cross-user visibility must be policy-driven;
- organization-wide intelligence must not expose unauthorized personal data;
- the architecture must support multiple AI employees per person and multiple people per tenant.

### 13. Organization Graph

The organization graph should eventually represent:

```text
Person → occupies Role
Role → belongs to Department
Role → reports to Role
Role → owns Responsibility
Responsibility → supports Goal
Goal → measured by KPI
Person or AI Employee → owns Action
Action → depends on Action
Action → originates from Meeting, Message, Case, or Project
Policy → governs Action
System → contains Resource
Resource → provides Evidence
Decision → uses Evidence
Decision → creates Action
```

The first implementation may use relational storage and explicit joins. A graph database is not required immediately. The logical graph, identity model, and stable IDs are required immediately.

### 14. Company Constitution and Policy Hierarchy

The runtime policy hierarchy should be:

```text
Law and regulatory requirement
    ↓
Tenant security and compliance policy
    ↓
Company Constitution
    ↓
Department policy
    ↓
Role policy
    ↓
User permissions
    ↓
User preference
    ↓
Learned behavior
```

A lower layer must not override a higher layer.

### 15. AI Employee Definition

Each AI employee should eventually be represented by a manifest:

```yaml
ai_employee:
  id: ara_nick
  role: chief_of_staff
  tenant_id: tenant_001
  manager_person_id: nick
  department_id: it_operations
  mission: Protect attention, prepare decisions, and ensure follow-through.
  responsibilities:
    - attention_management
    - meeting_orchestration
    - commitment_tracking
    - decision_preparation
  goals:
    - reduce_missed_commitments
    - improve_response_timeliness
    - protect_strategic_focus
  permissions_profile: chief_of_staff_standard
  knowledge_scopes:
    - user_authorized_department_content
    - user_mail_and_calendar
  autonomy_profile: guided
  memory_profile: personal_plus_governed_org
  model_policy: least_expensive_capable
  performance_profile: chief_of_staff_v1
```

### 16. Performance and Value Measurement

Parallel must eventually measure AI employees using role-appropriate outcomes rather than raw activity.

Ara’s measures may include:

- important items correctly surfaced;
- false-positive interruption rate;
- important items missed;
- commitments captured;
- overdue commitments prevented;
- meeting preparation usefulness;
- response cycle-time improvement;
- hours of user attention protected;
- actions completed after recommendation;
- user override rate;
- cost per resolved outcome;
- trust and satisfaction feedback.

Raw message volume, token usage, or number of actions should not be treated as success by themselves.

### 17. Evaluation as a Product Asset

Synthetic scenarios, expected decisions, policy tests, cost tests, security tests, and real-user feedback must be maintained as a permanent evaluation library.

Before a model, prompt, rule, or architecture change is released, Parallel should test:

- decision quality;
- ownership accuracy;
- interruption behavior;
- permission compliance;
- cross-user isolation;
- duplicate-work prevention;
- cost and latency;
- voice consistency;
- failure recovery;
- audit completeness.

### 18. Architecture Decision Test

Before approving a foundational implementation, Codex must answer:

- Does this support multiple tenants?
- Does this support multiple people?
- Does this support multiple AI employees?
- Is role and ownership explicit?
- Are personal and organizational memory separated?
- Is authority deterministic and policy-controlled?
- Can the action be explained and audited?
- Can the model or provider be replaced?
- Can the communication channel be replaced?
- Can the workflow wait without an active model?
- Can the system prevent duplicate work?
- Can cost be measured by user, AI employee, task, and outcome?
- Does this preserve the path to an organization graph and simulation engine?

If the answer is no, the design must document whether the limitation is temporary and how migration will occur.

---

## Part IV — Codex Operating Instructions

### 19. Codex’s Primary Responsibility

Codex must optimize for a durable platform, not merely rapid feature completion.

Codex should not overengineer distant functionality before it is needed. However, it must establish stable identities, boundaries, interfaces, schemas, audit records, and extension points so today’s Aura prototype does not become a dead-end assistant application.

### 20. Required Foundational Documents

The repository should contain and maintain:

```text
docs/
├── north-star.md
├── parallel-constitution.md
├── platform-architecture.md
├── organization-model.md
├── ai-employee-model.md
├── data-and-memory-boundaries.md
├── permission-and-authority-model.md
├── model-routing.md
├── evaluation-strategy.md
├── cost-governance.md
├── threat-model.md
├── roadmap.md
└── architecture-decisions/
```

### 21. Required Architecture Decision Records

Codex must create ADRs for consequential choices, including:

- tenant isolation;
- identity and person resolution;
- AI employee manifests;
- memory separation;
- action ownership;
- policy hierarchy;
- event architecture;
- model routing;
- audit storage;
- connector approach;
- desktop agent trust;
- knowledge provenance;
- simulation boundaries.

### 22. Build Philosophy

Codex should:

- inspect before rewriting;
- document before major implementation;
- use small reviewable changes;
- add tests with every behavior change;
- preserve working functionality;
- avoid provider-specific logic in business services;
- prefer structured schemas over giant prompts;
- use deterministic code for authority and policy;
- retain evidence and provenance;
- measure cost and latency;
- simulate before granting autonomy;
- support read-only mode before write access;
- make failures visible and recoverable.

---

## Part V — Immediate Product Focus

The long-term vision must guide the architecture, but the near-term implementation remains focused.

### 23. Near-Term Goal

Build Ara into a trusted personal AI Chief of Staff who can:

- converse naturally;
- complete tools and close voice sessions herself;
- monitor authorized communication efficiently;
- identify what deserves attention;
- understand the user’s role, goals, and management style;
- hold the user accountable;
- prepare meetings and supporting knowledge;
- process transcripts and track follow-up;
- act only for the correct owner;
- control approved calendar and desktop actions;
- initiate a conversation through approved channels;
- use the least expensive capable model;
- explain and audit every material action.

### 24. Current Implementation Priority

```text
1. Instrument the current voice and calendar implementation.
2. Implement natural session completion and autonomous disconnect.
3. Implement capability-based model routing and cost metering.
4. Establish tenant, person, user, AI employee, ownership, and memory schemas.
5. Build the personal decision profile and policy hierarchy.
6. Build read-only attention monitoring.
7. Build durable commitments and accountability workflows.
8. Add controlled calendar authority.
9. Add meeting knowledge packs and transcript intelligence.
10. Add multi-user ownership and delegation.
11. Add secure local desktop control.
12. Add outbound communication channels.
13. Expand into additional AI employee roles only after the platform primitives are stable.
```

---

## Part VI — Existing Detailed Implementation Blueprint

The following detailed implementation plan remains in force. Where any older wording conflicts with Parts I–V, the North Star, Constitution, platform primitives, and policy hierarchy above take precedence.


## 1. Product North Star

Parallel is the operating layer. Aura is the user-facing AI Chief of Staff.

Aura should feel like a natural executive partner who:

- listens and speaks naturally;
- understands when a conversation is complete;
- can end or leave a voice session without waiting for the user;
- monitors communication and work systems in the background;
- protects the user’s attention;
- schedules time when an issue genuinely requires the user;
- prepares the decision before the meeting starts;
- tracks commitments and unfinished work;
- challenges avoidance when it conflicts with declared goals;
- uses the least expensive capable model for each task;
- escalates to a stronger model only when judgment or complexity requires it.

The product should feel consistent regardless of which model performs the work.

## 2. Current State

The current prototype can:

- hold a voice conversation;
- accept a request to create a calendar invite;
- call calendar tooling;
- generate a natural spoken response.

The current gaps are:

1. Aura waits for the user to end the conversation.
2. There is no explicit conversation lifecycle or graceful autonomous exit.
3. Model selection is not yet cost-aware.
4. Background monitoring is not yet event-driven.
5. Aura does not yet maintain a personal decision profile.
6. Aura cannot yet initiate a future conversation.
7. Calendar access exists as a tool, but calendar authority is not governed by policy.
8. There is no accountability engine.
9. There is no complete audit trail explaining why Aura acted.
10. There is no simulation suite proving that Aura makes good decisions.

## 3. Target Experience

### Natural conversation closure

User:
> Aura, set up thirty minutes with Matt tomorrow afternoon to review the recovery plan.

Aura:
> I found a window at 2:30. I’ll send the invitation and include the recovery plan in the agenda.

After the tool succeeds:

> It’s handled. I’m going to drop off, but call me back if you need anything else.

Aura then closes her side of the voice session automatically. The user should not have to press “leave” or explicitly dismiss Aura.

### Aura initiates time with the user

8:30 a.m.:
- The user’s manager sends an email requiring a decision before noon.
- The user is in meetings from 8:00–10:00 and 10:30–12:00.

Aura should:

1. classify the message;
2. determine that a decision is required;
3. understand the deadline and reporting relationship;
4. wait for the 10:00 transition window;
5. notify the user briefly;
6. prepare a recommended response;
7. check again if the item remains unresolved;
8. reserve a short review block if permitted;
9. later initiate a voice or Teams session;
10. close the session naturally after the decision is captured.

## 4. Core Design Principle

Aura must be available all day without running an expensive model all day.

```text
Event arrives
    ↓
Deterministic filters
    ↓
Low-cost extraction/classification
    ↓
Personal and organizational context
    ↓
Decision policy
    ↓
Advanced reasoning only when justified
    ↓
Workflow timer, draft, notification, calendar hold, or conversation
```

Voice is an interaction channel, not the background monitoring engine. Waiting, timers, retries, and escalation windows must not keep a model session alive.

## 5. Model Routing Architecture

Create a `ModelRouter` service with task-based routing. Do not bind the product to one model name. Use capability tiers in configuration.

### Tier A — Deterministic / no model

Use for duplicate detection, sender lists, calendar availability, known relationships, already-answered checks, explicit deadlines, newsletters, timers, permissions, policies, and budget enforcement.

### Tier B — Low-cost model

Use for intent classification, request detection, deadline extraction, commitment extraction, short summarization, message category, response-required classification, urgency cues, and structured metadata generation.

### Tier C — Standard reasoning model

Use for prioritization across signals, deciding whether to interrupt, linking communication to goals, selecting briefing/task/draft/calendar actions, drafting concise responses, and detecting avoidance.

### Tier D — Premium reasoning model

Use only when business impact is high, ambiguity is substantial, policies or goals conflict, the user requests deep strategic analysis, a high-risk action is considered, or lower tiers return low confidence.

### Routing requirements

Each model call must record task type, selected tier, model identifier, escalation reason, token/audio usage, estimated cost, latency, confidence, and whether the result changed the final action.

### Consistent experience

All tiers must write through one `AuraResponseStyle` layer: warm, concise by default, conversational, decisive without overconfidence, and never exposing model-routing details.

## 6. Conversation Lifecycle Engine

Build a dedicated state machine. Do not rely on the model alone to decide whether a call is over.

```text
IDLE
CONNECTING
GREETING
LISTENING
THINKING
TOOL_PENDING
RESPONDING
AWAITING_CONFIRMATION
WRAP_UP
DISCONNECTING
CLOSED
```

### Completion signals

Aura may consider a conversation complete when the requested action succeeded, no unresolved question remains, the user uses a closing phrase, silence follows a completed response, or remaining work can safely continue in the background.

### Do not disconnect when

- a tool failed;
- information is missing;
- an external action awaits approval;
- the user asked a follow-up;
- the response was interrupted;
- policy requires clarification.

### Graceful wrap-up

1. Generate one concise closing message.
2. Play the closing audio.
3. Wait for playback completion.
4. Allow a short interruption window.
5. Close the realtime session.
6. Write the session summary.
7. Persist commitments and actions.
8. Release audio resources.

```yaml
conversation:
  allow_autonomous_disconnect: true
  closing_silence_seconds: 4
  post_closing_interrupt_window_seconds: 2
  max_idle_seconds: 45
  require_tool_success_before_closing: true
```

## 7. Background Attention Engine

Initial sources:

1. Outlook email
2. Microsoft Calendar
3. Microsoft Teams messages
4. One case or ticket platform after the first three stabilize

```text
Source notification
    ↓
Queue
    ↓
Normalize
    ↓
Deduplicate
    ↓
Fetch progressive content
    ↓
Classify cheaply
    ↓
Enrich with user context
    ↓
Make decision
    ↓
Create workflow
    ↓
Recheck until resolved
```

### Progressive content access

1. Evaluate metadata.
2. Fetch sender, subject, timestamps, and importance.
3. Fetch body only when relevant.
4. Fetch full thread only when required.
5. Retrieve documents only for a real decision.
6. Store summaries instead of repeatedly sending full history.

### Attention actions

Ignore, log only, add to digest, create follow-up, draft response, request input, reserve review time, interrupt immediately, or escalate according to policy.

## 8. Personal Decision Profile

Each user receives a structured profile covering:

- role and authority;
- strategic goals and KPIs;
- management and communication style;
- interruption and accountability preferences;
- relationship graph;
- calendar patterns;
- behavioral observations;
- delegation boundaries;
- permissions.

Critical rule:

```text
Observed: The user repeatedly postpones documentation work.
Declared: Documentation is a critical strategic goal.
Conclusion: This is an accountability risk, not evidence that documentation is unimportant.
```

## 9. Accountability Engine

Track commitments, objectives, recurring operating rhythms, overdue decisions, repeatedly postponed work, and gaps between declared priorities and actual behavior.

```yaml
accountability:
  level: high
  may_challenge_user: true
  may_reserve_focus_time: true
  may_repeat_unresolved_priority: true
  may_bundle_items_into_review: true
  may_escalate_after_ignored_prompts: true
```

The user can mark a decision as correct, too aggressive, too passive, wrong priority, wrong timing, wrong action, or missing context. Feedback may tune preferences but may not weaken mandatory policy.

## 10. Calendar Authority Model

Permission levels:

1. Read only
2. Recommend a time
3. Create a personal hold
4. Create an internal meeting with confirmation
5. Create an internal meeting automatically within rules
6. Invite external attendees with confirmation
7. Reschedule or cancel within strict rules

Recommended initial policy:

```yaml
calendar_permissions:
  read_calendar: true
  recommend_time: true
  create_personal_hold: true
  create_internal_meeting: confirm
  invite_external_attendees: confirm
  reschedule_existing_meeting: confirm
  cancel_meeting: never_without_confirmation
  max_auto_hold_minutes: 20
  protect_focus_blocks: true
```

Create a special `AURA_REVIEW` category with an auto-generated agenda, source links, and an optional voice-session link.

## 11. Outbound Calling and Future-Proofing

Do not hard-code one calling provider.

```typescript
interface CommunicationChannel {
  startSession(request: SessionRequest): Promise<SessionResult>;
  endSession(sessionId: string): Promise<void>;
  supportsOutbound(): boolean;
  supportsScheduledSessions(): boolean;
}
```

Future providers:

- in-app voice;
- Microsoft Teams meeting;
- Teams calling where supported;
- phone/SMS provider;
- mobile push-to-call;
- browser session.

MVP order:

1. Private calendar review block.
2. “Join Aura” link.
3. Push notification opening voice.
4. Teams meeting creation.
5. Direct outbound phone calling.

The decision engine must request a channel capability, not a provider name.

## 12. Permissions, Safety, and Auditability

Action modes:

- observe;
- recommend;
- prepare;
- confirm then act;
- act within guardrails;
- prohibited.

Never allow the LLM alone to decide permissions, sensitive sending, financial approval, production changes, policy override, or confidential sharing.

Each audit record must include the source event, context, classification, rules, scores, model calls, selected action, permission check, action result, user feedback, resolution, and cost.

## 13. Cost Controls

Hard requirements:

1. No premium model as the default.
2. No open realtime session while inactive.
3. No continuous polling where notifications exist.
4. No full-thread resend when a summary works.
5. Retrieve only relevant strategic-plan sections.
6. Deduplicate before model calls.
7. Cache stable relationship and policy data.
8. Enforce per-user daily and monthly budgets.
9. Provide a cost dashboard.
10. Estimate cost before enabling new workflows.

```yaml
cost_policy:
  daily_soft_limit_usd: 2.00
  daily_hard_limit_usd: 5.00
  monthly_soft_limit_usd: 40.00
  monthly_hard_limit_usd: 100.00
  premium_model_requires_reason: true
  voice_idle_disconnect_seconds: 30
```

Dashboard metrics: spend by user/source/tier/voice-text, cost per resolved item, escalation rate, false-positive cost, and monthly run rate.

## 14. Recommended Repository Structure

```text
parallel/
├── AGENTS.md
├── README.md
├── docs/
│   ├── product-vision.md
│   ├── architecture.md
│   ├── model-routing.md
│   ├── conversation-lifecycle.md
│   ├── attention-engine.md
│   ├── decision-profile.md
│   ├── accountability-engine.md
│   ├── calendar-authority.md
│   ├── communication-channels.md
│   ├── permissions.md
│   ├── cost-controls.md
│   └── roadmap.md
├── apps/
│   ├── web/
│   ├── mobile/
│   └── api/
├── services/
│   ├── realtime-session/
│   ├── model-router/
│   ├── connectors/
│   ├── event-normalizer/
│   ├── attention-engine/
│   ├── decision-engine/
│   ├── accountability-engine/
│   ├── workflow-engine/
│   ├── calendar-orchestrator/
│   ├── communication-orchestrator/
│   ├── memory/
│   ├── policy-engine/
│   ├── audit/
│   └── cost-meter/
├── packages/
│   ├── schemas/
│   ├── prompts/
│   ├── evaluation/
│   ├── response-style/
│   └── shared/
├── simulations/
│   ├── personas/
│   ├── workdays/
│   ├── communication-events/
│   └── expected-decisions/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── policy/
│   ├── cost/
│   └── evaluation/
└── infrastructure/
```

## 15. Delivery Plan

### Sprint 1 — Natural Session Completion

Build the conversation state machine, completion detector, wrap-up response, playback completion, interruption window, server-side close, session summary, cleanup, and tests.

Acceptance criteria:

- no disconnect before required tool results;
- closes within seconds after completion;
- user can interrupt closing;
- no orphaned session;
- cost and duration recorded.

### Sprint 2 — Model Router and Cost Meter

Build capability tiers, routing rules, model adapters, confidence thresholds, fallback/escalation, shared response style, telemetry, budgets, and routing tests.

Acceptance criteria:

- routine tool requests avoid premium tier;
- complex reasoning may escalate;
- personality remains consistent;
- every call is traceable and costed.

### Sprint 3 — Personal Decision Profile

Build onboarding, schemas, role/authority, relationship graph, strategic-goal ingestion, preferences, accountability settings, permissions, and editable UI.

### Sprint 4 — Read-Only Attention Engine

Connect Outlook, Calendar, and Teams in read-only mode. Build subscriptions, queues, normalization, filters, classification, scoring, digest, reconciliation, and audit history.

### Sprint 5 — Workflow and Accountability Engine

Build durable timers, commitment extraction, objective tracking, escalation windows, ignored-prompt tracking, accountability-gap detection, and feedback.

### Sprint 6 — Calendar Review Blocks

Build calendar policy, personal holds, decision briefs, source links, thresholds, protected-time handling, approval, audit, and undo.

### Sprint 7 — Aura-Initiated Conversation

Build channel abstraction, push notification, join link, scheduled voice, missed-session workflow, escalation, and autonomous close.

### Sprint 8 — Teams and Phone Providers

Add private Teams meetings, Teams calling where permitted, direct phone calling, and channel fallback rules.

## 16. Founder Work Plan

### Week 1 inputs

- strategic plan;
- goals and KPIs;
- job responsibilities;
- organization chart;
- manager and direct-report relationships;
- urgent and non-urgent examples;
- communication that should interrupt or wait;
- calendar preferences;
- automatic, confirmation-required, and prohibited actions.

### Week 2 inputs

- work commonly delayed;
- commitments commonly missed;
- preferred challenge language;
- persistence level;
- weekly/monthly rhythms;
- daily briefing definition;
- ten realistic workday simulations.

### Daily founder cadence

- 30 minutes reviewing Codex’s plan and pull requests;
- 45 minutes testing behavior;
- 30 minutes labeling decisions;
- 30 minutes adding scenarios;
- 30 minutes refining profile and policy;
- remaining time for implementation review and bug triage.

## 17. Initial Evaluation Scenarios

Codex must create fixtures for at least these scenarios:

1. Aura schedules a meeting, completes it, and leaves.
2. Calendar tool fails; Aura explains before leaving.
3. User interrupts the closing statement.
4. Casual conversation ends without a tool call.
5. Manager sends a decision request during a meeting.
6. Manager sends an informational message.
7. Low-ranking sender reports a critical outage.
8. Vendor marks a routine message urgent.
9. User answered in Teams but email remains unread.
10. User postpones strategic work three times.
11. Deadline is implied.
12. Aura has low confidence and asks.
13. User is in protected focus time.
14. User is on vacation.
15. Duplicate event.
16. Multiple messages describe one incident.
17. User reaches a budget threshold.
18. Premium escalation changes the outcome.
19. Premium escalation does not change the outcome.
20. Aura schedules a personal review block only.
21. User ignores the review block.
22. User overrides Aura and gives feedback.
23. Organization policy conflicts with preference.
24. High accountability but low interruption tolerance.
25. Voice closes without an orphaned realtime session.

## 18. Master Prompt for Codex

```text
You are the lead implementation agent for Parallel and its AI Chief of Staff,
Aura.

Aura must feel like a natural executive partner while using the least expensive
capable model for each task. The current prototype can hold a voice conversation
and create calendar invitations. The immediate priorities are:

1. Give Aura an explicit conversation lifecycle so she can recognize completed
   interactions, deliver a natural closing statement, and autonomously close her
   side of the realtime session.

2. Build a configurable ModelRouter that uses deterministic logic and lower-cost
   models for routine work, escalating to premium reasoning only when justified.
   Preserve one consistent Aura personality across all model tiers.

3. Build the foundation for a personalized decision profile, accountability
   engine, event-driven attention engine, controlled calendar authority, and
   future outbound calling.

Do not build all features at once.

First inspect the repository and current voice/calendar implementation. Create:

- docs/current-state-assessment.md
- docs/target-architecture.md
- docs/sprint-1-session-lifecycle-plan.md
- docs/model-routing-plan.md
- docs/risk-register.md

Before major implementation, identify:
- current frameworks and deployment model;
- current realtime session lifecycle;
- current calendar tool path;
- current model usage;
- current logging and token accounting;
- current authentication and secret handling;
- test coverage and missing tests.

Implementation order:
A. Instrument the current system.
B. Implement the conversation state machine and autonomous disconnect.
C. Add tests and verify cleanup.
D. Implement the ModelRouter behind existing interfaces.
E. Add cost metering and budget policy.
F. Add evaluation fixtures.
G. Only then begin background monitoring and personalized decision logic.

Non-negotiable engineering principles:

- No premium model as the default for all tasks.
- No open realtime session while the user is inactive.
- No model call for deterministic permission or policy enforcement.
- No external action without explicit permission.
- No full conversation, email thread, or strategic plan resent when a summary
  and relevant excerpts are sufficient.
- Every decision and model call must be traceable and costed.
- Model providers and communication providers must be replaceable.
- Voice is an interaction channel, not the background monitoring engine.
- Waiting and escalation timers must not consume model tokens.
- Observed behavior must not silently override declared goals.
- The system must be testable with synthetic workday simulations.

For each sprint:
1. propose files to change;
2. identify risks;
3. implement in small reviewable commits;
4. add or update tests;
5. run the full test suite;
6. provide a concise change summary;
7. report measured cost and latency effects;
8. document unresolved issues.

Begin with repository inspection and planning. Do not rewrite working features
without a demonstrated need.
```

## 19. Immediate Next Actions

1. Put this document in the repository as `docs/aura-implementation-blueprint.md`.
2. Give Codex the master prompt.
3. Ask Codex to inspect—not rewrite—the current implementation.
4. Require the five planning documents before coding.
5. Begin Sprint 1: natural session completion.
6. Instrument model usage before optimizing it.
7. Begin Sprint 2 only after autonomous disconnect is reliable.
8. Gather founder profile inputs while Codex works on Sprints 1 and 2.
9. Build simulations before connecting background communication sources.
10. Keep communication monitoring read-only until decision quality is proven.

## 20. First Meaningful Milestone

The first meaningful release is complete when:

- the user can call Aura naturally;
- Aura can perform a calendar action;
- Aura knows when the interaction is finished;
- Aura gives a natural closing statement;
- Aura disconnects herself;
- routine requests avoid premium reasoning;
- all usage is costed;
- the experience feels consistent;
- no background monitoring or autonomous external action is required yet.

The turning-point milestone comes next:

> Aura notices something important, reserves time, calls the user with a prepared decision brief, captures the answer, completes the follow-up, and leaves the conversation naturally.


---

## 21. Meeting Orchestration and Knowledge-Pack Assembly

Aura should not merely place a meeting on the calendar. She should prepare the meeting so the user can walk in ready.

### Example request

> “Aura, set up a meeting tomorrow with Wes and Noel. We need to do a deep dive into how we are going to configure our upcoming failover job.”

Aura should be able to:

1. Resolve Wes and Noel to the correct organizational contacts.
2. Check availability.
3. Determine the meeting purpose and likely duration.
4. Search authorized department knowledge sources for relevant material.
5. Identify policies, procedures, prior failover plans, diagrams, runbooks, recovery-test notes, project files, and related meeting notes.
6. Rank those materials by relevance and freshness.
7. Create a concise meeting brief.
8. Attach or link the approved documents.
9. Create a controlled meeting workspace or folder.
10. Add an agenda and expected outcomes.
11. Configure meeting transcription when policy and platform settings permit it.
12. Schedule the meeting only after applying the user’s calendar permissions.

### Recommended meeting artifact structure

```text
/Meetings/2026-08-01 Failover Job Deep Dive/
├── 00 - Meeting Brief.md
├── 01 - Agenda.md
├── 02 - Relevant Policies/
├── 03 - Procedures and Runbooks/
├── 04 - Previous Meeting Notes/
├── 05 - Architecture and Diagrams/
├── 06 - Decisions/
├── 07 - Action Items/
└── 08 - Transcript and Summary/
```

For Microsoft 365 environments, this may be represented as a SharePoint or OneDrive folder, Loop workspace, or another governed collaboration location rather than a literal ZIP file. Aura should choose links over copied attachments when the source document must remain authoritative or access-controlled.

### Meeting brief

Aura should prepare a short brief containing:

- meeting objective;
- why the meeting is occurring;
- relevant background;
- documents located;
- known decisions already made;
- unresolved questions;
- recommended attendees;
- risks or dependencies;
- desired outputs;
- proposed follow-up cadence.

### Knowledge retrieval rules

Aura must:

- search only sources the requesting user is authorized to access;
- preserve the original source link and metadata;
- prefer current approved documents over old drafts;
- label uncertain or outdated material;
- avoid attaching confidential content to attendees who lack access;
- avoid creating uncontrolled duplicate copies;
- record why each document was selected;
- ask the user when two sources conflict materially;
- never treat search relevance as proof that a document is authoritative.

### Search sources for the first enterprise version

- SharePoint sites;
- OneDrive;
- Teams channel files;
- Loop workspaces;
- approved department document repositories;
- prior meeting artifacts;
- case or ticket attachments;
- policy libraries;
- knowledge-base articles.

### Knowledge-pack decision result

```json
{
  "meeting_id": "meeting_123",
  "query": "failover job configuration",
  "selected_sources": [
    {
      "document_id": "doc_001",
      "title": "Core Failover Procedure",
      "authority": "approved_procedure",
      "relevance": 0.96,
      "freshness": "current",
      "access_verified_for_attendees": true,
      "selection_reason": "Defines the approved failover sequence and required validation."
    }
  ],
  "excluded_sources": [
    {
      "document_id": "doc_099",
      "reason": "Superseded draft from prior year."
    }
  ]
}
```

---

## 22. Meeting Lifecycle Engine

Create a dedicated meeting lifecycle rather than treating meetings as isolated calendar events.

```text
REQUESTED
    ↓
ATTENDEES_RESOLVED
    ↓
AVAILABILITY_CHECKED
    ↓
KNOWLEDGE_PACK_PREPARED
    ↓
AWAITING_CONFIRMATION
    ↓
SCHEDULED
    ↓
PRE_MEETING_READY
    ↓
IN_PROGRESS
    ↓
TRANSCRIPT_PENDING
    ↓
POST_MEETING_ANALYSIS
    ↓
ACTIONS_ASSIGNED
    ↓
FOLLOW_UP_SCHEDULED
    ↓
CLOSED
```

### Pre-meeting responsibilities

Aura should:

- confirm the meeting purpose;
- resolve attendees;
- prepare the knowledge pack;
- produce an agenda;
- include expected decisions;
- identify missing participants or subject-matter experts;
- verify that all attendees can access linked materials;
- remind the owner of unresolved preparation items;
- open the workspace before the meeting begins.

### During-meeting responsibilities

Aura should not need to stream audio independently when the conferencing platform already provides an approved recording or transcript.

Aura may:

- monitor meeting status;
- wait for the platform-provided transcript;
- record tool-level metadata such as start, end, attendees, and meeting ID;
- avoid opening an unnecessary realtime voice session;
- join visibly only when required by platform policy or user preference.

### Post-meeting responsibilities

When the transcript is available, Aura should:

1. retrieve it through the approved platform connector;
2. confirm the transcript belongs to the expected meeting;
3. extract decisions, action items, commitments, risks, open questions, and follow-up dates;
4. identify who said each commitment;
5. map each action to the correct owner;
6. produce a concise meeting summary;
7. update the meeting workspace;
8. propose or create follow-up meetings based on permissions;
9. create tasks or drafts according to each owner’s assistant boundaries;
10. monitor completion only for work assigned to Aura’s own user unless an organizational workflow explicitly delegates otherwise.

---

## 23. Transcript Intelligence and Post-Meeting Memory

The transcript engine should generate structured output before producing narrative notes.

```json
{
  "meeting_id": "meeting_123",
  "decisions": [
    {
      "decision": "Run the failover test in the secondary environment first.",
      "confidence": 0.93,
      "evidence_range": "00:31:22-00:32:10"
    }
  ],
  "action_items": [
    {
      "description": "Schedule a follow-up meeting in two weeks.",
      "owner_person_id": "nick",
      "owner_basis": "Nick explicitly said, 'I will set up the follow-up.'",
      "due_date": "2026-08-15",
      "confidence": 0.96
    }
  ],
  "open_questions": [],
  "risks": [],
  "follow_up_recommended": true
}
```

### Supported destinations

The destination should be configurable by organization and user:

- OneNote;
- Loop;
- SharePoint meeting page;
- Planner;
- Microsoft To Do;
- approved case-management system;
- Parallel’s internal meeting memory.

### Writing rules

Aura should:

- preserve a link to the source transcript;
- distinguish direct statements from inferred conclusions;
- include timestamps for critical decisions;
- avoid presenting uncertain speaker attribution as fact;
- ask for confirmation when ownership is ambiguous;
- avoid writing sensitive content into a less-restricted destination;
- update existing meeting artifacts instead of producing disconnected copies.

### Suggested post-meeting output

**Summary**

- Purpose
- Key discussion
- Decisions
- Risks
- Open questions

**Actions**

| Owner | Action | Due | Source |
|---|---|---|---|

**Follow-up**

- Recommended date
- Required attendees
- Proposed agenda
- Dependencies that should be completed first

---

## 24. Multi-User Personal Assistant Boundaries

This is a foundational requirement for the enterprise version.

Every person may have an Aura experience, but each assistant instance must operate primarily on behalf of its assigned user.

### Core rule

> Aura tracks and acts on obligations owned by her user. She must not duplicate work assigned to another person merely because that person also uses Aura.

Examples:

- Noel says, “I will schedule time with Wes.” Noel’s Aura owns the follow-up.
- Nick says, “I will schedule the follow-up.” Nick’s Aura owns the follow-up.
- Someone says, “Nick, can you set up the meeting?” Nick’s Aura may create the action for Nick.
- Someone says, “Can one of you schedule this?” Ownership is ambiguous; Aura should ask or wait for assignment.
- A manager explicitly assigns an action to Noel. Nick’s Aura may record the dependency but must not perform Noel’s work.

### Required identity objects

Each transcript and communication event must resolve:

- tenant ID;
- user ID;
- person ID;
- speaker ID;
- meeting organizer;
- action owner;
- assigner;
- assistant instance;
- organizational role;
- delegated authority;
- source of ownership determination.

### Ownership resolution order

1. Explicit first-person commitment:
   - “I will schedule it.”
2. Explicit assignment:
   - “Nick, please schedule it.”
3. Named owner in an agenda or task system.
4. Meeting role and known responsibility.
5. Reasonable inference with high confidence.
6. Ask for clarification when still ambiguous.

### Ownership state

```text
UNASSIGNED
PROPOSED_OWNER
CONFIRMED_OWNER
DELEGATED
ACCEPTED
IN_PROGRESS
COMPLETED
DECLINED
REASSIGNMENT_REQUIRED
```

### Action ownership schema

```json
{
  "action_id": "action_456",
  "description": "Schedule failover follow-up meeting",
  "owner_person_id": "nick",
  "owner_user_id": "user_nick",
  "owner_assistant_id": "aura_nick",
  "assigned_by_person_id": "wes",
  "ownership_basis": "explicit_assignment",
  "ownership_confidence": 0.98,
  "cross_user_visibility": "meeting_participants",
  "execution_authority": "owner_assistant_only"
}
```

### Duplicate-work prevention

Before acting, Aura must check:

- whether an equivalent task already exists;
- whether another assistant has claimed the action;
- whether a meeting is already being scheduled;
- whether the owner has accepted or completed it;
- whether the user is only a watcher or dependency owner;
- whether a shared workflow already exists.

Use an idempotency key such as:

```text
tenant + normalized_action + owner_person + source_meeting + due_window
```

### Shared coordination without assistant confusion

Parallel may maintain a shared organizational action record, while execution remains owner-specific.

Example:

```text
Shared action:
“Schedule failover follow-up”

Owner:
Nick

Nick’s Aura:
May prepare and schedule it.

Noel’s Aura:
May show Noel that the follow-up is pending if Noel depends on it.
May not independently schedule a duplicate meeting.

Wes’s Aura:
May show Wes that Nick owns the action.
May not take it over unless delegated.
```

---

## 25. Delegation and Handoff Protocol

Assistants need a formal handoff mechanism.

### Example

Nick says:

> “Aura, ask Noel to own the runbook update.”

Nick’s Aura should:

1. create a proposed delegation;
2. identify Noel;
3. notify Noel through an approved channel;
4. wait for acceptance if required;
5. transfer execution ownership to Noel’s Aura after acceptance;
6. keep Nick as requester or stakeholder;
7. avoid continuing to act as if Nick still owns the task;
8. notify Nick if Noel declines or does not accept.

### Handoff object

```json
{
  "handoff_id": "handoff_123",
  "from_person_id": "nick",
  "to_person_id": "noel",
  "action_id": "action_789",
  "status": "accepted",
  "from_assistant_id": "aura_nick",
  "to_assistant_id": "aura_noel",
  "accepted_at": "2026-08-01T14:05:00-04:00"
}
```

### Guardrails

- An assistant may not impersonate another user.
- An assistant may not accept work for another user without delegated authority.
- Cross-user context must follow organizational permissions.
- Personal preferences and private memory must not leak between users.
- Shared meeting facts may be visible according to meeting and tenant policy.
- Personal interpretations, private notes, and coaching data remain user-scoped unless explicitly shared.

---

## 26. Personal Memory vs Organizational Memory

Parallel should keep these distinct.

### Personal memory

Visible to the individual user and their Aura:

- communication preferences;
- accountability settings;
- private notes;
- personal reminders;
- private coaching;
- behavioral patterns;
- private drafts;
- personal calendar preferences.

### Organizational memory

Visible according to company permissions:

- approved policies;
- procedures;
- meeting decisions;
- assigned work;
- project status;
- shared action items;
- official runbooks;
- governed summaries;
- authoritative documents.

### Shared-but-scoped memory

Examples:

- a meeting summary visible only to attendees;
- a project decision visible only to the project team;
- an action item visible to the owner, assigner, and approved stakeholders.

Aura must retrieve from the correct memory layer and must never merge personal coaching data into organizational records.

---

## 27. Meeting-Orchestration Sprints

## Sprint 9 — Knowledge-Aware Meeting Creation

**Objective:** Aura prepares relevant material when scheduling a meeting.

Build:

- contact resolution;
- authorized document search;
- document ranking;
- freshness and authority checks;
- meeting brief generation;
- meeting workspace creation;
- agenda generation;
- permission-safe links;
- knowledge-pack audit log.

Acceptance criteria:

- Aura finds relevant current material;
- superseded drafts are excluded or clearly labeled;
- attendees cannot receive inaccessible confidential attachments;
- every selected source has a reason;
- the user can approve or remove suggested materials;
- meeting creation remains successful even when no relevant document is found.

---

## Sprint 10 — Transcript Retrieval and Structured Analysis

**Objective:** Aura processes the platform-generated transcript after a meeting.

Build:

- meeting-to-transcript correlation;
- transcript availability workflow;
- transcript retrieval;
- speaker mapping;
- decision extraction;
- action extraction;
- evidence timestamps;
- summary generation;
- destination adapters for OneNote, Loop, or approved storage.

Acceptance criteria:

- Aura waits without an active model session;
- transcript analysis begins only when the transcript is available;
- actions retain speaker evidence;
- uncertain owners are flagged;
- summaries link to the original transcript;
- sensitive notes are written only to approved destinations.

---

## Sprint 11 — Ownership and Duplicate-Work Prevention

**Objective:** Each Aura acts for the correct person.

Build:

- person and assistant identity model;
- action ownership resolver;
- explicit assignment detection;
- first-person commitment detection;
- ownership confidence;
- shared action registry;
- idempotency and duplicate detection;
- watcher/dependency roles;
- conflict resolution UI.

Acceptance criteria:

- Nick’s Aura acts only on Nick-owned work;
- Noel’s Aura acts only on Noel-owned work;
- shared tasks are not duplicated;
- ambiguous ownership triggers clarification;
- ownership can be reassigned with an audit trail;
- one assistant cannot impersonate another user.

---

## Sprint 12 — Delegation and Cross-Aura Handoffs

**Objective:** Work can move cleanly between users and their assistants.

Build:

- proposed delegation;
- acceptance workflow;
- assistant-to-assistant handoff;
- requester and stakeholder tracking;
- decline and timeout handling;
- permission checks;
- shared progress visibility.

Acceptance criteria:

- responsibility transfers only after policy conditions are met;
- the old assistant stops executing after accepted transfer;
- requesters can see status without accessing private memory;
- declined handoffs return to the requester;
- all changes are auditable.

---

## 28. Additional Evaluation Scenarios

Add these scenarios to the simulation library:

26. User asks Aura to schedule a failover meeting and cannot remember the exact technical term.
27. Aura uses context to identify the likely topic but confirms when confidence is low.
28. Aura finds one approved policy and three outdated drafts.
29. Aura links the approved policy and excludes the outdated drafts.
30. A relevant document is confidential and one attendee lacks access.
31. Aura warns the organizer and does not expose the document.
32. Aura prepares a meeting folder, agenda, and brief.
33. Transcript becomes available twenty minutes after the meeting.
34. Aura waits without keeping a model session open.
35. Nick states that he will schedule a follow-up.
36. Nick’s Aura creates the proposed follow-up.
37. Noel states that she will schedule a separate call with Wes.
38. Noel’s Aura owns that action.
39. Both assistants detect the same shared meeting decision but do not duplicate actions.
40. An action owner is unclear.
41. Aura asks the meeting organizer to assign it.
42. A speaker is incorrectly identified by the transcript platform.
43. Aura marks ownership as uncertain rather than acting.
44. Nick delegates an action to Noel.
45. Noel accepts and her Aura assumes execution ownership.
46. Noel declines and Nick is notified.
47. A follow-up meeting already exists.
48. Aura links the existing meeting rather than creating a duplicate.
49. Meeting notes contain personal coaching commentary.
50. Aura keeps the commentary in private memory and excludes it from organizational notes.

---

## 29. Addendum Prompt for Codex

```text
Extend the Parallel/Aura roadmap with a Meeting Orchestration capability.

Aura must be able to turn a natural-language meeting request into a prepared
working session. For example, when the user requests a failover-planning meeting,
Aura should resolve attendees, search authorized department knowledge, identify
current policies, procedures, runbooks, diagrams, and prior notes, create a
meeting brief and agenda, prepare a governed meeting workspace, and attach or
link only material that every intended recipient is permitted to access.

After the meeting, Aura should wait for the Microsoft platform transcript,
retrieve it when available, extract decisions, actions, commitments, risks, and
follow-up dates, preserve evidence timestamps, write approved notes to a
configured destination such as OneNote, Loop, SharePoint, or Parallel memory,
and propose or schedule follow-up work according to permissions.

This must support multiple users, each with their own Aura instance.

Non-negotiable ownership rule:
An Aura instance acts primarily for its assigned user. If Noel states that Noel
will schedule a meeting, Noel's Aura owns that action. If Nick states that Nick
will schedule it, or someone explicitly assigns it to Nick, Nick's Aura owns it.
Other assistants may display dependencies or shared status but must not perform
duplicate work.

Implement:
- person, user, speaker, assistant, and tenant identity schemas;
- action ownership resolution;
- explicit assignment and first-person commitment extraction;
- ownership confidence and clarification;
- a shared action registry;
- idempotency and duplicate-work prevention;
- delegation and assistant-to-assistant handoff;
- separation of personal memory, organizational memory, and scoped shared
  meeting memory;
- authorized knowledge retrieval;
- document authority and freshness checks;
- transcript availability workflows;
- structured transcript analysis with source timestamps;
- destination adapters for meeting notes;
- permission and audit enforcement.

Do not begin implementation until architecture documents and synthetic
evaluation scenarios are added. Do not use an LLM alone to determine document
access, user permissions, or final execution authority.
```

---

## 30. Updated Turning-Point Milestone

The expanded turning-point release is complete when Aura can:

1. understand a natural meeting request even when the user hesitates or cannot remember the exact term;
2. identify the correct attendees;
3. locate current, authorized supporting material;
4. create a meeting workspace, agenda, and brief;
5. schedule the meeting within calendar guardrails;
6. obtain the platform-generated transcript afterward;
7. extract decisions and correctly attributed action items;
8. write notes to the approved destination;
9. create the correct follow-up for the correct owner;
10. prevent another user’s Aura from duplicating that work;
11. monitor the user’s commitment until resolution;
12. explain every action and permission decision.

This is the point at which Aura stops feeling like a voice-enabled calendar tool and begins to feel like a genuine executive partner.


---

## 31. Local Computer and Application Control

Aura should eventually be able to operate approved applications on the user’s computer, but this must be built as a controlled automation layer rather than unrestricted desktop access.

### Desired experience

The user should be able to say:

- “Aura, open Outlook.”
- “Open the failover runbook in Word.”
- “Pull up the ticket in ServiceNow.”
- “Open Teams and join my next meeting.”
- “Open the folder where the transcript was saved.”
- “Start PowerPoint and create a deck from these meeting notes.”
- “Open Excel and load the latest recovery-test tracker.”
- “Bring the case-management app to the front.”
- “Open the document we were just discussing.”
- “Close the apps I am not using.”

Aura should understand the intent, select the correct application, locate the correct file or record, and perform only the actions permitted by policy.

### Architectural principle

Do not give the cloud model unrestricted control of the user’s desktop.

Use a local companion service:

```text
User request
    ↓
Aura decision engine
    ↓
Policy and permission check
    ↓
Structured local action request
    ↓
Local Desktop Agent
    ↓
Approved OS or application automation interface
    ↓
Execution result and audit record
```

The local agent should receive structured commands rather than free-form instructions.

Example:

```json
{
  "action": "open_application",
  "application_id": "microsoft_outlook",
  "arguments": {},
  "requested_by": "user",
  "approval_mode": "automatic",
  "correlation_id": "req_123"
}
```

For opening a document:

```json
{
  "action": "open_document",
  "document_id": "doc_456",
  "application_id": "microsoft_word",
  "source": "sharepoint",
  "approval_mode": "automatic",
  "correlation_id": "req_124"
}
```

---

## 32. Desktop Agent Capabilities

### Phase 1 — Safe launch and navigation

Allow:

- open an approved application;
- bring an application to the foreground;
- open an approved file or URL;
- open a specific meeting or calendar item;
- open a known case, ticket, or record;
- open a folder;
- close an application with no unsaved work;
- join a scheduled meeting;
- copy a governed link to the clipboard;
- show a notification or confirmation prompt.

### Phase 2 — Structured in-app actions

Allow approved application-specific actions such as:

- create a new Word document;
- create a PowerPoint presentation;
- open an Excel workbook;
- populate a known template;
- open a Teams chat or channel;
- create an Outlook draft;
- navigate to a ServiceNow or case record;
- update a task status;
- save notes to OneNote or Loop;
- export a meeting summary to an approved location.

Prefer official APIs, deep links, command-line interfaces, or application automation APIs over screen-coordinate clicking.

### Phase 3 — Controlled UI automation

Use UI automation only when no stable API exists.

Examples:

- Windows UI Automation;
- macOS Accessibility APIs;
- browser automation for approved internal systems;
- application-specific scripting interfaces.

UI automation must:

- identify elements semantically;
- avoid hard-coded screen coordinates where possible;
- verify the active application;
- confirm the expected window or page;
- stop when the interface differs from the expected state;
- capture a structured failure instead of guessing;
- never bypass authentication or security controls.

### Phase 4 — Multi-step desktop workflows

Examples:

> “Open the failover procedure, pull up the related ticket, and start a draft email to Wes and Noel.”

Aura may orchestrate several approved actions, but each step should be individually auditable and reversible where possible.

---

## 33. Desktop Permission Model

Desktop control requires a separate permission profile.

```yaml
desktop_permissions:
  open_approved_apps: automatic
  bring_app_to_foreground: automatic
  open_approved_files: automatic
  open_internal_urls: automatic
  open_external_urls: confirm
  join_scheduled_meeting: confirm
  create_local_document: confirm
  modify_document: confirm
  save_document: confirm
  close_app_without_unsaved_work: automatic
  close_app_with_unsaved_work: prohibited
  enter_credentials: prohibited
  install_software: prohibited
  uninstall_software: prohibited
  run_shell_command: prohibited_by_default
  delete_file: prohibited_by_default
  move_file: confirm
  upload_file: confirm
  download_file: confirm
  clipboard_read: confirm
  clipboard_write: automatic_for_user_requested_actions
  control_mouse_keyboard: restricted
```

### Permission scopes

Permissions should be configurable by:

- user;
- tenant;
- device;
- operating system;
- application;
- action type;
- data classification;
- work hours;
- network state;
- managed versus unmanaged device.

### Risk levels

#### Low risk

- opening an approved application;
- bringing a window forward;
- opening a known internal file;
- navigating to a known record;
- showing a notification.

#### Medium risk

- creating a draft;
- editing a document;
- saving a file;
- joining a meeting;
- uploading or downloading a document;
- moving a file.

#### High risk

- sending a message;
- deleting data;
- executing scripts;
- installing software;
- changing system settings;
- entering credentials;
- approving transactions;
- interacting with production infrastructure.

High-risk actions must require explicit confirmation or remain prohibited.

---

## 34. Device Trust and Security

Aura should act only on trusted, enrolled devices.

Each device should have a device ID, user and tenant assignment, operating system, management status, certificate or hardware-backed key, last-seen timestamp, agent version, allowed applications, policy version, and revocation status.

Required controls:

- mutual authentication between Parallel and the local agent;
- encrypted communication;
- short-lived action tokens;
- signed action requests;
- replay protection;
- local policy enforcement;
- revocation from the admin console;
- automatic lockout after suspicious behavior;
- complete action logs;
- user-visible indication when Aura is controlling the device.

Aura must never ask the model to infer or type a password.

---

## 35. Application Registry

Maintain a governed registry of applications Aura is allowed to use, including approved identities, OS-specific launch mechanisms, deep links, supported commands, required permissions, version compatibility, tenant restrictions, fallback behavior, and health checks.

---

## 36. Local Action Protocol

Create a stable protocol between the cloud service and the local desktop agent.

```text
REQUESTED
POLICY_CHECKED
AWAITING_CONFIRMATION
DISPATCHED
RECEIVED_BY_DEVICE
EXECUTING
SUCCEEDED
FAILED
CANCELLED
TIMED_OUT
```

Aura must never claim an action succeeded without receiving a verified result.

---

## 37. Context-Aware App Opening

Aura should use recent conversation, the active meeting, recently referenced documents, the current case, and the user’s active task to resolve vague references such as “open that document.” If more than one item is plausible, Aura should ask for clarification.

---

## 38. Desktop Awareness Without Continuous Surveillance

Aura does not need unrestricted screen recording. Use minimal state signals such as active application, meeting status, device online or offline, device locked or unlocked, whether a requested application opened, and whether unsaved changes are present when supported.

Do not continuously capture screenshots, keystrokes, microphone input, or clipboard content unless the user explicitly initiates an approved workflow and policy permits it.

---

## 39. Desktop Automation Sprint Plan

### Sprint 13 — Local Desktop Agent Foundation

Build device enrollment, signed action requests, local policy enforcement, application registry, action lifecycle, audit logging, online or offline status, and emergency disable.

### Sprint 14 — Safe Application Launching

Build opening and foregrounding approved applications, internal URLs, files, folders, verified results, ambiguity handling, and confirmation settings.

### Sprint 15 — Meeting and Document Workflows

Connect desktop control to opening meeting workspaces, agendas, transcripts, source documents, joining meetings, and creating approved documents from templates.

### Sprint 16 — Application-Specific Adapters

Recommended order: Outlook, Teams, Word, OneNote or Loop, Excel, PowerPoint, browser-based case platform, approved internal tools.

### Sprint 17 — Controlled Multi-Step Workflows

Allow short, auditable sequences across applications with policy checks at every step.

---

## 40. Additional Desktop Evaluation Scenarios

Add scenarios covering approved and unapproved applications, ambiguous files, unsaved work, offline devices, replayed commands, software-install requests, meeting joins, document permission mismatches, unexpected UI changes, credential requests, context-based document resolution, and revoked devices.

---

## 41. Codex Addendum — Desktop and Application Control

```text
Extend the Parallel/Aura roadmap with a secure Local Desktop Agent.

The user wants Aura to open approved applications, foreground windows, open
authorized documents and records, join scheduled meetings, and eventually
perform controlled multi-step workflows across business applications.

Do not give an LLM unrestricted mouse, keyboard, shell, filesystem, credential,
or desktop access.

Use this architecture:

Aura decision engine
→ deterministic policy check
→ structured local action request
→ enrolled Local Desktop Agent
→ approved OS/application automation interface
→ verified result
→ audit log

Implement a capability-based interface with actions such as:
- open_application
- foreground_application
- open_document
- open_internal_url
- open_folder
- join_meeting
- create_document_from_template
- open_case_record

Create device enrollment and revocation, device identity and trust records,
signed short-lived replay-protected action requests, local policy enforcement,
an application registry, an action lifecycle, application-specific adapters,
verified success and failure results, user-visible control indicators, emergency
disable, complete audit logging, and synthetic evaluation scenarios.

Prefer official APIs, deep links, and accessibility frameworks over coordinate
clicking. Prohibit credential entry, unrestricted shell execution, software
installation, and deletion by default. Protect unsaved work. Do not continuously
record the screen, keyboard, microphone, or clipboard. Stop when the UI is not
in the expected state. Require confirmation for medium- and high-risk actions.
Scope permissions by user, tenant, device, application, and action type.

Implementation order:
1. Local Desktop Agent foundation
2. Safe application launch and foreground control
3. Approved file, URL, folder, and meeting opening
4. Meeting and document workflows
5. Application-specific adapters
6. Controlled multi-step workflows

Do not begin implementation until the threat model, permission model, action
protocol, application registry, and evaluation scenarios are documented.
```

---

## 42. Updated Long-Term Experience

The complete experience should eventually allow the user to say:

> “Aura, set up the failover meeting with Wes and Noel tomorrow. Pull together
> the relevant procedures, add them to the meeting workspace, make sure the
> meeting is transcribed, and open everything I need before the call.”

Aura should then resolve the people, find a valid time, search authorized knowledge, prepare the workspace and agenda, schedule the meeting, configure approved transcription settings, create a pre-meeting workflow, open Teams and the relevant documents on the user’s trusted device, process the transcript afterward, assign actions to the correct owners, write notes to the approved destination, schedule the correct follow-up, avoid duplicate work across users, and keep the user accountable until owned actions are complete.

This should feel effortless while remaining tightly permissioned, auditable, reversible, and safe.
