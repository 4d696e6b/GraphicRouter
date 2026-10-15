CREATE TABLE `decks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`latest_version` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `canva_imports` (
	`deck_id` text NOT NULL,
	`version` integer NOT NULL,
	`state` text NOT NULL,
	PRIMARY KEY(`deck_id`, `version`),
	FOREIGN KEY (`deck_id`) REFERENCES `decks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `canva_oauth_states` (
	`hash` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`verifier` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `canva_tokens` (
	`owner` text PRIMARY KEY NOT NULL,
	`encrypted` text NOT NULL,
	`refresh_lock_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `deck_versions` (
	`deck_id` text NOT NULL,
	`version` integer NOT NULL,
	`blueprint` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`deck_id`, `version`),
	FOREIGN KEY (`deck_id`) REFERENCES `decks`(`id`) ON UPDATE no action ON DELETE no action
);
