import { getChatGPTUser } from "../../chatgpt-auth";
import { estimatedUsageUnits, routeModelTask } from "../../lib/model-router";

export const runtime = "edge";

type Identity = {
  tenantId: string;
  personId: string;
  userAccountId: string;
  aiEmployeeId: string;
  displayName: string;
  email: string;
  providerSubject: string;
};

const safeId = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 72) || "owner";

async function identity(): Promise<Identity> {
  const user = await getChatGPTUser();
  const subject = user?.userId ?? "parallel_demo_owner";
  const suffix = safeId(subject);
  return {
    tenantId: `tenant_${suffix}`,
    personId: `person_${suffix}`,
    userAccountId: `user_${suffix}`,
    aiEmployeeId: `ara_${suffix}`,
    displayName: user?.displayName ?? "Parallel user",
    email: user?.email ?? "",
    providerSubject: subject,
  };
}

function db() {
  const database = (globalThis as typeof globalThis & { __PARALLEL_DB__?: D1Database }).__PARALLEL_DB__;
  if (!database) throw new Error("Parallel's durable workspace is not available.");
  return database;
}

async function seed(owner: Identity) {
  const now = Date.now();
  const database = db();
  await database.batch([
    database.prepare("INSERT OR IGNORE INTO tenants (id, name, created_at) VALUES (?, ?, ?)").bind(owner.tenantId, "Parallel personal workspace", now),
    database.prepare("INSERT OR IGNORE INTO people (id, tenant_id, display_name, email, created_at) VALUES (?, ?, ?, ?, ?)").bind(owner.personId, owner.tenantId, owner.displayName, owner.email, now),
    database.prepare("INSERT OR IGNORE INTO user_accounts (id, tenant_id, person_id, provider, provider_subject, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(owner.userAccountId, owner.tenantId, owner.personId, "chatgpt", owner.providerSubject, now),
    database.prepare("INSERT OR IGNORE INTO ai_employees (id, tenant_id, name, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(owner.aiEmployeeId, owner.tenantId, "Ara", "AI Chief of Staff", "active", now),
    database.prepare("INSERT OR IGNORE INTO decision_profiles (id, tenant_id, person_id, user_account_id, ai_employee_id, updated_at) VALUES (?, ?, ?, ?, ?, ?)").bind(`profile_${owner.userAccountId}`, owner.tenantId, owner.personId, owner.userAccountId, owner.aiEmployeeId, now),
    database.prepare("INSERT OR IGNORE INTO onboarding_profiles (id, tenant_id, person_id, user_account_id, ai_employee_id, lifecycle_state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'NEW', ?, ?)").bind(`onboarding_${owner.userAccountId}`, owner.tenantId, owner.personId, owner.userAccountId, owner.aiEmployeeId, now, now),
    database.prepare("INSERT OR IGNORE INTO ownership_assignments (id, tenant_id, person_id, user_account_id, ai_employee_id, resource_type, resource_id, authority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(`ownership_${owner.aiEmployeeId}`, owner.tenantId, owner.personId, owner.userAccountId, owner.aiEmployeeId, "workspace", owner.tenantId, "read_analyze_propose", now),
    database.prepare("INSERT OR IGNORE INTO policy_rules (id, tenant_id, scope, key, value, precedence, source, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(`policy_${owner.tenantId}_external_actions`, owner.tenantId, "organization", "external_actions", "confirm_consequential_actions", 100, "parallel_constitution", now),
    database.prepare("INSERT OR IGNORE INTO policy_rules (id, tenant_id, scope, key, value, precedence, source, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(`policy_${owner.tenantId}_declared_goals`, owner.tenantId, "person", "declared_goals", "override_observed_avoidance", 200, "decision_profile", now),
    database.prepare("INSERT OR IGNORE INTO policy_rules (id, tenant_id, scope, key, value, precedence, source, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(`policy_${owner.tenantId}_monitoring`, owner.tenantId, "organization", "attention_monitoring", "read_only", 100, "parallel_constitution", now),
    database.prepare("INSERT OR IGNORE INTO policy_rules (id, tenant_id, scope, key, value, precedence, source, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(`policy_${owner.tenantId}_ownership`, owner.tenantId, "organization", "cross_user_ownership", "act_only_for_assigned_user", 100, "parallel_constitution", now),
    database.prepare("INSERT OR IGNORE INTO policy_rules (id, tenant_id, scope, key, value, precedence, source, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(`policy_${owner.tenantId}_desktop`, owner.tenantId, "organization", "desktop_control", "allowlisted_companion_and_confirmed_action", 100, "parallel_constitution", now),
    database.prepare("INSERT OR IGNORE INTO policy_rules (id, tenant_id, scope, key, value, precedence, source, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(`policy_${owner.tenantId}_outbound`, owner.tenantId, "organization", "outbound_communication", "draft_then_confirm_then_send", 100, "parallel_constitution", now),
  ]);
}

const identityBindings = (owner: Identity) => [owner.tenantId, owner.personId, owner.userAccountId, owner.aiEmployeeId] as const;

async function resetOnboardingForRelease(
  database: D1Database,
  owner: Identity,
  releaseId: string,
) {
  if (!/^[a-f0-9]{16}$/.test(releaseId)) return false;
  const existingReset = await database
    .prepare("SELECT id FROM audit_events WHERE tenant_id = ? AND user_account_id = ? AND event_type = 'onboarding.release_reset' AND detail = ? LIMIT 1")
    .bind(owner.tenantId, owner.userAccountId, releaseId)
    .first();
  if (existingReset) return false;
  const now = Date.now();
  await database.batch([
    database.prepare("UPDATE onboarding_profiles SET lifecycle_state = 'NEW', preferred_name = NULL, full_name = NULL, company = NULL, job_title = NULL, role_summary = NULL, team_size = NULL, responsibilities_json = NULL, biggest_pressure = NULL, first_scan_json = NULL, completed_at = NULL, updated_at = ? WHERE tenant_id = ? AND user_account_id = ?").bind(now, owner.tenantId, owner.userAccountId),
    database.prepare("INSERT INTO audit_events (id, tenant_id, person_id, user_account_id, ai_employee_id, event_type, resource_type, resource_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), ...identityBindings(owner), "onboarding.release_reset", "onboarding_profile", `onboarding_${owner.userAccountId}`, releaseId, now),
  ]);
  return true;
}

export async function GET(request: Request) {
  try {
    const owner = await identity();
    await seed(owner);
    const database = db();
    const releaseId = request.headers.get("x-parallel-release-id")?.trim() ?? "";
    const releaseReset = await resetOnboardingForRelease(database, owner, releaseId);
    const [profile, onboarding, policies, attention, commitments, usage, capabilities, recentMeetingKnowledge] = await Promise.all([
      database.prepare("SELECT morning_briefing_time, role_and_responsibilities, current_priorities, communication_style, proactivity, interruption_threshold, accountability_style, delegation_boundaries FROM decision_profiles WHERE tenant_id = ? AND user_account_id = ? LIMIT 1").bind(owner.tenantId, owner.userAccountId).first(),
      database.prepare("SELECT lifecycle_state, preferred_name, full_name, company, job_title, role_summary, team_size, responsibilities_json, biggest_pressure, microsoft_connected, first_scan_json, completed_at FROM onboarding_profiles WHERE tenant_id = ? AND user_account_id = ? LIMIT 1").bind(owner.tenantId, owner.userAccountId).first<Record<string, unknown>>(),
      database.prepare("SELECT key, value, scope, precedence FROM policy_rules WHERE tenant_id = ? ORDER BY precedence DESC, key ASC").bind(owner.tenantId).all(),
      database.prepare("SELECT id, source, external_id AS externalId, kind, title, summary, urgency, state, reason, occurred_at AS occurredAt FROM attention_items WHERE tenant_id = ? AND user_account_id = ? AND state = 'open' ORDER BY CASE urgency WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, occurred_at DESC LIMIT 12").bind(owner.tenantId, owner.userAccountId).all(),
      database.prepare("SELECT id, title, owner_label AS ownerLabel, due_at AS dueAt, status, source, feedback FROM commitments WHERE tenant_id = ? AND user_account_id = ? ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'snoozed' THEN 1 ELSE 2 END, due_at ASC, created_at DESC LIMIT 30").bind(owner.tenantId, owner.userAccountId).all(),
      database.prepare("SELECT COUNT(*) AS sessions, COALESCE(SUM(total_tokens), 0) AS totalTokens, COALESCE(SUM(CASE WHEN tier = 'C' THEN 1 ELSE 0 END), 0) AS tierC, COALESCE(SUM(CASE WHEN tier = 'D' THEN 1 ELSE 0 END), 0) AS tierD, COALESCE(SUM(input_tokens + output_tokens * 3 + audio_tokens * 8), 0) AS usageUnits FROM model_invocations WHERE tenant_id = ? AND created_at >= ?").bind(owner.tenantId, Date.now() - 30 * 86_400_000).first(),
      database.prepare("SELECT (SELECT COUNT(*) FROM meeting_knowledge_records WHERE tenant_id = ? AND user_account_id = ?) AS meetingKnowledge, (SELECT COUNT(*) FROM work_items WHERE tenant_id = ? AND user_account_id = ? AND ownership_role = 'owner' AND status = 'open') AS ownedWork, (SELECT COUNT(*) FROM work_items WHERE tenant_id = ? AND user_account_id = ? AND ownership_role = 'dependency' AND status = 'open') AS dependencies, (SELECT COUNT(*) FROM delegations WHERE tenant_id = ? AND user_account_id = ? AND status = 'proposed') AS pendingDelegations, (SELECT COUNT(*) FROM desktop_action_requests WHERE tenant_id = ? AND user_account_id = ? AND status = 'awaiting_companion') AS desktopRequests, (SELECT COUNT(*) FROM outbound_messages WHERE tenant_id = ? AND user_account_id = ? AND status = 'sent') AS outboundSent").bind(owner.tenantId, owner.userAccountId, owner.tenantId, owner.userAccountId, owner.tenantId, owner.userAccountId, owner.tenantId, owner.userAccountId, owner.tenantId, owner.userAccountId, owner.tenantId, owner.userAccountId).first(),
      database.prepare("SELECT id, subject, summary, lifecycle_state AS lifecycleState, updated_at AS updatedAt FROM meeting_knowledge_records WHERE tenant_id = ? AND user_account_id = ? ORDER BY updated_at DESC LIMIT 3").bind(owner.tenantId, owner.userAccountId).all(),
    ]);
    const parseJson = <T,>(value: unknown, fallback: T): T => {
      if (typeof value !== "string" || !value) return fallback;
      try {
        return JSON.parse(value) as T;
      } catch {
        return fallback;
      }
    };
    return Response.json({
      profile,
      onboarding: {
        lifecycle_state: onboarding?.lifecycle_state ?? "NEW",
        preferred_name: onboarding?.preferred_name ?? "",
        full_name: onboarding?.full_name ?? "",
        company: onboarding?.company ?? "",
        job_title: onboarding?.job_title ?? "",
        role_summary: onboarding?.role_summary ?? "",
        team_size: onboarding?.team_size ?? null,
        responsibilities: parseJson<string[]>(onboarding?.responsibilities_json, []),
        biggest_pressure: onboarding?.biggest_pressure ?? "",
        microsoft_connected: Boolean(onboarding?.microsoft_connected),
        first_day_scan: parseJson<Record<string, unknown> | null>(onboarding?.first_scan_json, null),
        completed_at: onboarding?.completed_at ?? null,
      },
      policies: policies.results,
      attention: attention.results,
      commitments: commitments.results,
      usage,
      capabilities,
      recentMeetingKnowledge: recentMeetingKnowledge.results,
      releaseReset,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Parallel workspace unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action ?? "");
    const owner = await identity();
    await seed(owner);
    const database = db();
    const now = Date.now();
    const ids = identityBindings(owner);

    if (action === "onboarding.reset_for_release") {
      const releaseId = String(body.releaseId ?? "").trim();
      if (!/^[a-f0-9]{16}$/.test(releaseId)) {
        return Response.json({ error: "A valid release identifier is required." }, { status: 400 });
      }
      const reset = await resetOnboardingForRelease(database, owner, releaseId);
      return Response.json({ reset, releaseId, microsoftConnectionPreserved: true });
    }

    if (action === "onboarding.save_identity") {
      const preferredName = String(body.preferredName ?? "").trim().slice(0, 80);
      const fullName = String(body.fullName ?? preferredName).trim().slice(0, 160);
      if (!preferredName) {
        return Response.json({ error: "A preferred name is required." }, { status: 400 });
      }
      await database.batch([
        database.prepare("UPDATE onboarding_profiles SET preferred_name = ?, full_name = ?, lifecycle_state = CASE WHEN lifecycle_state = 'NEW' THEN 'NAME_LEARNED' ELSE lifecycle_state END, updated_at = ? WHERE tenant_id = ? AND user_account_id = ?").bind(preferredName, fullName, now, owner.tenantId, owner.userAccountId),
        database.prepare("UPDATE people SET display_name = ? WHERE tenant_id = ? AND id = ?").bind(fullName || preferredName, owner.tenantId, owner.personId),
        database.prepare("INSERT INTO audit_events (id, tenant_id, person_id, user_account_id, ai_employee_id, event_type, resource_type, resource_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), ...ids, "onboarding.identity_learned", "onboarding_profile", `onboarding_${owner.userAccountId}`, "Preferred name learned during first meeting", now),
      ]);
      return Response.json({ saved: true, lifecycleState: "NAME_LEARNED" });
    }

    if (action === "onboarding.save_work_context") {
      const company = String(body.company ?? "").trim().slice(0, 180);
      const jobTitle = String(body.jobTitle ?? "").trim().slice(0, 180);
      const roleSummary = String(body.roleSummary ?? "").trim().slice(0, 1_600);
      const biggestPressure = String(body.biggestPressure ?? "").trim().slice(0, 600);
      const responsibilities = Array.isArray(body.responsibilities)
        ? body.responsibilities.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 20)
        : [];
      const teamSize = typeof body.teamSize === "number" && Number.isFinite(body.teamSize)
        ? Math.max(0, Math.min(10_000, Math.trunc(body.teamSize)))
        : null;
      if (!company && !jobTitle && !roleSummary) {
        return Response.json({ error: "Work context is required." }, { status: 400 });
      }
      const roleAndResponsibilities = [jobTitle && `Role: ${jobTitle}`, company && `Organization: ${company}`, roleSummary, responsibilities.length ? `Responsibilities: ${responsibilities.join("; ")}` : ""].filter(Boolean).join("\n");
      await database.batch([
        database.prepare("UPDATE onboarding_profiles SET company = ?, job_title = ?, role_summary = ?, team_size = ?, responsibilities_json = ?, biggest_pressure = ?, lifecycle_state = CASE WHEN lifecycle_state = 'COMPLETE' THEN 'COMPLETE' WHEN microsoft_connected = 1 THEN 'CONNECTION_READY' ELSE 'WORK_CONTEXT_LEARNED' END, updated_at = ? WHERE tenant_id = ? AND user_account_id = ?").bind(company, jobTitle, roleSummary, teamSize, JSON.stringify(responsibilities), biggestPressure, now, owner.tenantId, owner.userAccountId),
        database.prepare("UPDATE decision_profiles SET role_and_responsibilities = ?, current_priorities = CASE WHEN ? = '' THEN current_priorities ELSE ? END, updated_at = ? WHERE tenant_id = ? AND user_account_id = ?").bind(roleAndResponsibilities, biggestPressure, biggestPressure, now, owner.tenantId, owner.userAccountId),
        database.prepare("INSERT INTO audit_events (id, tenant_id, person_id, user_account_id, ai_employee_id, event_type, resource_type, resource_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), ...ids, "onboarding.work_context_learned", "onboarding_profile", `onboarding_${owner.userAccountId}`, "Work context learned during first meeting", now),
      ]);
      return Response.json({ saved: true });
    }

    if (action === "onboarding.connection_ready") {
      await database.prepare("UPDATE onboarding_profiles SET microsoft_connected = 1, lifecycle_state = CASE WHEN lifecycle_state = 'WORK_CONTEXT_LEARNED' THEN 'CONNECTION_READY' ELSE lifecycle_state END, updated_at = ? WHERE tenant_id = ? AND user_account_id = ?").bind(now, owner.tenantId, owner.userAccountId).run();
      return Response.json({ saved: true, microsoftConnected: true });
    }

    if (action === "onboarding.scan_saved") {
      const scanJson = JSON.stringify(body.scan ?? null);
      if (scanJson === "null" || scanJson.length > 40_000) {
        return Response.json({ error: "The workspace scan is not valid." }, { status: 400 });
      }
      await database.batch([
        database.prepare("UPDATE onboarding_profiles SET first_scan_json = ?, microsoft_connected = 1, lifecycle_state = CASE WHEN lifecycle_state = 'COMPLETE' THEN 'COMPLETE' ELSE 'FIRST_VALUE_DELIVERED' END, updated_at = ? WHERE tenant_id = ? AND user_account_id = ?").bind(scanJson, now, owner.tenantId, owner.userAccountId),
        database.prepare("INSERT INTO audit_events (id, tenant_id, person_id, user_account_id, ai_employee_id, event_type, resource_type, resource_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), ...ids, "onboarding.first_value_delivered", "workspace_scan", `onboarding_${owner.userAccountId}`, "Evidence-based first-day scan generated", now),
      ]);
      return Response.json({ saved: true, lifecycleState: "FIRST_VALUE_DELIVERED" });
    }

    if (action === "onboarding.complete") {
      const outcome = String(body.outcome ?? "First meeting completed").trim().slice(0, 500);
      await database.batch([
        database.prepare("UPDATE onboarding_profiles SET lifecycle_state = 'COMPLETE', completed_at = ?, updated_at = ? WHERE tenant_id = ? AND user_account_id = ?").bind(now, now, owner.tenantId, owner.userAccountId),
        database.prepare("INSERT INTO audit_events (id, tenant_id, person_id, user_account_id, ai_employee_id, event_type, resource_type, resource_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), ...ids, "onboarding.completed", "onboarding_profile", `onboarding_${owner.userAccountId}`, outcome, now),
      ]);
      return Response.json({ saved: true, lifecycleState: "COMPLETE" });
    }

    if (action === "profile.save") {
      const profile = (body.profile ?? {}) as Record<string, unknown>;
      const text = (key: string) => String(profile[key] ?? "").trim().slice(0, 600);
      const values = [text("morning_briefing_time"), text("role_and_responsibilities"), text("current_priorities"), text("communication_style"), text("proactivity"), text("interruption_threshold") || "high_signal", text("accountability_style") || "supportive_direct", text("delegation_boundaries") || "propose_before_action"];
      await database.batch([
        database.prepare("UPDATE decision_profiles SET morning_briefing_time = ?, role_and_responsibilities = ?, current_priorities = ?, communication_style = ?, proactivity = ?, interruption_threshold = ?, accountability_style = ?, delegation_boundaries = ?, updated_at = ? WHERE tenant_id = ? AND user_account_id = ?").bind(...values, now, owner.tenantId, owner.userAccountId),
        database.prepare("INSERT INTO memory_records (id, tenant_id, person_id, user_account_id, ai_employee_id, namespace, memory_key, value, source, confidence, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (tenant_id, user_account_id, namespace, memory_key) DO UPDATE SET value = excluded.value, source = excluded.source, confidence = excluded.confidence, updated_at = excluded.updated_at").bind(`memory_${owner.userAccountId}_priorities`, ...ids, "decision_profile", "current_priorities", values[2], "declared_by_user", 100, now, now),
        database.prepare("INSERT INTO audit_events (id, tenant_id, person_id, user_account_id, ai_employee_id, event_type, resource_type, resource_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), ...ids, "profile.updated", "decision_profile", `profile_${owner.userAccountId}`, "User-declared profile updated", now),
      ]);
      return Response.json({ saved: true });
    }

    if (action === "attention.sync") {
      const items = Array.isArray(body.items) ? body.items.slice(0, 50) as Array<Record<string, unknown>> : [];
      const statements = items.map((item) => {
        const source = ["outlook", "calendar", "teams"].includes(String(item.source)) ? String(item.source) : "outlook";
        const externalId = String(item.externalId ?? "").slice(0, 180);
        return database.prepare("INSERT INTO attention_items (id, tenant_id, person_id, user_account_id, ai_employee_id, source, external_id, kind, title, summary, urgency, state, reason, occurred_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?) ON CONFLICT (tenant_id, source, external_id) DO UPDATE SET title = excluded.title, summary = excluded.summary, urgency = excluded.urgency, reason = excluded.reason, occurred_at = excluded.occurred_at, updated_at = excluded.updated_at").bind(crypto.randomUUID(), ...ids, source, externalId, String(item.kind ?? "signal").slice(0, 40), String(item.title ?? "Needs attention").slice(0, 240), String(item.summary ?? "").slice(0, 400), ["high", "medium", "low"].includes(String(item.urgency)) ? String(item.urgency) : "low", String(item.reason ?? "Connected workspace signal").slice(0, 300), Number(item.occurredAt) || now, now);
      });
      if (statements.length) await database.batch(statements);
      const route = routeModelTask({ task: "attention_classification", modality: "none", risk: "low" });
      return Response.json({ synced: statements.length, route });
    }

    if (action === "commitment.create") {
      const title = String(body.title ?? "").trim().slice(0, 300);
      if (!title) return Response.json({ error: "A commitment needs a title." }, { status: 400 });
      const id = crypto.randomUUID();
      const dueAt = typeof body.dueAt === "number" && Number.isFinite(body.dueAt) ? body.dueAt : null;
      await database.batch([
        database.prepare("INSERT INTO commitments (id, tenant_id, person_id, user_account_id, ai_employee_id, title, owner_label, due_at, status, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)").bind(id, ...ids, title, String(body.ownerLabel ?? owner.displayName).slice(0, 120), dueAt, String(body.source ?? "user").slice(0, 80), now, now),
        database.prepare("INSERT INTO audit_events (id, tenant_id, person_id, user_account_id, ai_employee_id, event_type, resource_type, resource_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), ...ids, "commitment.created", "commitment", id, title, now),
      ]);
      return Response.json({ created: true, id });
    }

    if (action === "commitment.update") {
      const id = String(body.id ?? "");
      const status = ["open", "completed", "snoozed"].includes(String(body.status)) ? String(body.status) : "open";
      const feedback = body.feedback == null ? null : String(body.feedback).slice(0, 120);
      const result = await database.prepare("UPDATE commitments SET status = ?, feedback = ?, updated_at = ? WHERE tenant_id = ? AND user_account_id = ? AND id = ?").bind(status, feedback, now, owner.tenantId, owner.userAccountId, id).run();
      return Response.json({ updated: (result.meta.changes ?? 0) > 0 });
    }

    if (action === "meeting.record") {
      const transcriptSourceId = String(body.transcriptSourceId ?? "").trim().slice(0, 240);
      const subject = String(body.subject ?? "Meeting notes").trim().slice(0, 300);
      const summary = String(body.summary ?? "").trim().slice(0, 4_000);
      const safeJson = (value: unknown) => JSON.stringify(Array.isArray(value) ? value.slice(0, 100) : []);
      const id = crypto.randomUUID();
      await database.batch([
        database.prepare("INSERT INTO meeting_knowledge_records (id, tenant_id, person_id, user_account_id, ai_employee_id, external_meeting_id, transcript_source_id, subject, summary, decisions_json, actions_json, risks_json, questions_json, lifecycle_state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'POST_MEETING_ANALYSIS', ?, ?) ON CONFLICT (tenant_id, transcript_source_id) DO UPDATE SET subject = excluded.subject, summary = excluded.summary, decisions_json = excluded.decisions_json, actions_json = excluded.actions_json, risks_json = excluded.risks_json, questions_json = excluded.questions_json, lifecycle_state = excluded.lifecycle_state, updated_at = excluded.updated_at").bind(id, ...ids, String(body.externalMeetingId ?? "").slice(0, 240) || null, transcriptSourceId || null, subject, summary, safeJson(body.decisions), safeJson(body.actions), safeJson(body.risks), safeJson(body.questions), now, now),
        database.prepare("INSERT INTO audit_events (id, tenant_id, person_id, user_account_id, ai_employee_id, event_type, resource_type, resource_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), ...ids, "meeting.knowledge_recorded", "meeting_knowledge", transcriptSourceId || id, subject, now),
      ]);
      return Response.json({ recorded: true });
    }

    if (action === "work.create") {
      const title = String(body.title ?? "").trim().slice(0, 300);
      if (!title) return Response.json({ error: "A work item needs a title." }, { status: 400 });
      const role = ["owner", "dependency", "unclear"].includes(String(body.ownershipRole)) ? String(body.ownershipRole) : "unclear";
      const sourceKey = String(body.sourceKey ?? crypto.randomUUID()).slice(0, 240);
      const id = crypto.randomUUID();
      const dueAt = typeof body.dueAt === "number" && Number.isFinite(body.dueAt) ? body.dueAt : null;
      await database.prepare("INSERT INTO work_items (id, tenant_id, person_id, user_account_id, ai_employee_id, source_key, title, owner_label, ownership_role, ownership_basis, ownership_confidence, due_at, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?) ON CONFLICT (tenant_id, source_key) DO UPDATE SET title = excluded.title, owner_label = excluded.owner_label, ownership_role = excluded.ownership_role, ownership_basis = excluded.ownership_basis, ownership_confidence = excluded.ownership_confidence, due_at = excluded.due_at, updated_at = excluded.updated_at").bind(id, ...ids, sourceKey, title, String(body.ownerLabel ?? "Unclear").slice(0, 120), role, String(body.ownershipBasis ?? "ambiguous").slice(0, 80), Math.max(0, Math.min(100, Number(body.ownershipConfidence) || 0)), dueAt, now, now).run();
      return Response.json({ created: true, id, ownershipRole: role, araMayAct: role === "owner" });
    }

    if (action === "delegation.propose") {
      const workItemId = String(body.workItemId ?? "").slice(0, 120);
      const toPersonLabel = String(body.toPersonLabel ?? "").trim().slice(0, 120);
      if (!workItemId || !toPersonLabel) return Response.json({ error: "A delegation needs work and a recipient." }, { status: 400 });
      const id = crypto.randomUUID();
      await database.prepare("INSERT INTO delegations (id, tenant_id, person_id, user_account_id, ai_employee_id, work_item_id, from_person_id, to_person_label, status, created_at, updated_at) SELECT ?, ?, ?, ?, ?, id, ?, ?, 'proposed', ?, ? FROM work_items WHERE tenant_id = ? AND user_account_id = ? AND id = ?").bind(id, ...ids, owner.personId, toPersonLabel, now, now, owner.tenantId, owner.userAccountId, workItemId).run();
      return Response.json({ proposed: true, id, status: "proposed" });
    }

    if (action === "desktop.prepare") {
      const id = crypto.randomUUID();
      await database.prepare("INSERT INTO desktop_action_requests (id, tenant_id, person_id, user_account_id, ai_employee_id, application, action, target, status, authority, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_companion', 'prepare_only', ?, ?)").bind(id, ...ids, String(body.application ?? "Desktop").slice(0, 100), String(body.desktopAction ?? "open").slice(0, 100), String(body.target ?? "").slice(0, 500), now, now).run();
      return Response.json({ prepared: true, id, status: "awaiting_companion", executed: false });
    }

    if (action === "outbound.record") {
      const id = crypto.randomUUID();
      const status = body.sent === true ? "sent" : "draft";
      await database.prepare("INSERT INTO outbound_messages (id, tenant_id, person_id, user_account_id, ai_employee_id, channel, recipient, subject, body, status, sent_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(id, ...ids, String(body.channel ?? "outlook").slice(0, 40), String(body.recipient ?? "").slice(0, 240), String(body.subject ?? "").slice(0, 300), String(body.message ?? "").slice(0, 10_000), status, status === "sent" ? now : null, now, now).run();
      return Response.json({ recorded: true, id, status });
    }

    if (action === "usage.record") {
      const usage = (body.usage ?? {}) as Record<string, unknown>;
      const route = routeModelTask({ task: "voice_conversation", modality: "audio" });
      const id = crypto.randomUUID();
      const inputTokens = Number(usage.inputTokens) || 0;
      const outputTokens = Number(usage.outputTokens) || 0;
      const audioTokens = (Number(usage.inputAudioTokens) || 0) + (Number(usage.outputAudioTokens) || 0);
      await database.prepare("INSERT INTO model_invocations (id, tenant_id, person_id, user_account_id, ai_employee_id, session_id, task, tier, provider, model, input_tokens, output_tokens, audio_tokens, total_tokens, latency_ms, confidence, changed_final_action, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'openai', ?, ?, ?, ?, ?, ?, 100, 0, ?)").bind(id, ...ids, String(body.sessionId ?? "").slice(0, 120), "voice_conversation", route.tier, route.model, inputTokens, outputTokens, audioTokens, Number(usage.totalTokens) || 0, Number(body.durationMs) || 0, now).run();
      return Response.json({ recorded: true, usageUnits: estimatedUsageUnits({ inputTokens, outputTokens, audioTokens }), route });
    }

    return Response.json({ error: "Unknown platform action." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Parallel could not save the update." }, { status: 503 });
  }
}
