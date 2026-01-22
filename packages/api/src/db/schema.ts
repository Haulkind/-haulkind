import { pgTable, text, timestamp, uuid, jsonb, decimal } from 'drizzle-orm/pg-core';

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceType: text('service_type').notNull(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  street: text('street').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zip: text('zip').notNull(),
  lat: decimal('lat', { precision: 10, scale: 7 }),
  lng: decimal('lng', { precision: 10, scale: 7 }),
  pickupDate: text('pickup_date').notNull(),
  pickupTimeWindow: text('pickup_time_window').notNull(),
  itemsJson: jsonb('items_json').notNull(),
  pricingJson: jsonb('pricing_json').notNull(),
  status: text('status').notNull().default('pending'),
  assignedDriverId: uuid('assigned_driver_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const drivers = pgTable('drivers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  status: text('status').notNull().default('available'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
