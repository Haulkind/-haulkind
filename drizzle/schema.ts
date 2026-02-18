import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  index,
  unique,
} from "drizzle-orm/mysql-core";

/**
 * Haulkind Platform Database Schema
 * Complete schema for junk removal and labor marketplace
 */

// ============================================================================
// CORE USER TABLES
// ============================================================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  photoUrl: text("photoUrl"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  password: varchar("password", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin", "customer", "driver"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  defaultPaymentMethodId: varchar("defaultPaymentMethodId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("customers_userId_idx").on(table.userId),
}));

export const drivers = mysqlTable("drivers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  status: mysqlEnum("status", ["pending", "approved", "blocked"]).default("pending").notNull(),
  isOnline: boolean("isOnline").default(false).notNull(),
  vehicleType: varchar("vehicleType", { length: 50 }),
  vehicleCapacity: decimal("vehicleCapacity", { precision: 10, scale: 2 }),
  liftingLimit: int("liftingLimit"),
  canHaulAway: boolean("canHaulAway").default(false).notNull(),
  canLaborOnly: boolean("canLaborOnly").default(false).notNull(),
  insuranceProvider: varchar("insuranceProvider", { length: 255 }),
  insurancePolicyNumber: varchar("insurancePolicyNumber", { length: 255 }),
  insuranceExpiresAt: timestamp("insuranceExpiresAt"),
  acceptanceRate: decimal("acceptanceRate", { precision: 5, scale: 2 }).default("0").notNull(),
  cancelRate: decimal("cancelRate", { precision: 5, scale: 2 }).default("0").notNull(),
  totalOffers: int("totalOffers").default(0).notNull(),
  totalAccepted: int("totalAccepted").default(0).notNull(),
  totalCompleted: int("totalCompleted").default(0).notNull(),
  totalCancelled: int("totalCancelled").default(0).notNull(),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }),
  totalRatings: int("totalRatings").default(0).notNull(),
  stripeAccountId: varchar("stripeAccountId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("drivers_userId_idx").on(table.userId),
  statusIdx: index("drivers_status_idx").on(table.status),
  isOnlineIdx: index("drivers_isOnline_idx").on(table.isOnline),
}));

export const driverDocuments = mysqlTable("driverDocuments", {
  id: int("id").autoincrement().primaryKey(),
  driverId: int("driverId").notNull().references(() => drivers.id),
  documentType: varchar("documentType", { length: 50 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  storageKey: text("storageKey").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
}, (table) => ({
  driverIdIdx: index("driverDocuments_driverId_idx").on(table.driverId),
}));

// ============================================================================
// SERVICE AREAS & PRICING
// ============================================================================

export const serviceAreas = mysqlTable("serviceAreas", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  type: mysqlEnum("type", ["radius", "polygon"]).notNull(),
  centerLat: decimal("centerLat", { precision: 10, scale: 7 }),
  centerLng: decimal("centerLng", { precision: 10, scale: 7 }),
  radiusMiles: decimal("radiusMiles", { precision: 10, scale: 2 }),
  polygonGeoJson: json("polygonGeoJson"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  stateIdx: index("serviceAreas_state_idx").on(table.state),
}));

export const volumePricing = mysqlTable("volumePricing", {
  id: int("id").autoincrement().primaryKey(),
  serviceAreaId: varchar("serviceAreaId", { length: 100 }).notNull().references(() => serviceAreas.id),
  volumeTier: mysqlEnum("volumeTier", ["1_8", "1_4", "1_2", "3_4", "full"]).notNull(),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  serviceAreaIdIdx: index("volumePricing_serviceAreaId_idx").on(table.serviceAreaId),
  uniqueAreaTier: unique("volumePricing_area_tier_unique").on(table.serviceAreaId, table.volumeTier),
}));

export const disposalCaps = mysqlTable("disposalCaps", {
  id: int("id").autoincrement().primaryKey(),
  serviceAreaId: varchar("serviceAreaId", { length: 100 }).notNull().references(() => serviceAreas.id),
  volumeTier: mysqlEnum("volumeTier", ["1_8", "1_4", "1_2", "3_4", "full"]).notNull(),
  capAmount: decimal("capAmount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  serviceAreaIdIdx: index("disposalCaps_serviceAreaId_idx").on(table.serviceAreaId),
  uniqueAreaTier: unique("disposalCaps_area_tier_unique").on(table.serviceAreaId, table.volumeTier),
}));

