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

// Users table - used by admin-routes and index.ts for admin/support accounts
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  password: text('password').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Customers table - used by admin-routes for customer management
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
