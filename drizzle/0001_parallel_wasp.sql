CREATE TABLE `addons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceAreaId` varchar(100) NOT NULL,
	`addonType` enum('stairs_1','stairs_2plus','long_carry','heavy','mattress','appliances','same_day') NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `addons_id` PRIMARY KEY(`id`),
	CONSTRAINT `addons_area_addon_unique` UNIQUE(`serviceAreaId`,`addonType`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50),
	`entityId` varchar(100),
	`metadata` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` varchar(100) NOT NULL,
	`jobId` varchar(100) NOT NULL,
	`customerId` int NOT NULL,
	`driverId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeCustomerId` varchar(255),
	`defaultPaymentMethodId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disposalCaps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceAreaId` varchar(100) NOT NULL,
	`volumeTier` enum('1_8','1_4','1_2','3_4','full') NOT NULL,
	`capAmount` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `disposalCaps_id` PRIMARY KEY(`id`),
	CONSTRAINT `disposalCaps_area_tier_unique` UNIQUE(`serviceAreaId`,`volumeTier`)
);
--> statement-breakpoint
CREATE TABLE `distanceRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceAreaId` varchar(100) NOT NULL,
	`minMiles` decimal(10,2) NOT NULL,
	`maxMiles` decimal(10,2),
	`surcharge` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `distanceRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `driverDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`driverId` int NOT NULL,
	`documentType` varchar(50) NOT NULL,
	`fileUrl` text NOT NULL,
	`storageKey` text NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `driverDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `driverLocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`driverId` int NOT NULL,
	`lat` decimal(10,7) NOT NULL,
	`lng` decimal(10,7) NOT NULL,
	`heading` decimal(5,2),
	`speed` decimal(5,2),
	`accuracy` decimal(10,2),
	`timestamp` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `driverLocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `driverStrikes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`driverId` int NOT NULL,
	`jobId` varchar(100),
	`reason` text NOT NULL,
	`severity` enum('minor','major','critical') NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `driverStrikes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending','approved','blocked') NOT NULL DEFAULT 'pending',
	`isOnline` boolean NOT NULL DEFAULT false,
	`vehicleType` varchar(50),
	`vehicleCapacity` decimal(10,2),
	`liftingLimit` int,
	`canHaulAway` boolean NOT NULL DEFAULT false,
	`canLaborOnly` boolean NOT NULL DEFAULT false,
	`insuranceProvider` varchar(255),
	`insurancePolicyNumber` varchar(255),
	`insuranceExpiresAt` timestamp,
	`acceptanceRate` decimal(5,2) NOT NULL DEFAULT '0',
	`cancelRate` decimal(5,2) NOT NULL DEFAULT '0',
	`totalOffers` int NOT NULL DEFAULT 0,
	`totalAccepted` int NOT NULL DEFAULT 0,
	`totalCompleted` int NOT NULL DEFAULT 0,
	`totalCancelled` int NOT NULL DEFAULT 0,
	`averageRating` decimal(3,2),
	`totalRatings` int NOT NULL DEFAULT 0,
	`stripeAccountId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drivers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `haulAwayDetails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` varchar(100) NOT NULL,
	`volumeTier` enum('1_8','1_4','1_2','3_4','full') NOT NULL,
	`addonsJson` json,
	`disposalCap` decimal(10,2) NOT NULL,
	`distanceBand` varchar(50),
	`sameDay` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `haulAwayDetails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` varchar(100) NOT NULL,
	`driverId` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobOffers` (
	`id` varchar(100) NOT NULL,
	`jobId` varchar(100) NOT NULL,
	`driverId` int NOT NULL,
	`wave` int NOT NULL,
	`status` enum('pending','accepted','rejected','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobOffers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobPhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` varchar(100) NOT NULL,
	`photoType` enum('customer_upload','before','after','receipt') NOT NULL,
	`fileUrl` text NOT NULL,
	`storageKey` text NOT NULL,
	`caption` text,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jobPhotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` varchar(100) NOT NULL,
	`customerId` int NOT NULL,
	`serviceAreaId` varchar(100) NOT NULL,
	`jobType` enum('HAUL_AWAY','LABOR_ONLY') NOT NULL,
	`status` enum('draft','quoted','dispatching','assigned','en_route','arrived','started','completed','cancelled','no_coverage') NOT NULL DEFAULT 'draft',
	`contactName` varchar(255) NOT NULL,
	`contactPhone` varchar(20) NOT NULL,
	`contactEmail` varchar(320),
	`pickupAddress` text NOT NULL,
	`pickupLat` decimal(10,7) NOT NULL,
	`pickupLng` decimal(10,7) NOT NULL,
	`pickupUnit` varchar(50),
	`pickupNotes` text,
	`servicePrice` decimal(10,2),
	`disposalCap` decimal(10,2),
	`total` decimal(10,2),
	`platformFee` decimal(10,2),
	`driverPayout` decimal(10,2),
	`paidAt` timestamp,
	`scheduledFor` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `laborOnlyDetails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` varchar(100) NOT NULL,
	`helpersCount` int NOT NULL,
	`hoursBooked` int NOT NULL,
	`laborScopeNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `laborOnlyDetails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `laborRates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceAreaId` varchar(100) NOT NULL,
	`helpersCount` int NOT NULL,
	`hourlyRate` decimal(10,2) NOT NULL,
	`minimumHours` int NOT NULL DEFAULT 2,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `laborRates_id` PRIMARY KEY(`id`),
	CONSTRAINT `laborRates_area_helpers_unique` UNIQUE(`serviceAreaId`,`helpersCount`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` varchar(100) NOT NULL,
	`senderId` int NOT NULL,
	`messageText` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(100) NOT NULL,
	`jobId` varchar(100) NOT NULL,
	`customerId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`provider` varchar(50) NOT NULL,
	`providerRef` varchar(255),
	`status` enum('pending','succeeded','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` varchar(100) NOT NULL,
	`jobId` varchar(100) NOT NULL,
	`driverId` int NOT NULL,
	`driverPayout` decimal(10,2) NOT NULL,
	`disposalReimbursement` decimal(10,2) NOT NULL DEFAULT '0',
	`totalAmount` decimal(10,2) NOT NULL,
	`status` enum('eligible','completed','failed') NOT NULL DEFAULT 'eligible',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` varchar(100) NOT NULL,
	`driverId` int NOT NULL,
	`customerId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `serviceAreas` (
	`id` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`state` varchar(2) NOT NULL,
	`type` enum('radius','polygon') NOT NULL,
	`centerLat` decimal(10,7),
	`centerLng` decimal(10,7),
	`radiusMiles` decimal(10,2),
	`polygonGeoJson` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `serviceAreas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeExtensionRequests` (
	`id` varchar(100) NOT NULL,
	`jobId` varchar(100) NOT NULL,
	`additionalHours` int NOT NULL,
	`additionalCost` decimal(10,2) NOT NULL,
	`status` enum('pending','approved','declined') NOT NULL DEFAULT 'pending',
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	CONSTRAINT `timeExtensionRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `volumePricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceAreaId` varchar(100) NOT NULL,
	`volumeTier` enum('1_8','1_4','1_2','3_4','full') NOT NULL,
	`basePrice` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `volumePricing_id` PRIMARY KEY(`id`),
	CONSTRAINT `volumePricing_area_tier_unique` UNIQUE(`serviceAreaId`,`volumeTier`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','customer','driver') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `photoUrl` text;--> statement-breakpoint
ALTER TABLE `addons` ADD CONSTRAINT `addons_serviceAreaId_serviceAreas_id_fk` FOREIGN KEY (`serviceAreaId`) REFERENCES `serviceAreas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_driverId_drivers_id_fk` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disposalCaps` ADD CONSTRAINT `disposalCaps_serviceAreaId_serviceAreas_id_fk` FOREIGN KEY (`serviceAreaId`) REFERENCES `serviceAreas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `distanceRules` ADD CONSTRAINT `distanceRules_serviceAreaId_serviceAreas_id_fk` FOREIGN KEY (`serviceAreaId`) REFERENCES `serviceAreas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `driverDocuments` ADD CONSTRAINT `driverDocuments_driverId_drivers_id_fk` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `driverLocations` ADD CONSTRAINT `driverLocations_driverId_drivers_id_fk` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `driverStrikes` ADD CONSTRAINT `driverStrikes_driverId_drivers_id_fk` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `driverStrikes` ADD CONSTRAINT `driverStrikes_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `driverStrikes` ADD CONSTRAINT `driverStrikes_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drivers` ADD CONSTRAINT `drivers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `haulAwayDetails` ADD CONSTRAINT `haulAwayDetails_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobAssignments` ADD CONSTRAINT `jobAssignments_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobAssignments` ADD CONSTRAINT `jobAssignments_driverId_drivers_id_fk` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobOffers` ADD CONSTRAINT `jobOffers_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobOffers` ADD CONSTRAINT `jobOffers_driverId_drivers_id_fk` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobPhotos` ADD CONSTRAINT `jobPhotos_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobPhotos` ADD CONSTRAINT `jobPhotos_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_serviceAreaId_serviceAreas_id_fk` FOREIGN KEY (`serviceAreaId`) REFERENCES `serviceAreas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `laborOnlyDetails` ADD CONSTRAINT `laborOnlyDetails_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `laborRates` ADD CONSTRAINT `laborRates_serviceAreaId_serviceAreas_id_fk` FOREIGN KEY (`serviceAreaId`) REFERENCES `serviceAreas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payouts` ADD CONSTRAINT `payouts_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payouts` ADD CONSTRAINT `payouts_driverId_drivers_id_fk` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_driverId_drivers_id_fk` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timeExtensionRequests` ADD CONSTRAINT `timeExtensionRequests_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `volumePricing` ADD CONSTRAINT `volumePricing_serviceAreaId_serviceAreas_id_fk` FOREIGN KEY (`serviceAreaId`) REFERENCES `serviceAreas`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `addons_serviceAreaId_idx` ON `addons` (`serviceAreaId`);--> statement-breakpoint
CREATE INDEX `auditLogs_userId_idx` ON `auditLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `auditLogs_action_idx` ON `auditLogs` (`action`);--> statement-breakpoint
CREATE INDEX `conversations_jobId_idx` ON `conversations` (`jobId`);--> statement-breakpoint
CREATE INDEX `customers_userId_idx` ON `customers` (`userId`);--> statement-breakpoint
CREATE INDEX `disposalCaps_serviceAreaId_idx` ON `disposalCaps` (`serviceAreaId`);--> statement-breakpoint
CREATE INDEX `distanceRules_serviceAreaId_idx` ON `distanceRules` (`serviceAreaId`);--> statement-breakpoint
CREATE INDEX `driverDocuments_driverId_idx` ON `driverDocuments` (`driverId`);--> statement-breakpoint
CREATE INDEX `driverLocations_driverId_idx` ON `driverLocations` (`driverId`);--> statement-breakpoint
CREATE INDEX `driverLocations_timestamp_idx` ON `driverLocations` (`timestamp`);--> statement-breakpoint
CREATE INDEX `driverStrikes_driverId_idx` ON `driverStrikes` (`driverId`);--> statement-breakpoint
CREATE INDEX `drivers_userId_idx` ON `drivers` (`userId`);--> statement-breakpoint
CREATE INDEX `drivers_status_idx` ON `drivers` (`status`);--> statement-breakpoint
CREATE INDEX `drivers_isOnline_idx` ON `drivers` (`isOnline`);--> statement-breakpoint
CREATE INDEX `haulAwayDetails_jobId_idx` ON `haulAwayDetails` (`jobId`);--> statement-breakpoint
CREATE INDEX `jobAssignments_jobId_idx` ON `jobAssignments` (`jobId`);--> statement-breakpoint
CREATE INDEX `jobAssignments_driverId_idx` ON `jobAssignments` (`driverId`);--> statement-breakpoint
CREATE INDEX `jobOffers_jobId_idx` ON `jobOffers` (`jobId`);--> statement-breakpoint
CREATE INDEX `jobOffers_driverId_idx` ON `jobOffers` (`driverId`);--> statement-breakpoint
CREATE INDEX `jobOffers_status_idx` ON `jobOffers` (`status`);--> statement-breakpoint
CREATE INDEX `jobPhotos_jobId_idx` ON `jobPhotos` (`jobId`);--> statement-breakpoint
CREATE INDEX `jobs_customerId_idx` ON `jobs` (`customerId`);--> statement-breakpoint
CREATE INDEX `jobs_serviceAreaId_idx` ON `jobs` (`serviceAreaId`);--> statement-breakpoint
CREATE INDEX `jobs_status_idx` ON `jobs` (`status`);--> statement-breakpoint
CREATE INDEX `laborOnlyDetails_jobId_idx` ON `laborOnlyDetails` (`jobId`);--> statement-breakpoint
CREATE INDEX `laborRates_serviceAreaId_idx` ON `laborRates` (`serviceAreaId`);--> statement-breakpoint
CREATE INDEX `messages_conversationId_idx` ON `messages` (`conversationId`);--> statement-breakpoint
CREATE INDEX `payments_jobId_idx` ON `payments` (`jobId`);--> statement-breakpoint
CREATE INDEX `payments_customerId_idx` ON `payments` (`customerId`);--> statement-breakpoint
CREATE INDEX `payouts_jobId_idx` ON `payouts` (`jobId`);--> statement-breakpoint
CREATE INDEX `payouts_driverId_idx` ON `payouts` (`driverId`);--> statement-breakpoint
CREATE INDEX `payouts_status_idx` ON `payouts` (`status`);--> statement-breakpoint
CREATE INDEX `ratings_jobId_idx` ON `ratings` (`jobId`);--> statement-breakpoint
CREATE INDEX `ratings_driverId_idx` ON `ratings` (`driverId`);--> statement-breakpoint
CREATE INDEX `serviceAreas_state_idx` ON `serviceAreas` (`state`);--> statement-breakpoint
CREATE INDEX `timeExtensionRequests_jobId_idx` ON `timeExtensionRequests` (`jobId`);--> statement-breakpoint
CREATE INDEX `volumePricing_serviceAreaId_idx` ON `volumePricing` (`serviceAreaId`);