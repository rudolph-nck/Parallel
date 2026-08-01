# Parallel target architecture

Updated: 2026-07-31

## Design intent

Parallel is the operating system for a human-and-AI workforce. Ara is the first AI employee, not the entire platform. Product logic must therefore keep identity, permissions, memory, tools, routing, and audit records explicit and replaceable.

## Logical layers

1. **Experience layer** — Today, Ara, Recall, Approvals, voice, briefings, and future desktop/mobile clients.
2. **Conversation control plane** — deterministic lifecycle, interruption handling, approvals, session cleanup, and handoff between foreground and background work.
3. **AI employee runtime** — Ara's manifest, role, communication style, tools, policies, and model-routing profile.
4. **Tool gateway** — provider-neutral actions such as search files, resolve people, inspect calendar, propose meeting, and create approved meeting.
5. **Memory and work graph** — private personal memory, organizational memory, source provenance, permissions, and relationships among people, work, decisions, and artifacts.
6. **Execution plane** — events, queues, schedules, retries, idempotency, monitors, and future background agents.
7. **Governance plane** — tenant boundaries, authorization, policy checks, audit, cost attribution, and evaluation.

## Stable identity model

Every durable record should carry these identifiers:

- `tenant_id`
- `person_id`
- `user_account_id`
- `ai_employee_id`
- `session_id` or `job_id`

The current prototype uses `tenant_demo_parallel`, `person_nick_rudolph`, `user_nick`, and `ai_employee_ara_nick` only as explicit migration placeholders. They are not a substitute for authentication-derived IDs.

## Conversation lifecycle boundary

The lifecycle controller is deterministic and separate from the model prompt. The model may converse and request tools; the controller alone decides whether it is safe to close. It must refuse autonomous closure while a tool, approval, clarification, or failed action remains unresolved.

The controller states are:

`IDLE → CONNECTING → GREETING → LISTENING → THINKING → TOOL_PENDING → RESPONDING → AWAITING_CONFIRMATION → WRAP_UP → DISCONNECTING → CLOSED`

Interruption can move `WRAP_UP` back to `LISTENING`. Errors return the session to a recoverable listening state or close it with an explicit failure reason.

## First-meeting boundary

The first meeting is a durable workflow above the disposable voice session. Identity, work context, connection state, and the first evidence-based result belong to tenant-scoped application state. Realtime voice may request narrow tools, but it does not own progression or serve as the system of record.

OAuth, mobile push, email links, and future phone calls are device handoffs. Each handoff must use a short-lived, user-bound continuation and resume the durable lifecycle. No spoken flow may collect credentials or claim access before the provider confirms it.

## Persistence migration path

Sprint 1 records a bounded session audit on the current device so behavior can be measured immediately. The record shape is deliberately compatible with a later tenant-scoped session table. Before multi-user use, migrate these records to server storage and derive all identity fields from authenticated tenancy.

## Provider adapters

Microsoft Graph and OpenAI are adapters, not domain models. UI code should ask for capabilities such as `resolve attendees` or `create approved meeting`; adapters translate that intent to provider calls. Tool results must include truthful success/failure fields so Ara never infers completion from conversational context.

## Required future platform services

- tenant-aware relational store;
- encrypted credential/token vault;
- append-only audit and usage ledger;
- queue and scheduler for background work;
- event ingestion for mail, meetings, transcripts, tickets, and documents;
- policy/permission service;
- evaluation harness and incident telemetry.
