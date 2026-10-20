CREATE TABLE IF NOT EXISTS `contributions` (
	`id` text PRIMARY KEY NOT NULL,
	`place_id` text,
	`place_name` text NOT NULL,
	`topic` text NOT NULL,
	`note` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`reviewed_at` text,
	`session_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `moderation_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`contribution_id` text NOT NULL,
	`action` text NOT NULL,
	`created_at` text NOT NULL
);
