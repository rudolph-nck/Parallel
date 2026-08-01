import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const identityColumns = {
  tenantId: text("tenant_id").notNull(),
  personId: text("person_id").notNull(),
  userAccountId: text("user_account_id").notNull(),
  aiEmployeeId: text("ai_employee_id").notNull(),
};

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const people = sqliteTable("people", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  createdAt: integer("created_at").notNull(),
}, (table) => [uniqueIndex("people_tenant_email_idx").on(table.tenantId, table.email)]);

export const userAccounts = sqliteTable("user_accounts", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  personId: text("person_id").notNull(),
  provider: text("provider").notNull(),
  providerSubject: text("provider_subject").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [uniqueIndex("users_tenant_provider_subject_idx").on(table.tenantId, table.provider, table.providerSubject)]);

export const aiEmployees = sqliteTable("ai_employees", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const ownershipAssignments = sqliteTable("ownership_assignments", {
  id: text("id").primaryKey(),
  ...identityColumns,
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  authority: text("authority").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("ownership_tenant_resource_idx").on(table.tenantId, table.resourceType, table.resourceId)]);

export const decisionProfiles = sqliteTable("decision_profiles", {
  id: text("id").primaryKey(),
  ...identityColumns,
  morningBriefingTime: text("morning_briefing_time").notNull().default(""),
  roleAndResponsibilities: text("role_and_responsibilities").notNull().default(""),
  currentPriorities: text("current_priorities").notNull().default(""),
  communicationStyle: text("communication_style").notNull().default(""),
  proactivity: text("proactivity").notNull().default(""),
  interruptionThreshold: text("interruption_threshold").notNull().default("high_signal"),
  accountabilityStyle: text("accountability_style").notNull().default("supportive_direct"),
  delegationBoundaries: text("delegation_boundaries").notNull().default("propose_before_action"),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [uniqueIndex("decision_profile_tenant_user_idx").on(table.tenantId, table.userAccountId)]);

export const policyRules = sqliteTable("policy_rules", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  scope: text("scope").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  precedence: integer("precedence").notNull(),
  source: text("source").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [uniqueIndex("policy_tenant_scope_key_idx").on(table.tenantId, table.scope, table.key)]);

export const memoryRecords = sqliteTable("memory_records", {
  id: text("id").primaryKey(),
  ...identityColumns,
  namespace: text("namespace").notNull(),
  memoryKey: text("memory_key").notNull(),
  value: text("value").notNull(),
  source: text("source").notNull(),
  confidence: integer("confidence").notNull().default(100),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [uniqueIndex("memory_tenant_user_key_idx").on(table.tenantId, table.userAccountId, table.namespace, table.memoryKey)]);

export const attentionItems = sqliteTable("attention_items", {
  id: text("id").primaryKey(),
  ...identityColumns,
  source: text("source").notNull(),
  externalId: text("external_id").notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  urgency: text("urgency").notNull(),
  state: text("state").notNull(),
  reason: text("reason").notNull(),
  occurredAt: integer("occurred_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  uniqueIndex("attention_tenant_source_external_idx").on(table.tenantId, table.source, table.externalId),
  index("attention_tenant_state_urgency_idx").on(table.tenantId, table.state, table.urgency),
]);

export const commitments = sqliteTable("commitments", {
  id: text("id").primaryKey(),
  ...identityColumns,
  title: text("title").notNull(),
  ownerLabel: text("owner_label").notNull(),
  dueAt: integer("due_at"),
  status: text("status").notNull(),
  source: text("source").notNull(),
  feedback: text("feedback"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [index("commitment_tenant_status_due_idx").on(table.tenantId, table.status, table.dueAt)]);

export const modelInvocations = sqliteTable("model_invocations", {
  id: text("id").primaryKey(),
  ...identityColumns,
  sessionId: text("session_id"),
  task: text("task").notNull(),
  tier: text("tier").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  escalationReason: text("escalation_reason"),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  audioTokens: integer("audio_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  latencyMs: integer("latency_ms").notNull().default(0),
  confidence: integer("confidence").notNull().default(100),
  changedFinalAction: integer("changed_final_action", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("model_usage_tenant_created_idx").on(table.tenantId, table.createdAt)]);

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  ...identityColumns,
  eventType: text("event_type").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  detail: text("detail").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("audit_tenant_created_idx").on(table.tenantId, table.createdAt)]);

export const meetingKnowledgeRecords = sqliteTable("meeting_knowledge_records", {
  id: text("id").primaryKey(),
  ...identityColumns,
  externalMeetingId: text("external_meeting_id"),
  transcriptSourceId: text("transcript_source_id"),
  subject: text("subject").notNull(),
  summary: text("summary").notNull(),
  decisionsJson: text("decisions_json").notNull(),
  actionsJson: text("actions_json").notNull(),
  risksJson: text("risks_json").notNull(),
  questionsJson: text("questions_json").notNull(),
  lifecycleState: text("lifecycle_state").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  index("meeting_knowledge_tenant_updated_idx").on(table.tenantId, table.updatedAt),
  uniqueIndex("meeting_knowledge_tenant_transcript_idx").on(table.tenantId, table.transcriptSourceId),
]);

export const workItems = sqliteTable("work_items", {
  id: text("id").primaryKey(),
  ...identityColumns,
  sourceKey: text("source_key").notNull(),
  title: text("title").notNull(),
  ownerLabel: text("owner_label").notNull(),
  ownershipRole: text("ownership_role").notNull(),
  ownershipBasis: text("ownership_basis").notNull(),
  ownershipConfidence: integer("ownership_confidence").notNull(),
  dueAt: integer("due_at"),
  status: text("status").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  uniqueIndex("work_item_tenant_source_idx").on(table.tenantId, table.sourceKey),
  index("work_item_tenant_role_status_idx").on(table.tenantId, table.ownershipRole, table.status),
]);

export const delegations = sqliteTable("delegations", {
  id: text("id").primaryKey(),
  ...identityColumns,
  workItemId: text("work_item_id").notNull(),
  fromPersonId: text("from_person_id").notNull(),
  toPersonLabel: text("to_person_label").notNull(),
  status: text("status").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [index("delegation_tenant_status_idx").on(table.tenantId, table.status)]);

export const desktopActionRequests = sqliteTable("desktop_action_requests", {
  id: text("id").primaryKey(),
  ...identityColumns,
  application: text("application").notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  status: text("status").notNull(),
  authority: text("authority").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [index("desktop_action_tenant_status_idx").on(table.tenantId, table.status)]);

export const outboundMessages = sqliteTable("outbound_messages", {
  id: text("id").primaryKey(),
  ...identityColumns,
  channel: text("channel").notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull(),
  sentAt: integer("sent_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [index("outbound_tenant_status_idx").on(table.tenantId, table.status)]);
