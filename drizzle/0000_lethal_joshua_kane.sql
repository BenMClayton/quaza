CREATE TABLE `worlds` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`seed` integer NOT NULL,
	`snapshot` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_worlds_owner` ON `worlds` (`owner_id`);--> statement-breakpoint
CREATE INDEX `idx_worlds_updated` ON `worlds` (`updated_at`);