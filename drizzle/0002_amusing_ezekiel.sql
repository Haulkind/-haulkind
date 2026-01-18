ALTER TABLE `drivers` ADD `stripeOnboardingComplete` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `drivers` ADD `stripeChargesEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `drivers` ADD `stripePayoutsEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `payouts` ADD `stripeTransferId` varchar(255);