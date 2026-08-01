CREATE TABLE `delegations` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`person_id` text NOT NULL,
	`user_account_id` text NOT NULL,
	`ai_employee_id` text NOT NULL,
	`work_item_id` text NOT NULL,
	`from_person_id` text NOT NULL,
	`to_person_label` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `delegation_tenant_status_idx` ON `delegations` (`tenant_id`,`status`);--> statement-breakpoint
CREATE TABLE `desktop_action_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`person_id` text NOT NULL,
	`user_account_id` text NOT NULL,
	`ai_employee_id` text NOT NULL,
	`application` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`status` text NOT NULL,
	`authority` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `desktop_action_tenant_status_idx` ON `desktop_action_requests` (`tenant_id`,`status`);--> statement-breakpoint
CREATE TABLE `meeting_knowledge_records` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`person_id` text NOT NULL,
	`user_account_id` text NOT NULL,
	`ai_employee_id` text NOT NULL,
	`external_meeting_id` text,
	`transcript_source_id` text,
	`subject` text NOT NULL,
	`summary` text NOT NULL,
	`decisions_json` text NOT NULL,
	`actions_json` text NOT NULL,
	`risks_json` text NOT NULL,
	`questions_json` text NOT NULL,
	`lifecycle_state` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `meeting_knowledge_tenant_updated_idx` ON `meeting_knowledge_records` (`tenant_id`,`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `meeting_knowledge_tenant_transcript_idx` ON `meeting_knowledge_records` (`tenant_id`,`transcript_source_id`);--> statement-breakpoint
CREATE TABLE `outbound_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`person_id` text NOT NULL,
	`user_account_id` text NOT NULL,
	`ai_employee_id` text NOT NULL,
	`channel` text NOT NULL,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`status` text NOT NULL,
	`sent_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `outbound_tenant_status_idx` ON `outbound_messages` (`tenant_id`,`status`);--> statement-breakpoint
CREATE TABLE `work_items` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`person_id` text NOT NULL,
	`user_account_id` text NOT NULL,
	`ai_employee_id` text NOT NULL,
	`source_key` text NOT NULL,
	`title` text NOT NULL,
	`owner_label` text NOT NULL,
	`ownership_role` text NOT NULL,
	`ownership_basis` text NOT NULL,
	`ownership_confidence` integer NOT NULL,
	`due_at` integer,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `work_item_tenant_source_idx` ON `work_items` (`tenant_id`,`source_key`);--> statement-breakpoint
CREATE INDEX `work_item_tenant_role_status_idx` ON `work_items` (`tenant_id`,`ownership_role`,`status`);