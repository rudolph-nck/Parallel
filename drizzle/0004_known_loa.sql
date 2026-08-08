ALTER TABLE `onboarding_profiles` ADD `organization_employee_count` integer;--> statement-breakpoint
ALTER TABLE `onboarding_profiles` ADD `organization_asset_size` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `onboarding_profiles` ADD `direct_reports` integer;--> statement-breakpoint
ALTER TABLE `onboarding_profiles` ADD `reports_to` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `onboarding_profiles` ADD `reporting_structure` text DEFAULT '' NOT NULL;