export const addons = mysqlTable("addons", {
  id: int("id").autoincrement().primaryKey(),
  serviceAreaId: varchar("serviceAreaId", { length: 100 }).notNull().references(() => serviceAreas.id),
  addonType: mysqlEnum("addonType", [
    "stairs_1",
    "stairs_2plus",
    "long_carry",
    "heavy",
    "mattress",
    "appliances",
    "same_day",
  ]).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  serviceAreaIdIdx: index("addons_serviceAreaId_idx").on(table.serviceAreaId),
  uniqueAreaAddon: unique("addons_area_addon_unique").on(table.serviceAreaId, table.addonType),
}));

export const distanceRules = mysqlTable("distanceRules", {
  id: int("id").autoincrement().primaryKey(),
  serviceAreaId: varchar("serviceAreaId", { length: 100 }).notNull().references(() => serviceAreas.id),
  minMiles: decimal("minMiles", { precision: 10, scale: 2 }).notNull(),
  maxMiles: decimal("maxMiles", { precision: 10, scale: 2 }),
  surcharge: decimal("surcharge", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  serviceAreaIdIdx: index("distanceRules_serviceAreaId_idx").on(table.serviceAreaId),
}));

export const laborRates = mysqlTable("laborRates", {
  id: int("id").autoincrement().primaryKey(),
  serviceAreaId: varchar("serviceAreaId", { length: 100 }).notNull().references(() => serviceAreas.id),
  helpersCount: int("helpersCount").notNull(),
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }).notNull(),
  minimumHours: int("minimumHours").default(2).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  serviceAreaIdIdx: index("laborRates_serviceAreaId_idx").on(table.serviceAreaId),
  uniqueAreaHelpers: unique("laborRates_area_helpers_unique").on(table.serviceAreaId, table.helpersCount),
}));

// ============================================================================
// JOBS & ASSIGNMENTS
// ============================================================================

export const jobs = mysqlTable("jobs", {
  id: varchar("id", { length: 100 }).primaryKey(),
  customerId: int("customerId").notNull().references(() => customers.id),
  serviceAreaId: varchar("serviceAreaId", { length: 100 }).notNull().references(() => serviceAreas.id),
  jobType: mysqlEnum("jobType", ["HAUL_AWAY", "LABOR_ONLY"]).notNull(),
  status: mysqlEnum("status", [
    "draft",
    "quoted",
    "dispatching",
    "assigned",
    "en_route",
    "arrived",
    "started",
    "completed",
    "cancelled",
    "no_coverage",
  ]).default("draft").notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  pickupAddress: text("pickupAddress").notNull(),
  pickupLat: decimal("pickupLat", { precision: 10, scale: 7 }).notNull(),
  pickupLng: decimal("pickupLng", { precision: 10, scale: 7 }).notNull(),
  pickupUnit: varchar("pickupUnit", { length: 50 }),
  pickupNotes: text("pickupNotes"),
  servicePrice: decimal("servicePrice", { precision: 10, scale: 2 }),
  disposalCap: decimal("disposalCap", { precision: 10, scale: 2 }),
  total: decimal("total", { precision: 10, scale: 2 }),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }),
  driverPayout: decimal("driverPayout", { precision: 10, scale: 2 }),
  paidAt: timestamp("paidAt"),
  scheduledFor: timestamp("scheduledFor"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  customerIdIdx: index("jobs_customerId_idx").on(table.customerId),
  serviceAreaIdIdx: index("jobs_serviceAreaId_idx").on(table.serviceAreaId),
  statusIdx: index("jobs_status_idx").on(table.status),
}));

export const haulAwayDetails = mysqlTable("haulAwayDetails", {
  id: int("id").autoincrement().primaryKey(),
  jobId: varchar("jobId", { length: 100 }).notNull().references(() => jobs.id),
  volumeTier: mysqlEnum("volumeTier", ["1_8", "1_4", "1_2", "3_4", "full"]).notNull(),
  addonsJson: json("addonsJson"),
  disposalCap: decimal("disposalCap", { precision: 10, scale: 2 }).notNull(),
  distanceBand: varchar("distanceBand", { length: 50 }),
  sameDay: boolean("sameDay").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("haulAwayDetails_jobId_idx").on(table.jobId),
}));

