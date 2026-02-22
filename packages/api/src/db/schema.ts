import { pgTable, text, timestamp, serial, doublePrecision, integer } from 'drizzle-orm/pg-core';

// Orders table - matches actual database
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  serviceType: text('service_type').notNull(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  street: text('street').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zip: text('zip').notNull(),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  pickupDate: text('pickup_date').notNull(),
  pickupTimeWindow: text('pickup_time_window').notNull(),
  itemsJson: text('items_json').notNull(),
  pricingJson: text('pricing_json').notNull(),
  status: text('status').notNull().default('pending'),
  assignedDriverId: integer('assigned_driver_id'),
  customerNotes: text('customer_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Drivers table - matches actual database + new columns
export const drivers = pgTable('drivers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash'),
  vehicleType: text('vehicle_type'),
  licensePlate: text('license_plate'),
  status: text('status').notNull().default('available'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
