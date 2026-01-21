CREATE TABLE `items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`parentId` int,
	`basePrice` decimal(10,2) NOT NULL,
	`iconUrl` text,
	`imageUrl` text,
	`isPopular` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `items_id` PRIMARY KEY(`id`),
	CONSTRAINT `items_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `promoCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`discountType` enum('percentage','fixed') NOT NULL,
	`discountValue` decimal(10,2) NOT NULL,
	`minOrderValue` decimal(10,2),
	`maxDiscount` decimal(10,2),
	`validFrom` timestamp NOT NULL,
	`validUntil` timestamp NOT NULL,
	`maxUses` int,
	`currentUses` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promoCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promoCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `savedQuotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` varchar(100) NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerName` varchar(255),
	`customerPhone` varchar(20),
	`serviceType` enum('HAUL_AWAY','LABOR_ONLY') NOT NULL,
	`itemsJson` json NOT NULL,
	`locationJson` json NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`discount` decimal(10,2) NOT NULL DEFAULT '0',
	`totalPrice` decimal(10,2) NOT NULL,
	`promoCodeUsed` varchar(50),
	`expiresAt` timestamp NOT NULL,
	`convertedToJobId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedQuotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `savedQuotes_quoteId_unique` UNIQUE(`quoteId`)
);
--> statement-breakpoint
ALTER TABLE `items` ADD CONSTRAINT `items_parentId_items_id_fk` FOREIGN KEY (`parentId`) REFERENCES `items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `items_parentId_idx` ON `items` (`parentId`);--> statement-breakpoint
CREATE INDEX `items_isPopular_idx` ON `items` (`isPopular`);--> statement-breakpoint
CREATE INDEX `promoCodes_isActive_idx` ON `promoCodes` (`isActive`);--> statement-breakpoint
CREATE INDEX `savedQuotes_customerEmail_idx` ON `savedQuotes` (`customerEmail`);--> statement-breakpoint
CREATE INDEX `savedQuotes_expiresAt_idx` ON `savedQuotes` (`expiresAt`);