export const laborOnlyDetails = mysqlTable("laborOnlyDetails", {
  id: int("id").autoincrement().primaryKey(),
  jobId: varchar("jobId", { length: 100 }).notNull().references(() => jobs.id),
  helpersCount: int("helpersCount").notNull(),
  hoursBooked: int("hoursBooked").notNull(),
  laborScopeNotes: text("laborScopeNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("laborOnlyDetails_jobId_idx").on(table.jobId),
}));

export const jobOffers = mysqlTable("jobOffers", {
  id: varchar("id", { length: 100 }).primaryKey(),
  jobId: varchar("jobId", { length: 100 }).notNull().references(() => jobs.id),
  driverId: int("driverId").notNull().references(() => drivers.id),
  wave: int("wave").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "expired"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("jobOffers_jobId_idx").on(table.jobId),
  driverIdIdx: index("jobOffers_driverId_idx").on(table.driverId),
  statusIdx: index("jobOffers_status_idx").on(table.status),
}));

export const jobAssignments = mysqlTable("jobAssignments", {
  id: int("id").autoincrement().primaryKey(),
  jobId: varchar("jobId", { length: 100 }).notNull().references(() => jobs.id),
  driverId: int("driverId").notNull().references(() => drivers.id),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("jobAssignments_jobId_idx").on(table.jobId),
  driverIdIdx: index("jobAssignments_driverId_idx").on(table.driverId),
}));

export const timeExtensionRequests = mysqlTable("timeExtensionRequests", {
  id: varchar("id", { length: 100 }).primaryKey(),
  jobId: varchar("jobId", { length: 100 }).notNull().references(() => jobs.id),
  additionalHours: int("additionalHours").notNull(),
  additionalCost: decimal("additionalCost", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "declined"]).default("pending").notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
}, (table) => ({
  jobIdIdx: index("timeExtensionRequests_jobId_idx").on(table.jobId),
}));

// ============================================================================
// PAYMENTS & PAYOUTS
// ============================================================================

export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 100 }).primaryKey(),
  jobId: varchar("jobId", { length: 100 }).notNull().references(() => jobs.id),
  customerId: int("customerId").notNull().references(() => customers.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  providerRef: varchar("providerRef", { length: 255 }),
  status: mysqlEnum("status", ["pending", "succeeded", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("payments_jobId_idx").on(table.jobId),
  customerIdIdx: index("payments_customerId_idx").on(table.customerId),
}));

export const payouts = mysqlTable("payouts", {
  id: varchar("id", { length: 100 }).primaryKey(),
  jobId: varchar("jobId", { length: 100 }).notNull().references(() => jobs.id),
  driverId: int("driverId").notNull().references(() => drivers.id),
  driverPayout: decimal("driverPayout", { precision: 10, scale: 2 }).notNull(),
  disposalReimbursement: decimal("disposalReimbursement", { precision: 10, scale: 2 }).default("0").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["eligible", "completed", "failed"]).default("eligible").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("payouts_jobId_idx").on(table.jobId),
  driverIdIdx: index("payouts_driverId_idx").on(table.driverId),
  statusIdx: index("payouts_status_idx").on(table.status),
}));

// ============================================================================
// MEDIA & LOCATIONS
// ============================================================================

export const jobPhotos = mysqlTable("jobPhotos", {
  id: int("id").autoincrement().primaryKey(),
  jobId: varchar("jobId", { length: 100 }).notNull().references(() => jobs.id),
  photoType: mysqlEnum("photoType", ["customer_upload", "before", "after", "receipt"]).notNull(),
  fileUrl: text("fileUrl").notNull(),
  storageKey: text("storageKey").notNull(),
  caption: text("caption"),
  uploadedBy: int("uploadedBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("jobPhotos_jobId_idx").on(table.jobId),
}));

