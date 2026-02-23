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
  assignedByAdmin: integer('assigned_by_admin').default(0), // 0=auto, 1=manual
  assignedAt: timestamp('assigned_at'),
  assignmentNote: text('assignment_note'),
  customerNotes: text('customer_notes'),
  // Financial fields
  totalAmount: doublePrecision('total_amount'),
  driverEarnings: doublePrecision('driver_earnings'),
  platformFee: doublePrecision('platform_fee'),
  paymentStatus: text('payment_status').default('pending'),
  driverPayoutStatus: text('driver_payout_status').default('unpaid'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});


// Drivers table - matches actual database + new columns
export const drivers = pgTable('drivers', {
  id: serial('id').primaryKey(),
  // Basic info
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash'),
  
  // Identity documents
  selfiePhoto: text('selfie_photo'),
  driverLicenseFront: text('driver_license_front'),
  driverLicenseBack: text('driver_license_back'),
  licenseExpirationDate: text('license_expiration_date'),
  
  // Vehicle info
  vehicleType: text('vehicle_type'),
  vehicleMake: text('vehicle_make'),
  vehicleModel: text('vehicle_model'),
  vehicleYear: text('vehicle_year'),
  vehicleColor: text('vehicle_color'),
  licensePlate: text('license_plate'),
  vehicleRegistrationDoc: text('vehicle_registration_doc'),
  insuranceDoc: text('insurance_doc'),
  insuranceExpirationDate: text('insurance_expiration_date'),
  
  // Compliance status
  driverStatus: text('driver_status').notNull().default('pending_review'), // pending_review, approved, rejected, needs_more_info, suspended
  isActive: integer('is_active').notNull().default(0), // 0=inactive, 1=active
  adminNotes: text('admin_notes'),
  rejectionReason: text('rejection_reason'),
  requestedFields: text('requested_fields'), // JSON array of missing fields
  
  // Legacy status field (for backward compatibility)
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


// Export alias for backward compatibility
export const users = usersTable;

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


// Admin audit log table
export const adminAuditLog = pgTable('admin_audit_log', {
  id: serial('id').primaryKey(),
  adminUserId: integer('admin_user_id').notNull(),
  actionType: text('action_type').notNull(), // approve_driver, reject_driver, suspend_driver, assign_order, etc
  targetDriverId: integer('target_driver_id'),
  targetOrderId: integer('target_order_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});
