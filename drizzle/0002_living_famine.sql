CREATE TABLE `onboarding_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`person_id` text NOT NULL,
	`user_account_id` text NOT NULL,
	`ai_employee_id` text NOT NULL,
	`lifecycle_state` text DEFAULT 'NEW' NOT NULL,
	`preferred_name` text DEFAULT '' NOT NULL,
	`full_name` text DEFAULT '' NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`job_title` text DEFAULT '' NOT NULL,
	`role_summary` text DEFAULT '' NOT NULL,
	`team_size` integer,
	`responsibilities_json` text DEFAULT '[]' NOT NULL,
	`biggest_pressure` text DEFAULT '' NOT NULL,
	`microsoft_connected` integer DEFAULT false NOT NULL,
	`first_scan_json` text,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `onboarding_tenant_user_idx` ON `onboarding_profiles` (`tenant_id`,`user_account_id`);--> statement-breakpoint
CREATE INDEX `onboarding_tenant_state_idx` ON `onboarding_profiles` (`tenant_id`,`lifecycle_state`);