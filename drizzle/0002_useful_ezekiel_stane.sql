CREATE TABLE `explorer_library` (
	`user_id` text PRIMARY KEY NOT NULL,
	`saved` text DEFAULT '[]' NOT NULL,
	`plans` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `explorer_users`(`id`) ON UPDATE no action ON DELETE no action
);