export const driverLocations = mysqlTable("driverLocations", {
  id: int("id").autoincrement().primaryKey(),
  driverId: int("driverId").notNull().references(() => drivers.id),
  lat: decimal("lat", { precision: 10, scale: 7 }).notNull(),
  lng: decimal("lng", { precision: 10, scale: 7 }).notNull(),
  heading: decimal("heading", { precision: 5, scale: 2 }),
  speed: decimal("speed", { precision: 5, scale: 2 }),
  accuracy: decimal("accuracy", { precision: 10, scale: 2 }),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  driverIdIdx: index("driverLocations_driverId_idx").on(table.driverId),
  timestampIdx: index("driverLocations_timestamp_idx").on(table.timestamp),
}));

// ============================================================================
// MESSAGING & RATINGS
// ============================================================================

export const conversations = mysqlTable("conversations", {
  id: varchar("id", { length: 100 }).primaryKey(),
  jobId: varchar("jobId", { length: 100 }).notNull().references(() => jobs.id),
  customerId: int("customerId").notNull().references(() => customers.id),
  driverId: int("driverId").notNull().references(() => drivers.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("conversations_jobId_idx").on(table.jobId),
}));

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: varchar("conversationId", { length: 100 }).notNull().references(() => conversations.id),
  senderId: int("senderId").notNull().references(() => users.id),
  messageText: text("messageText").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index("messages_conversationId_idx").on(table.conversationId),
}));

export const ratings = mysqlTable("ratings", {
  id: int("id").autoincrement().primaryKey(),
  jobId: varchar("jobId", { length: 100 }).notNull().references(() => jobs.id),
  driverId: int("driverId").notNull().references(() => drivers.id),
  customerId: int("customerId").notNull().references(() => customers.id),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("ratings_jobId_idx").on(table.jobId),
  driverIdIdx: index("ratings_driverId_idx").on(table.driverId),
}));

// ============================================================================
// AUDIT & STRIKES
// ============================================================================

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }),
  entityId: varchar("entityId", { length: 100 }),
  metadata: json("metadata"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("auditLogs_userId_idx").on(table.userId),
  actionIdx: index("auditLogs_action_idx").on(table.action),
}));

export const driverStrikes = mysqlTable("driverStrikes", {
  id: int("id").autoincrement().primaryKey(),
  driverId: int("driverId").notNull().references(() => drivers.id),
  jobId: varchar("jobId", { length: 100 }).references(() => jobs.id),
  reason: text("reason").notNull(),
  severity: mysqlEnum("severity", ["minor", "major", "critical"]).notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  driverIdIdx: index("driverStrikes_driverId_idx").on(table.driverId),
}));

// ============================================================================
// ITEMS CATALOG & PRICING
// ============================================================================

export const items = mysqlTable("items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  parentId: int("parentId"),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull().default("0.00"),
  isPopular: boolean("isPopular").default(false),
  displayOrder: int("displayOrder").default(0),
  sortOrder: int("sortOrder").default(0),
  imageUrl: varchar("imageUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  parentIdIdx: index("items_parentId_idx").on(table.parentId),
  categoryIdx: index("items_category_idx").on(table.category),
}));

export const promoCodes = mysqlTable("promoCodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).notNull(),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("minOrderAmount", { precision: 10, scale: 2 }),
  minOrderValue: decimal("minOrderValue", { precision: 10, scale: 2 }),
  maxDiscountAmount: decimal("maxDiscountAmount", { precision: 10, scale: 2 }),
  maxDiscount: decimal("maxDiscount", { precision: 10, scale: 2 }),
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  maxUses: int("maxUses"),
  currentUses: int("currentUses").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const savedQuotes = mysqlTable("savedQuotes", {
  id: varchar("id", { length: 100 }).primaryKey(),
  quoteId: varchar("quoteId", { length: 100 }).notNull().unique(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 50 }).notNull(),
  serviceStreet: varchar("serviceStreet", { length: 500 }).notNull(),
  serviceCity: varchar("serviceCity", { length: 255 }).notNull(),
  serviceState: varchar("serviceState", { length: 50 }).notNull(),
  serviceZip: varchar("serviceZip", { length: 20 }).notNull(),
  items: json("items").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  promoCode: varchar("promoCode", { length: 50 }),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  quoteIdIdx: index("savedQuotes_quoteId_idx").on(table.quoteId),
  emailIdx: index("savedQuotes_email_idx").on(table.customerEmail),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type ServiceArea = typeof serviceAreas.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;
export type PromoCode = typeof promoCodes.$inferSelect;
export type SavedQuote = typeof savedQuotes.$inferSelect;
