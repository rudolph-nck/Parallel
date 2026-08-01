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
    displayName: user?.displayName ?? "Nick Rudolph",
    email: user?.email ?? "rudolph.nck@gmail.com",
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
    database.prepare("INSERT OR IGNORE INTO ownership_assignments (id, tenant_id, person_id, user_account_id, ai_employee_id, resource_type, resource_id, authority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(`ownership_${owner.aiEmployeeId}`, owner.tenantId, owner.personId, owner.userAccountId, owner.aiEmployeeId, "workspace", owner.tenantId, "read_analyze_propose", now),
    database.prepare("INSERT OR IGNORE INTO policy_rules (id, tenant_id, scope, key, value, precedence, source, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(`policy_${owner.tenantId}_external_actions`, owner.tenantId, "organization", "external_actions", "confirm_consequential_actions", 100, "parallel_constitution", now),
    database.prepare("INSERT OR IGNORE INTO policy_rules (id, tenant_id, scope, key, value, precedence, source, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(`policy_${owner.tenantId}_declared_goals`, owner.tenantId, "person", "declared_goals", "override_observed_avoidance", 200, "decision_profile", now),
    database.prepare("INSERT OR IGNORE INTO policy_rules (id, tenant_id, scope, key, value, precedence, source, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(`policy_${owner.tenantId}_monitoring`, owner.tenantId, "organization", "attention_monitoring", "read_only", 100, "parallel_constitution", now),
  ]);
}

const identityBindings = (owner: Identity) => [owner.tenantId, owner.personId, owner.userAccountId, owner.aiEmployeeId] as const;

export async function GET() {
  try {
    const owner = await identity();
    await seed(owner);
    const database = db();
    const [profile, policies, attention, commitments, usage] = await Promise.all([
      database.prepare("SELECT morning_briefing_time, role_and_responsibilities, current_priorities, communication_style, proactivity, interruption_threshold, accountability_style, delegation_boundaries FROM decision_profiles WHERE tenant_id = ? AND user_account_id = ? LIMIT 1").bind(owner.tenantId, owner.userAccountId).first(),
      database.prepare("SELECT key, value, scope, precedence FROM policy_rules WHERE tenant_id = ? ORDER BY precedence DESC, key ASC").bind(owner.tenantId).all(),
      database.prepare("SELECT id, source, external_id AS externalId, kind, title, summary, urgency, state, reason, occurred_at AS occurredAt FROM attention_items WHERE tenant_id = ? AND user_account_id = ? AND state = 'open' ORDER BY CASE urgency WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, occurred_at DESC LIMIT 12").bind(owner.tenantId, owner.userAccountId).all(),
      database.prepare("SELECT id, title, owner_label AS ownerLabel, due_at AS dueAt, status, source, feedback FROM commitments WHERE tenant_id = ? AND user_account_id = ? ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'snoozed' THEN 1 ELSE 2 END, due_at ASC, created_at DESC LIMIT 30").bind(owner.tenantId, owner.userAccountId).all(),
      database.prepare("SELECT COUNT(*) AS sessions, COALESCE(SUM(total_tokens), 0) AS totalTokens, COALESCE(SUM(CASE WHEN tier = 'C' THEN 1 ELSE 0 END), 0) AS tierC, COALESCE(SUM(CASE WHEN tier = 'D' THEN 1 ELSE 0 END), 0) AS tierD, COALESCE(SUM(input_tokens + output_tokens * 3 + audio_tokens * 8), 0) AS usageUnits FROM model_invocations WHERE tenant_id = ? AND created_at >= ?").bind(owner.tenantId, Date.now() - 30 * 86_400_000).first(),
    ]);
    return Response.json({ profile, policies: policies.results, attention: attention.results, commitments: commitments.results, usage });
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
