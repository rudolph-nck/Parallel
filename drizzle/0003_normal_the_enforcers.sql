ALTER TABLE `onboarding_profiles` ADD `systems_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `onboarding_profiles` ADD `communication_channels_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `onboarding_profiles` ADD `systemic_pressure` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `onboarding_profiles` ADD `protected_work` text DEFAULT '' NOT NULL;