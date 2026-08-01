CREATE TABLE `ai_employees` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `attention_items` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`person_id` text NOT NULL,
	`user_account_id` text NOT NULL,
	`ai_employee_id` text NOT NULL,
	`source` text NOT NULL,
	`external_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`urgency` text NOT NULL,
	`state` text NOT NULL,
	`reason` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attention_tenant_source_external_idx` ON `attention_items` (`tenant_id`,`source`,`external_id`);--> statement-breakpoint
CREATE INDEX `attention_tenant_state_urgency_idx` ON `attention_items` (`tenant_id`,`state`,`urgency`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`person_id` text NOT NULL,
	`user_account_id` text NOT NULL,
	`ai_employee_id` text NOT NULL,
	`event_type` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`detail` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_tenant_created_idx` ON `audit_events` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `commitments` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`person_id` text NOT NULL,
	`user_account_id` text NOT NULL,
	`ai_employee_id` text NOT NULL,
	`title` text NOT NULL,
	`owner_label` text NOT NULL,
	`due_at` integer,
	`status` text NOT NULL,
	`source` text NOT NULL,
	`feedback` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `commitment_tenant_status_due_idx` ON `commitments` (`tenant_id`,`status`,`due_at`);--> statement-breakpoint
CREATE TABLE `decision_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`person_id` text NOT NULL,
	`user_account_id` text NOT NULL,
	`ai_employee_id` text NOT NULL,
	`morning_briefing_time` text DEFAULT '' NOT NULL,
	`role_and_responsibilities` text DEFAULT '' NOT NULL,
	`current_priorities` text DEFAULT '' NOT NULL,
	`communication_style` text DEFAULT '' NOT NULL,
	`proactivity` text DEFAULT '' NOT NULL,
	`interruption_threshold` text DEFAULT 'high_signal' NOT NULL,
	`accountability_style` text DEFAULT 'supportive_direct' NOT NULL,
	`delegation_boundaries` text DEFAULT 'propose_before_action' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `decision_profile_tenant_user_idx` ON `decision_profiles` (`tenant_id`,`user_account_id`);--> statement-breakpoint
CREATE TABLE `memory_records` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`person_id` text NOT NULL,
	`user_account_id` text NOT NULL,
	`ai_employee_id` text NOT NULL,
	`namespace` text NOT NULL,
	`memory_key` text NOT NULL,
	`value` text NOT NULL,
	`source` text NOT NULL,
	`confidence` integer DEFAULT 100 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memory_tenant_user_key_idx` ON `memory_records` (`tenant_id`,`user_account_id`,`namespace`,`memory_key`);--> statement-breakpoint
CREATE TABLE `model_invocations` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`person_id` text NOT NULL,
	`user_account_id` text NOT NULL,
	`ai_employee_id` text NOT NULL,
	`session_id` text,
	`task` text NOT NULL,
	`tier` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`escalation_reason` text,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`audio_tokens` integer DEFAULT 0 NOT NULL,
	`total_tokens` integer DEFAULT 0 NOT NULL,
	`latency_ms` integer DEFAULT 0 NOT NULL,
	`confidence` integer DEFAULT 100 NOT NULL,
	`changed_final_action` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `model_usage_tenant_created_idx` ON `model_invocations` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `ownership_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`person_id` text NOT NULL,
	`user_account_id` text NOT NULL,
	`ai_employee_id` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text NOT NULL,
	`authority` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ownership_tenant_resource_idx` ON `ownership_assignments` (`tenant_id`,`resource_type`,`resource_id`);--> statement-breakpoint
CREATE TABLE `people` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`display_name` text NOT NULL,
	`email` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `people_tenant_email_idx` ON `people` (`tenant_id`,`email`);--> statement-breakpoint
CREATE TABLE `policy_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`scope` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`precedence` integer NOT NULL,
	`source` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `policy_tenant_scope_key_idx` ON `policy_rules` (`tenant_id`,`scope`,`key`);--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`person_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_subject` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_tenant_provider_subject_idx` ON `user_accounts` (`tenant_id`,`provider`,`provider_subject`);