"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// drizzle/schema.ts
var import_mysql_core, users, customers, drivers, driverDocuments, serviceAreas, volumePricing, disposalCaps, addons, distanceRules, laborRates, jobs, haulAwayDetails, laborOnlyDetails, jobOffers, jobAssignments, timeExtensionRequests, payments, payouts, jobPhotos, driverLocations, conversations, messages, ratings, auditLogs, driverStrikes, items, promoCodes, savedQuotes;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    import_mysql_core = require("drizzle-orm/mysql-core");
    users = (0, import_mysql_core.mysqlTable)("users", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      openId: (0, import_mysql_core.varchar)("openId", { length: 64 }).notNull().unique(),
      name: (0, import_mysql_core.text)("name"),
      email: (0, import_mysql_core.varchar)("email", { length: 320 }),
      phone: (0, import_mysql_core.varchar)("phone", { length: 20 }),
      photoUrl: (0, import_mysql_core.text)("photoUrl"),
      loginMethod: (0, import_mysql_core.varchar)("loginMethod", { length: 64 }),
      password: (0, import_mysql_core.varchar)("password", { length: 255 }),
      role: (0, import_mysql_core.mysqlEnum)("role", ["user", "admin", "customer", "driver"]).default("user").notNull(),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
      updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: (0, import_mysql_core.timestamp)("lastSignedIn").defaultNow().notNull()
    });
    customers = (0, import_mysql_core.mysqlTable)("customers", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      userId: (0, import_mysql_core.int)("userId").notNull().references(() => users.id),
      stripeCustomerId: (0, import_mysql_core.varchar)("stripeCustomerId", { length: 255 }),
      defaultPaymentMethodId: (0, import_mysql_core.varchar)("defaultPaymentMethodId", { length: 255 }),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
      updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => ({
      userIdIdx: (0, import_mysql_core.index)("customers_userId_idx").on(table.userId)
    }));
    drivers = (0, import_mysql_core.mysqlTable)("drivers", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      userId: (0, import_mysql_core.int)("userId").notNull().references(() => users.id),
      status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "approved", "blocked"]).default("pending").notNull(),
      isOnline: (0, import_mysql_core.boolean)("isOnline").default(false).notNull(),
      vehicleType: (0, import_mysql_core.varchar)("vehicleType", { length: 50 }),
      vehicleCapacity: (0, import_mysql_core.decimal)("vehicleCapacity", { precision: 10, scale: 2 }),
      liftingLimit: (0, import_mysql_core.int)("liftingLimit"),
      canHaulAway: (0, import_mysql_core.boolean)("canHaulAway").default(false).notNull(),
      canLaborOnly: (0, import_mysql_core.boolean)("canLaborOnly").default(false).notNull(),
      insuranceProvider: (0, import_mysql_core.varchar)("insuranceProvider", { length: 255 }),
      insurancePolicyNumber: (0, import_mysql_core.varchar)("insurancePolicyNumber", { length: 255 }),
      insuranceExpiresAt: (0, import_mysql_core.timestamp)("insuranceExpiresAt"),
      acceptanceRate: (0, import_mysql_core.decimal)("acceptanceRate", { precision: 5, scale: 2 }).default("0").notNull(),
      cancelRate: (0, import_mysql_core.decimal)("cancelRate", { precision: 5, scale: 2 }).default("0").notNull(),
      totalOffers: (0, import_mysql_core.int)("totalOffers").default(0).notNull(),
      totalAccepted: (0, import_mysql_core.int)("totalAccepted").default(0).notNull(),
      totalCompleted: (0, import_mysql_core.int)("totalCompleted").default(0).notNull(),
      totalCancelled: (0, import_mysql_core.int)("totalCancelled").default(0).notNull(),
      averageRating: (0, import_mysql_core.decimal)("averageRating", { precision: 3, scale: 2 }),
      totalRatings: (0, import_mysql_core.int)("totalRatings").default(0).notNull(),
      stripeAccountId: (0, import_mysql_core.varchar)("stripeAccountId", { length: 255 }),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
      updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => ({
      userIdIdx: (0, import_mysql_core.index)("drivers_userId_idx").on(table.userId),
      statusIdx: (0, import_mysql_core.index)("drivers_status_idx").on(table.status),
      isOnlineIdx: (0, import_mysql_core.index)("drivers_isOnline_idx").on(table.isOnline)
    }));
    driverDocuments = (0, import_mysql_core.mysqlTable)("driverDocuments", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      driverId: (0, import_mysql_core.int)("driverId").notNull().references(() => drivers.id),
      documentType: (0, import_mysql_core.varchar)("documentType", { length: 50 }).notNull(),
      fileUrl: (0, import_mysql_core.text)("fileUrl").notNull(),
      storageKey: (0, import_mysql_core.text)("storageKey").notNull(),
      uploadedAt: (0, import_mysql_core.timestamp)("uploadedAt").defaultNow().notNull()
    }, (table) => ({
      driverIdIdx: (0, import_mysql_core.index)("driverDocuments_driverId_idx").on(table.driverId)
    }));
    serviceAreas = (0, import_mysql_core.mysqlTable)("serviceAreas", {
      id: (0, import_mysql_core.varchar)("id", { length: 100 }).primaryKey(),
      name: (0, import_mysql_core.varchar)("name", { length: 255 }).notNull(),
      state: (0, import_mysql_core.varchar)("state", { length: 2 }).notNull(),
      type: (0, import_mysql_core.mysqlEnum)("type", ["radius", "polygon"]).notNull(),
      centerLat: (0, import_mysql_core.decimal)("centerLat", { precision: 10, scale: 7 }),
      centerLng: (0, import_mysql_core.decimal)("centerLng", { precision: 10, scale: 7 }),
      radiusMiles: (0, import_mysql_core.decimal)("radiusMiles", { precision: 10, scale: 2 }),
      polygonGeoJson: (0, import_mysql_core.json)("polygonGeoJson"),
      isActive: (0, import_mysql_core.boolean)("isActive").default(true).notNull(),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
      updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => ({
      stateIdx: (0, import_mysql_core.index)("serviceAreas_state_idx").on(table.state)
    }));
    volumePricing = (0, import_mysql_core.mysqlTable)("volumePricing", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      serviceAreaId: (0, import_mysql_core.varchar)("serviceAreaId", { length: 100 }).notNull().references(() => serviceAreas.id),
      volumeTier: (0, import_mysql_core.mysqlEnum)("volumeTier", ["1_8", "1_4", "1_2", "3_4", "full"]).notNull(),
      basePrice: (0, import_mysql_core.decimal)("basePrice", { precision: 10, scale: 2 }).notNull(),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
      updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => ({
      serviceAreaIdIdx: (0, import_mysql_core.index)("volumePricing_serviceAreaId_idx").on(table.serviceAreaId),
      uniqueAreaTier: (0, import_mysql_core.unique)("volumePricing_area_tier_unique").on(table.serviceAreaId, table.volumeTier)
    }));
    disposalCaps = (0, import_mysql_core.mysqlTable)("disposalCaps", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      serviceAreaId: (0, import_mysql_core.varchar)("serviceAreaId", { length: 100 }).notNull().references(() => serviceAreas.id),
      volumeTier: (0, import_mysql_core.mysqlEnum)("volumeTier", ["1_8", "1_4", "1_2", "3_4", "full"]).notNull(),
      capAmount: (0, import_mysql_core.decimal)("capAmount", { precision: 10, scale: 2 }).notNull(),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
      updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => ({
      serviceAreaIdIdx: (0, import_mysql_core.index)("disposalCaps_serviceAreaId_idx").on(table.serviceAreaId),
      uniqueAreaTier: (0, import_mysql_core.unique)("disposalCaps_area_tier_unique").on(table.serviceAreaId, table.volumeTier)
    }));
    addons = (0, import_mysql_core.mysqlTable)("addons", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      serviceAreaId: (0, import_mysql_core.varchar)("serviceAreaId", { length: 100 }).notNull().references(() => serviceAreas.id),
      addonType: (0, import_mysql_core.mysqlEnum)("addonType", [
        "stairs_1",
        "stairs_2plus",
        "long_carry",
        "heavy",
        "mattress",
        "appliances",
        "same_day"
      ]).notNull(),
      price: (0, import_mysql_core.decimal)("price", { precision: 10, scale: 2 }).notNull(),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
      updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => ({
      serviceAreaIdIdx: (0, import_mysql_core.index)("addons_serviceAreaId_idx").on(table.serviceAreaId),
      uniqueAreaAddon: (0, import_mysql_core.unique)("addons_area_addon_unique").on(table.serviceAreaId, table.addonType)
    }));
    distanceRules = (0, import_mysql_core.mysqlTable)("distanceRules", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      serviceAreaId: (0, import_mysql_core.varchar)("serviceAreaId", { length: 100 }).notNull().references(() => serviceAreas.id),
      minMiles: (0, import_mysql_core.decimal)("minMiles", { precision: 10, scale: 2 }).notNull(),
      maxMiles: (0, import_mysql_core.decimal)("maxMiles", { precision: 10, scale: 2 }),
      surcharge: (0, import_mysql_core.decimal)("surcharge", { precision: 10, scale: 2 }).notNull(),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
      updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => ({
      serviceAreaIdIdx: (0, import_mysql_core.index)("distanceRules_serviceAreaId_idx").on(table.serviceAreaId)
    }));
    laborRates = (0, import_mysql_core.mysqlTable)("laborRates", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      serviceAreaId: (0, import_mysql_core.varchar)("serviceAreaId", { length: 100 }).notNull().references(() => serviceAreas.id),
      helpersCount: (0, import_mysql_core.int)("helpersCount").notNull(),
      hourlyRate: (0, import_mysql_core.decimal)("hourlyRate", { precision: 10, scale: 2 }).notNull(),
      minimumHours: (0, import_mysql_core.int)("minimumHours").default(2).notNull(),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
      updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => ({
      serviceAreaIdIdx: (0, import_mysql_core.index)("laborRates_serviceAreaId_idx").on(table.serviceAreaId),
      uniqueAreaHelpers: (0, import_mysql_core.unique)("laborRates_area_helpers_unique").on(table.serviceAreaId, table.helpersCount)
    }));
    jobs = (0, import_mysql_core.mysqlTable)("jobs", {
      id: (0, import_mysql_core.varchar)("id", { length: 100 }).primaryKey(),
      customerId: (0, import_mysql_core.int)("customerId").notNull().references(() => customers.id),
      serviceAreaId: (0, import_mysql_core.varchar)("serviceAreaId", { length: 100 }).notNull().references(() => serviceAreas.id),
      jobType: (0, import_mysql_core.mysqlEnum)("jobType", ["HAUL_AWAY", "LABOR_ONLY"]).notNull(),
      status: (0, import_mysql_core.mysqlEnum)("status", [
        "draft",
        "quoted",
        "dispatching",
        "assigned",
        "en_route",
        "arrived",
        "started",
        "completed",
        "cancelled",
        "no_coverage"
      ]).default("draft").notNull(),
      contactName: (0, import_mysql_core.varchar)("contactName", { length: 255 }).notNull(),
      contactPhone: (0, import_mysql_core.varchar)("contactPhone", { length: 20 }).notNull(),
      contactEmail: (0, import_mysql_core.varchar)("contactEmail", { length: 320 }),
      pickupAddress: (0, import_mysql_core.text)("pickupAddress").notNull(),
      pickupLat: (0, import_mysql_core.decimal)("pickupLat", { precision: 10, scale: 7 }).notNull(),
      pickupLng: (0, import_mysql_core.decimal)("pickupLng", { precision: 10, scale: 7 }).notNull(),
      pickupUnit: (0, import_mysql_core.varchar)("pickupUnit", { length: 50 }),
      pickupNotes: (0, import_mysql_core.text)("pickupNotes"),
      servicePrice: (0, import_mysql_core.decimal)("servicePrice", { precision: 10, scale: 2 }),
      disposalCap: (0, import_mysql_core.decimal)("disposalCap", { precision: 10, scale: 2 }),
      total: (0, import_mysql_core.decimal)("total", { precision: 10, scale: 2 }),
      platformFee: (0, import_mysql_core.decimal)("platformFee", { precision: 10, scale: 2 }),
      driverPayout: (0, import_mysql_core.decimal)("driverPayout", { precision: 10, scale: 2 }),
      paidAt: (0, import_mysql_core.timestamp)("paidAt"),
      scheduledFor: (0, import_mysql_core.timestamp)("scheduledFor"),
      completedAt: (0, import_mysql_core.timestamp)("completedAt"),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
      updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => ({
      customerIdIdx: (0, import_mysql_core.index)("jobs_customerId_idx").on(table.customerId),
      serviceAreaIdIdx: (0, import_mysql_core.index)("jobs_serviceAreaId_idx").on(table.serviceAreaId),
      statusIdx: (0, import_mysql_core.index)("jobs_status_idx").on(table.status)
    }));
    haulAwayDetails = (0, import_mysql_core.mysqlTable)("haulAwayDetails", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      jobId: (0, import_mysql_core.varchar)("jobId", { length: 100 }).notNull().references(() => jobs.id),
      volumeTier: (0, import_mysql_core.mysqlEnum)("volumeTier", ["1_8", "1_4", "1_2", "3_4", "full"]).notNull(),
      addonsJson: (0, import_mysql_core.json)("addonsJson"),
      disposalCap: (0, import_mysql_core.decimal)("disposalCap", { precision: 10, scale: 2 }).notNull(),
      distanceBand: (0, import_mysql_core.varchar)("distanceBand", { length: 50 }),
      sameDay: (0, import_mysql_core.boolean)("sameDay").default(false).notNull(),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
    }, (table) => ({
      jobIdIdx: (0, import_mysql_core.index)("haulAwayDetails_jobId_idx").on(table.jobId)
    }));
    laborOnlyDetails = (0, import_mysql_core.mysqlTable)("laborOnlyDetails", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      jobId: (0, import_mysql_core.varchar)("jobId", { length: 100 }).notNull().references(() => jobs.id),
      helpersCount: (0, import_mysql_core.int)("helpersCount").notNull(),
      hoursBooked: (0, import_mysql_core.int)("hoursBooked").notNull(),
      laborScopeNotes: (0, import_mysql_core.text)("laborScopeNotes"),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
    }, (table) => ({
      jobIdIdx: (0, import_mysql_core.index)("laborOnlyDetails_jobId_idx").on(table.jobId)
    }));
    jobOffers = (0, import_mysql_core.mysqlTable)("jobOffers", {
      id: (0, import_mysql_core.varchar)("id", { length: 100 }).primaryKey(),
      jobId: (0, import_mysql_core.varchar)("jobId", { length: 100 }).notNull().references(() => jobs.id),
      driverId: (0, import_mysql_core.int)("driverId").notNull().references(() => drivers.id),
      wave: (0, import_mysql_core.int)("wave").notNull(),
      status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "accepted", "rejected", "expired"]).default("pending").notNull(),
      expiresAt: (0, import_mysql_core.timestamp)("expiresAt").notNull(),
      respondedAt: (0, import_mysql_core.timestamp)("respondedAt"),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
    }, (table) => ({
      jobIdIdx: (0, import_mysql_core.index)("jobOffers_jobId_idx").on(table.jobId),
      driverIdIdx: (0, import_mysql_core.index)("jobOffers_driverId_idx").on(table.driverId),
      statusIdx: (0, import_mysql_core.index)("jobOffers_status_idx").on(table.status)
    }));
    jobAssignments = (0, import_mysql_core.mysqlTable)("jobAssignments", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      jobId: (0, import_mysql_core.varchar)("jobId", { length: 100 }).notNull().references(() => jobs.id),
      driverId: (0, import_mysql_core.int)("driverId").notNull().references(() => drivers.id),
      assignedAt: (0, import_mysql_core.timestamp)("assignedAt").defaultNow().notNull()
    }, (table) => ({
      jobIdIdx: (0, import_mysql_core.index)("jobAssignments_jobId_idx").on(table.jobId),
      driverIdIdx: (0, import_mysql_core.index)("jobAssignments_driverId_idx").on(table.driverId)
    }));
    timeExtensionRequests = (0, import_mysql_core.mysqlTable)("timeExtensionRequests", {
      id: (0, import_mysql_core.varchar)("id", { length: 100 }).primaryKey(),
      jobId: (0, import_mysql_core.varchar)("jobId", { length: 100 }).notNull().references(() => jobs.id),
      additionalHours: (0, import_mysql_core.int)("additionalHours").notNull(),
      additionalCost: (0, import_mysql_core.decimal)("additionalCost", { precision: 10, scale: 2 }).notNull(),
      status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "approved", "declined"]).default("pending").notNull(),
      requestedAt: (0, import_mysql_core.timestamp)("requestedAt").defaultNow().notNull(),
      respondedAt: (0, import_mysql_core.timestamp)("respondedAt")
    }, (table) => ({
      jobIdIdx: (0, import_mysql_core.index)("timeExtensionRequests_jobId_idx").on(table.jobId)
    }));
    payments = (0, import_mysql_core.mysqlTable)("payments", {
      id: (0, import_mysql_core.varchar)("id", { length: 100 }).primaryKey(),
      jobId: (0, import_mysql_core.varchar)("jobId", { length: 100 }).notNull().references(() => jobs.id),
      customerId: (0, import_mysql_core.int)("customerId").notNull().references(() => customers.id),
      amount: (0, import_mysql_core.decimal)("amount", { precision: 10, scale: 2 }).notNull(),
      currency: (0, import_mysql_core.varchar)("currency", { length: 3 }).default("USD").notNull(),
      provider: (0, import_mysql_core.varchar)("provider", { length: 50 }).notNull(),
      providerRef: (0, import_mysql_core.varchar)("providerRef", { length: 255 }),
      status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "succeeded", "failed"]).default("pending").notNull(),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
    }, (table) => ({
      jobIdIdx: (0, import_mysql_core.index)("payments_jobId_idx").on(table.jobId),
      customerIdIdx: (0, import_mysql_core.index)("payments_customerId_idx").on(table.customerId)
    }));
    payouts = (0, import_mysql_core.mysqlTable)("payouts", {
      id: (0, import_mysql_core.varchar)("id", { length: 100 }).primaryKey(),
      jobId: (0, import_mysql_core.varchar)("jobId", { length: 100 }).notNull().references(() => jobs.id),
      driverId: (0, import_mysql_core.int)("driverId").notNull().references(() => drivers.id),
      driverPayout: (0, import_mysql_core.decimal)("driverPayout", { precision: 10, scale: 2 }).notNull(),
      disposalReimbursement: (0, import_mysql_core.decimal)("disposalReimbursement", { precision: 10, scale: 2 }).default("0").notNull(),
      totalAmount: (0, import_mysql_core.decimal)("totalAmount", { precision: 10, scale: 2 }).notNull(),
      status: (0, import_mysql_core.mysqlEnum)("status", ["eligible", "completed", "failed"]).default("eligible").notNull(),
      completedAt: (0, import_mysql_core.timestamp)("completedAt"),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
    }, (table) => ({
      jobIdIdx: (0, import_mysql_core.index)("payouts_jobId_idx").on(table.jobId),
      driverIdIdx: (0, import_mysql_core.index)("payouts_driverId_idx").on(table.driverId),
      statusIdx: (0, import_mysql_core.index)("payouts_status_idx").on(table.status)
    }));
    jobPhotos = (0, import_mysql_core.mysqlTable)("jobPhotos", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      jobId: (0, import_mysql_core.varchar)("jobId", { length: 100 }).notNull().references(() => jobs.id),
      photoType: (0, import_mysql_core.mysqlEnum)("photoType", ["customer_upload", "before", "after", "receipt"]).notNull(),
      fileUrl: (0, import_mysql_core.text)("fileUrl").notNull(),
      storageKey: (0, import_mysql_core.text)("storageKey").notNull(),
      caption: (0, import_mysql_core.text)("caption"),
      uploadedBy: (0, import_mysql_core.int)("uploadedBy").notNull().references(() => users.id),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
    }, (table) => ({
      jobIdIdx: (0, import_mysql_core.index)("jobPhotos_jobId_idx").on(table.jobId)
    }));
    driverLocations = (0, import_mysql_core.mysqlTable)("driverLocations", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      driverId: (0, import_mysql_core.int)("driverId").notNull().references(() => drivers.id),
      lat: (0, import_mysql_core.decimal)("lat", { precision: 10, scale: 7 }).notNull(),
      lng: (0, import_mysql_core.decimal)("lng", { precision: 10, scale: 7 }).notNull(),
      heading: (0, import_mysql_core.decimal)("heading", { precision: 5, scale: 2 }),
      speed: (0, import_mysql_core.decimal)("speed", { precision: 5, scale: 2 }),
      accuracy: (0, import_mysql_core.decimal)("accuracy", { precision: 10, scale: 2 }),
      timestamp: (0, import_mysql_core.timestamp)("timestamp").notNull(),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
    }, (table) => ({
      driverIdIdx: (0, import_mysql_core.index)("driverLocations_driverId_idx").on(table.driverId),
      timestampIdx: (0, import_mysql_core.index)("driverLocations_timestamp_idx").on(table.timestamp)
    }));
    conversations = (0, import_mysql_core.mysqlTable)("conversations", {
      id: (0, import_mysql_core.varchar)("id", { length: 100 }).primaryKey(),
      jobId: (0, import_mysql_core.varchar)("jobId", { length: 100 }).notNull().references(() => jobs.id),
      customerId: (0, import_mysql_core.int)("customerId").notNull().references(() => customers.id),
      driverId: (0, import_mysql_core.int)("driverId").notNull().references(() => drivers.id),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
    }, (table) => ({
      jobIdIdx: (0, import_mysql_core.index)("conversations_jobId_idx").on(table.jobId)
    }));
    messages = (0, import_mysql_core.mysqlTable)("messages", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      conversationId: (0, import_mysql_core.varchar)("conversationId", { length: 100 }).notNull().references(() => conversations.id),
      senderId: (0, import_mysql_core.int)("senderId").notNull().references(() => users.id),
      messageText: (0, import_mysql_core.text)("messageText").notNull(),
      isRead: (0, import_mysql_core.boolean)("isRead").default(false).notNull(),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
    }, (table) => ({
      conversationIdIdx: (0, import_mysql_core.index)("messages_conversationId_idx").on(table.conversationId)
    }));
    ratings = (0, import_mysql_core.mysqlTable)("ratings", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      jobId: (0, import_mysql_core.varchar)("jobId", { length: 100 }).notNull().references(() => jobs.id),
      driverId: (0, import_mysql_core.int)("driverId").notNull().references(() => drivers.id),
      customerId: (0, import_mysql_core.int)("customerId").notNull().references(() => customers.id),
      rating: (0, import_mysql_core.int)("rating").notNull(),
      comment: (0, import_mysql_core.text)("comment"),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
    }, (table) => ({
      jobIdIdx: (0, import_mysql_core.index)("ratings_jobId_idx").on(table.jobId),
      driverIdIdx: (0, import_mysql_core.index)("ratings_driverId_idx").on(table.driverId)
    }));
    auditLogs = (0, import_mysql_core.mysqlTable)("auditLogs", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      userId: (0, import_mysql_core.int)("userId").references(() => users.id),
      action: (0, import_mysql_core.varchar)("action", { length: 100 }).notNull(),
      entityType: (0, import_mysql_core.varchar)("entityType", { length: 50 }),
      entityId: (0, import_mysql_core.varchar)("entityId", { length: 100 }),
      metadata: (0, import_mysql_core.json)("metadata"),
      ipAddress: (0, import_mysql_core.varchar)("ipAddress", { length: 45 }),
      userAgent: (0, import_mysql_core.text)("userAgent"),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
    }, (table) => ({
      userIdIdx: (0, import_mysql_core.index)("auditLogs_userId_idx").on(table.userId),
      actionIdx: (0, import_mysql_core.index)("auditLogs_action_idx").on(table.action)
    }));
    driverStrikes = (0, import_mysql_core.mysqlTable)("driverStrikes", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      driverId: (0, import_mysql_core.int)("driverId").notNull().references(() => drivers.id),
      jobId: (0, import_mysql_core.varchar)("jobId", { length: 100 }).references(() => jobs.id),
      reason: (0, import_mysql_core.text)("reason").notNull(),
      severity: (0, import_mysql_core.mysqlEnum)("severity", ["minor", "major", "critical"]).notNull(),
      createdBy: (0, import_mysql_core.int)("createdBy").notNull().references(() => users.id),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
    }, (table) => ({
      driverIdIdx: (0, import_mysql_core.index)("driverStrikes_driverId_idx").on(table.driverId)
    }));
    items = (0, import_mysql_core.mysqlTable)("items", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      name: (0, import_mysql_core.varchar)("name", { length: 255 }).notNull(),
      slug: (0, import_mysql_core.varchar)("slug", { length: 255 }),
      description: (0, import_mysql_core.text)("description"),
      category: (0, import_mysql_core.varchar)("category", { length: 100 }),
      parentId: (0, import_mysql_core.int)("parentId"),
      basePrice: (0, import_mysql_core.decimal)("basePrice", { precision: 10, scale: 2 }).notNull().default("0.00"),
      isPopular: (0, import_mysql_core.boolean)("isPopular").default(false),
      displayOrder: (0, import_mysql_core.int)("displayOrder").default(0),
      sortOrder: (0, import_mysql_core.int)("sortOrder").default(0),
      imageUrl: (0, import_mysql_core.varchar)("imageUrl", { length: 500 }),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
      updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull()
    }, (table) => ({
      parentIdIdx: (0, import_mysql_core.index)("items_parentId_idx").on(table.parentId),
      categoryIdx: (0, import_mysql_core.index)("items_category_idx").on(table.category)
    }));
    promoCodes = (0, import_mysql_core.mysqlTable)("promoCodes", {
      id: (0, import_mysql_core.int)("id").autoincrement().primaryKey(),
      code: (0, import_mysql_core.varchar)("code", { length: 50 }).notNull().unique(),
      description: (0, import_mysql_core.text)("description"),
      discountType: (0, import_mysql_core.mysqlEnum)("discountType", ["percentage", "fixed"]).notNull(),
      discountValue: (0, import_mysql_core.decimal)("discountValue", { precision: 10, scale: 2 }).notNull(),
      minOrderAmount: (0, import_mysql_core.decimal)("minOrderAmount", { precision: 10, scale: 2 }),
      minOrderValue: (0, import_mysql_core.decimal)("minOrderValue", { precision: 10, scale: 2 }),
      maxDiscountAmount: (0, import_mysql_core.decimal)("maxDiscountAmount", { precision: 10, scale: 2 }),
      maxDiscount: (0, import_mysql_core.decimal)("maxDiscount", { precision: 10, scale: 2 }),
      validFrom: (0, import_mysql_core.timestamp)("validFrom"),
      validUntil: (0, import_mysql_core.timestamp)("validUntil"),
      maxUses: (0, import_mysql_core.int)("maxUses"),
      currentUses: (0, import_mysql_core.int)("currentUses").default(0),
      isActive: (0, import_mysql_core.boolean)("isActive").default(true),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
    });
    savedQuotes = (0, import_mysql_core.mysqlTable)("savedQuotes", {
      id: (0, import_mysql_core.varchar)("id", { length: 100 }).primaryKey(),
      quoteId: (0, import_mysql_core.varchar)("quoteId", { length: 100 }).notNull().unique(),
      customerName: (0, import_mysql_core.varchar)("customerName", { length: 255 }).notNull(),
      customerEmail: (0, import_mysql_core.varchar)("customerEmail", { length: 255 }).notNull(),
      customerPhone: (0, import_mysql_core.varchar)("customerPhone", { length: 50 }).notNull(),
      serviceStreet: (0, import_mysql_core.varchar)("serviceStreet", { length: 500 }).notNull(),
      serviceCity: (0, import_mysql_core.varchar)("serviceCity", { length: 255 }).notNull(),
      serviceState: (0, import_mysql_core.varchar)("serviceState", { length: 50 }).notNull(),
      serviceZip: (0, import_mysql_core.varchar)("serviceZip", { length: 20 }).notNull(),
      items: (0, import_mysql_core.json)("items").notNull(),
      subtotal: (0, import_mysql_core.decimal)("subtotal", { precision: 10, scale: 2 }).notNull(),
      tax: (0, import_mysql_core.decimal)("tax", { precision: 10, scale: 2 }).notNull(),
      discount: (0, import_mysql_core.decimal)("discount", { precision: 10, scale: 2 }).default("0.00"),
      total: (0, import_mysql_core.decimal)("total", { precision: 10, scale: 2 }).notNull(),
      promoCode: (0, import_mysql_core.varchar)("promoCode", { length: 50 }),
      expiresAt: (0, import_mysql_core.timestamp)("expiresAt").notNull(),
      createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
    }, (table) => ({
      quoteIdIdx: (0, import_mysql_core.index)("savedQuotes_quoteId_idx").on(table.quoteId),
      emailIdx: (0, import_mysql_core.index)("savedQuotes_email_idx").on(table.customerEmail)
    }));
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  createAuditLog: () => createAuditLog,
  createCustomer: () => createCustomer,
  createDriver: () => createDriver,
  createDriverVehicle: () => createDriverVehicle,
  createHaulAwayDetails: () => createHaulAwayDetails,
  createJob: () => createJob,
  createJobAssignment: () => createJobAssignment,
  createJobOffer: () => createJobOffer,
  createJobPhoto: () => createJobPhoto,
  createLaborOnlyDetails: () => createLaborOnlyDetails,
  createPayment: () => createPayment,
  createPayout: () => createPayout,
  createServiceArea: () => createServiceArea,
  deleteServiceArea: () => deleteServiceArea,
  findServiceAreaByCoordinates: () => findServiceAreaByCoordinates,
  getAddons: () => getAddons,
  getAllDrivers: () => getAllDrivers,
  getAllJobs: () => getAllJobs,
  getAllServiceAreas: () => getAllServiceAreas,
  getCustomerById: () => getCustomerById,
  getCustomerByUserId: () => getCustomerByUserId,
  getDb: () => getDb,
  getDisposalCaps: () => getDisposalCaps,
  getDistanceRules: () => getDistanceRules,
  getDriverActiveJob: () => getDriverActiveJob,
  getDriverById: () => getDriverById,
  getDriverByUserId: () => getDriverByUserId,
  getDriverRatings: () => getDriverRatings,
  getDriverVehicles: () => getDriverVehicles,
  getEligiblePayouts: () => getEligiblePayouts,
  getHaulAwayDetails: () => getHaulAwayDetails,
  getJobAssignment: () => getJobAssignment,
  getJobById: () => getJobById,
  getJobOffers: () => getJobOffers,
  getJobPhotos: () => getJobPhotos,
  getJobsByCustomerId: () => getJobsByCustomerId,
  getLaborOnlyDetails: () => getLaborOnlyDetails,
  getLaborRates: () => getLaborRates,
  getLatestDriverLocation: () => getLatestDriverLocation,
  getOrCreateCustomer: () => getOrCreateCustomer,
  getPaymentByJobId: () => getPaymentByJobId,
  getPayoutByJobId: () => getPayoutByJobId,
  getServiceAreaById: () => getServiceAreaById,
  getUserById: () => getUserById,
  getUserByOpenId: () => getUserByOpenId,
  getVolumePricing: () => getVolumePricing,
  updateDriver: () => updateDriver,
  updateJob: () => updateJob,
  updateJobOffer: () => updateJobOffer,
  updateServiceArea: () => updateServiceArea,
  upsertUser: () => upsertUser
});
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = (0, import_mysql2.drizzle)(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "phone", "photoUrl", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllServiceAreas() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(serviceAreas).where((0, import_drizzle_orm.eq)(serviceAreas.isActive, true));
}
async function getServiceAreaById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(serviceAreas).where((0, import_drizzle_orm.eq)(serviceAreas.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getVolumePricing(serviceAreaId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(volumePricing).where((0, import_drizzle_orm.eq)(volumePricing.serviceAreaId, serviceAreaId));
}
async function getDisposalCaps(serviceAreaId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(disposalCaps).where((0, import_drizzle_orm.eq)(disposalCaps.serviceAreaId, serviceAreaId));
}
async function getAddons(serviceAreaId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(addons).where((0, import_drizzle_orm.eq)(addons.serviceAreaId, serviceAreaId));
}
async function getDistanceRules(serviceAreaId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(distanceRules).where((0, import_drizzle_orm.eq)(distanceRules.serviceAreaId, serviceAreaId));
}
async function getLaborRates(serviceAreaId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(laborRates).where((0, import_drizzle_orm.eq)(laborRates.serviceAreaId, serviceAreaId));
}
async function getOrCreateCustomer(userId) {
  const db = await getDb();
  if (!db) return void 0;
  let result = await db.select().from(customers).where((0, import_drizzle_orm.eq)(customers.userId, userId)).limit(1);
  if (result.length === 0) {
    await db.insert(customers).values({ userId });
    result = await db.select().from(customers).where((0, import_drizzle_orm.eq)(customers.userId, userId)).limit(1);
  }
  return result[0];
}
async function getDriverByUserId(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(drivers).where((0, import_drizzle_orm.eq)(drivers.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getDriverById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(drivers).where((0, import_drizzle_orm.eq)(drivers.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllDrivers(filters) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) {
    conditions.push((0, import_drizzle_orm.eq)(drivers.status, filters.status));
  }
  if (filters?.isOnline !== void 0) {
    conditions.push((0, import_drizzle_orm.eq)(drivers.isOnline, filters.isOnline));
  }
  if (conditions.length > 0) {
    return await db.select().from(drivers).where((0, import_drizzle_orm.and)(...conditions)).orderBy((0, import_drizzle_orm.desc)(drivers.createdAt));
  }
  return await db.select().from(drivers).orderBy((0, import_drizzle_orm.desc)(drivers.createdAt));
}
async function getJobById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(jobs).where((0, import_drizzle_orm.eq)(jobs.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getJobsByCustomerId(customerId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(jobs).where((0, import_drizzle_orm.eq)(jobs.customerId, customerId)).orderBy((0, import_drizzle_orm.desc)(jobs.createdAt));
}
async function getHaulAwayDetails(jobId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(haulAwayDetails).where((0, import_drizzle_orm.eq)(haulAwayDetails.jobId, jobId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getLaborOnlyDetails(jobId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(laborOnlyDetails).where((0, import_drizzle_orm.eq)(laborOnlyDetails.jobId, jobId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getJobPhotos(jobId, photoType) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [(0, import_drizzle_orm.eq)(jobPhotos.jobId, jobId)];
  if (photoType) {
    conditions.push((0, import_drizzle_orm.eq)(jobPhotos.photoType, photoType));
  }
  return await db.select().from(jobPhotos).where((0, import_drizzle_orm.and)(...conditions)).orderBy(jobPhotos.createdAt);
}
async function getJobAssignment(jobId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(jobAssignments).where((0, import_drizzle_orm.eq)(jobAssignments.jobId, jobId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getDriverActiveJob(driverId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select({ job: jobs, assignment: jobAssignments }).from(jobAssignments).innerJoin(jobs, (0, import_drizzle_orm.eq)(jobs.id, jobAssignments.jobId)).where(
    (0, import_drizzle_orm.and)(
      (0, import_drizzle_orm.eq)(jobAssignments.driverId, driverId),
      import_drizzle_orm.sql`${jobs.status} IN ('assigned', 'en_route', 'arrived', 'started')`
    )
  ).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getPaymentByJobId(jobId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(payments).where((0, import_drizzle_orm.eq)(payments.jobId, jobId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getPayoutByJobId(jobId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(payouts).where((0, import_drizzle_orm.eq)(payouts.jobId, jobId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getEligiblePayouts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payouts).where((0, import_drizzle_orm.eq)(payouts.status, "eligible")).orderBy((0, import_drizzle_orm.desc)(payouts.createdAt));
}
async function getLatestDriverLocation(driverId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(driverLocations).where((0, import_drizzle_orm.eq)(driverLocations.driverId, driverId)).orderBy((0, import_drizzle_orm.desc)(driverLocations.timestamp)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createAuditLog(log) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(log);
}
async function getDriverRatings(driverId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(ratings).where((0, import_drizzle_orm.eq)(ratings.driverId, driverId)).orderBy((0, import_drizzle_orm.desc)(ratings.createdAt));
}
async function createServiceArea(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = `sa_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  await db.insert(serviceAreas).values({
    id,
    name: data.name,
    state: data.state,
    type: data.type,
    centerLat: data.centerLat.toString(),
    centerLng: data.centerLng.toString(),
    radiusMiles: data.radiusMiles ? data.radiusMiles.toString() : null,
    polygonGeoJson: data.polygonGeoJson || null,
    isActive: data.isActive ?? true
  });
  return await getServiceAreaById(id);
}
async function updateServiceArea(id, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.state) updateData.state = updates.state;
  if (updates.type) updateData.type = updates.type;
  if (updates.centerLat) updateData.centerLat = updates.centerLat.toString();
  if (updates.centerLng) updateData.centerLng = updates.centerLng.toString();
  if (updates.radiusMiles) updateData.radiusMiles = updates.radiusMiles.toString();
  if (updates.polygonGeoJson !== void 0) updateData.polygonGeoJson = updates.polygonGeoJson;
  if (updates.isActive !== void 0) updateData.isActive = updates.isActive;
  await db.update(serviceAreas).set(updateData).where((0, import_drizzle_orm.eq)(serviceAreas.id, id));
  return await getServiceAreaById(id);
}
async function deleteServiceArea(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(serviceAreas).set({ isActive: false }).where((0, import_drizzle_orm.eq)(serviceAreas.id, id));
  return { success: true };
}
async function findServiceAreaByCoordinates(lat, lon) {
  const db = await getDb();
  if (!db) return void 0;
  const areas = await db.select().from(serviceAreas).where((0, import_drizzle_orm.eq)(serviceAreas.isActive, true));
  for (const area of areas) {
    if (area.radiusMiles && area.centerLat && area.centerLng) {
      const centerLat = parseFloat(area.centerLat);
      const centerLng = parseFloat(area.centerLng);
      const radiusMiles = parseFloat(area.radiusMiles);
      const distance = calculateDistance(lat, lon, centerLat, centerLng);
      if (distance <= radiusMiles) {
        return area;
      }
    }
  }
  return void 0;
}
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
async function createJob(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const customer = await getCustomerById(data.customerId);
  const user = customer ? await getUserById(customer.userId) : null;
  await db.insert(jobs).values({
    id,
    customerId: data.customerId,
    serviceAreaId: data.serviceAreaId,
    jobType: data.serviceType,
    status: data.status,
    contactName: user?.name || "Customer",
    contactPhone: user?.phone || "N/A",
    contactEmail: user?.email || null,
    pickupAddress: data.pickupAddress,
    pickupLat: data.pickupLat,
    pickupLng: data.pickupLon,
    pickupNotes: data.specialInstructions || null,
    servicePrice: data.subtotal,
    total: data.totalAmount,
    platformFee: data.platformFee,
    scheduledFor: data.scheduledFor
  });
  return await getJobById(id);
}
async function updateJob(id, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = {};
  if (updates.status) updateData.status = updates.status;
  if (updates.paidAt) updateData.paidAt = updates.paidAt;
  if (updates.completedAt) updateData.completedAt = updates.completedAt;
  if (updates.cancellationReason) updateData.pickupNotes = updates.cancellationReason;
  await db.update(jobs).set(updateData).where((0, import_drizzle_orm.eq)(jobs.id, id));
  return await getJobById(id);
}
async function getAllJobs(filters) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(jobs);
  const conditions = [];
  if (filters?.status) {
    conditions.push((0, import_drizzle_orm.eq)(jobs.status, filters.status));
  }
  if (filters?.customerId) {
    conditions.push((0, import_drizzle_orm.eq)(jobs.customerId, filters.customerId));
  }
  if (conditions.length > 0) {
    query = query.where((0, import_drizzle_orm.and)(...conditions));
  }
  const limit = filters?.limit || 20;
  const offset = filters?.offset || 0;
  return await query.orderBy((0, import_drizzle_orm.desc)(jobs.createdAt)).limit(limit).offset(offset);
}
async function createHaulAwayDetails(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(haulAwayDetails).values({
    jobId: data.jobId,
    volumeTier: data.volumeTier,
    disposalCap: data.disposalCostActual,
    sameDay: false
  });
}
async function createLaborOnlyDetails(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const hours = parseInt(data.estimatedHours);
  await db.insert(laborOnlyDetails).values({
    jobId: data.jobId,
    helpersCount: 1,
    hoursBooked: hours
  });
}
async function createPayment(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  await db.insert(payments).values({
    id,
    jobId: data.jobId,
    customerId: data.customerId,
    amount: data.amount,
    provider: data.provider,
    providerRef: data.providerRef || null,
    status: data.status
  });
  const result = await db.select().from(payments).where((0, import_drizzle_orm.eq)(payments.id, id)).limit(1);
  return result[0];
}
async function getCustomerByUserId(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(customers).where((0, import_drizzle_orm.eq)(customers.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getCustomerById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(customers).where((0, import_drizzle_orm.eq)(customers.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createCustomer(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(customers).values({
    userId: data.userId
  });
  return await getCustomerByUserId(data.userId);
}
async function createJobPhoto(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(jobPhotos).values({
    jobId: data.jobId,
    photoType: data.photoType,
    fileUrl: data.url,
    storageKey: data.url,
    // Use URL as key for now
    uploadedBy: parseInt(data.uploadedBy)
  });
  const photos = await db.select().from(jobPhotos).where((0, import_drizzle_orm.eq)(jobPhotos.jobId, data.jobId)).orderBy((0, import_drizzle_orm.desc)(jobPhotos.createdAt)).limit(1);
  return photos[0];
}
async function createDriver(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(drivers).values({
    userId: data.userId,
    insuranceProvider: data.insuranceProvider,
    insurancePolicyNumber: data.insurancePolicy,
    insuranceExpiresAt: data.insuranceExpiry,
    status: data.status
  });
  return await getDriverByUserId(data.userId);
}
async function updateDriver(id, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = {};
  if (updates.status) updateData.status = updates.status;
  if (updates.isOnline !== void 0) updateData.isOnline = updates.isOnline;
  await db.update(drivers).set(updateData).where((0, import_drizzle_orm.eq)(drivers.id, id));
  return await getDriverById(id);
}
async function createDriverVehicle(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(drivers).set({
    vehicleType: data.vehicleType
  }).where((0, import_drizzle_orm.eq)(drivers.id, data.driverId));
}
async function getDriverVehicles(driverId) {
  const db = await getDb();
  if (!db) return [];
  const driver = await getDriverById(driverId);
  if (!driver || !driver.vehicleType) return [];
  return [{
    vehicleType: driver.vehicleType
  }];
}
async function createJobOffer(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = `offer_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  await db.insert(jobOffers).values({
    id,
    jobId: data.jobId,
    driverId: data.driverId,
    wave: data.wave,
    expiresAt: data.expiresAt
  });
  const result = await db.select().from(jobOffers).where((0, import_drizzle_orm.eq)(jobOffers.id, id)).limit(1);
  return result[0];
}
async function getJobOffers(jobId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(jobOffers).where((0, import_drizzle_orm.eq)(jobOffers.jobId, jobId));
}
async function updateJobOffer(id, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = {};
  if (updates.status) updateData.status = updates.status;
  if (updates.respondedAt) updateData.respondedAt = updates.respondedAt;
  await db.update(jobOffers).set(updateData).where((0, import_drizzle_orm.eq)(jobOffers.id, id));
  const result = await db.select().from(jobOffers).where((0, import_drizzle_orm.eq)(jobOffers.id, id)).limit(1);
  return result[0];
}
async function createJobAssignment(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(jobAssignments).values({
    jobId: data.jobId,
    driverId: data.driverId
  });
  const result = await db.select().from(jobAssignments).where((0, import_drizzle_orm.eq)(jobAssignments.jobId, data.jobId)).limit(1);
  return result[0];
}
async function createPayout(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = `payout_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  await db.insert(payouts).values({
    id,
    jobId: data.jobId,
    driverId: data.driverId,
    driverPayout: data.driverPayout,
    disposalReimbursement: data.disposalReimbursement,
    totalAmount: data.totalAmount
  });
  const result = await db.select().from(payouts).where((0, import_drizzle_orm.eq)(payouts.id, id)).limit(1);
  return result[0];
}
var import_drizzle_orm, import_mysql2, _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    import_drizzle_orm = require("drizzle-orm");
    import_mysql2 = require("drizzle-orm/mysql2");
    init_schema();
    init_env();
    _db = null;
  }
});

// vite.config.ts
var import_vite_plugin_jsx_loc, import_vite, import_plugin_react, import_path, import_vite2, import_vite_plugin_manus_runtime, import_meta, plugins, vite_config_default;
var init_vite_config = __esm({
  "vite.config.ts"() {
    "use strict";
    import_vite_plugin_jsx_loc = require("@builder.io/vite-plugin-jsx-loc");
    import_vite = __toESM(require("@tailwindcss/vite"), 1);
    import_plugin_react = __toESM(require("@vitejs/plugin-react"), 1);
    import_path = __toESM(require("path"), 1);
    import_vite2 = require("vite");
    import_vite_plugin_manus_runtime = require("vite-plugin-manus-runtime");
    import_meta = {};
    plugins = [(0, import_plugin_react.default)(), (0, import_vite.default)(), (0, import_vite_plugin_jsx_loc.jsxLocPlugin)(), (0, import_vite_plugin_manus_runtime.vitePluginManusRuntime)()];
    vite_config_default = (0, import_vite2.defineConfig)({
      plugins,
      resolve: {
        alias: {
          "@": import_path.default.resolve(import_meta.dirname, "client", "src"),
          "@shared": import_path.default.resolve(import_meta.dirname, "shared"),
          "@assets": import_path.default.resolve(import_meta.dirname, "attached_assets")
        }
      },
      envDir: import_path.default.resolve(import_meta.dirname),
      root: import_path.default.resolve(import_meta.dirname, "client"),
      publicDir: import_path.default.resolve(import_meta.dirname, "client", "public"),
      build: {
        outDir: import_path.default.resolve(import_meta.dirname, "dist/public"),
        emptyOutDir: true
      },
      server: {
        host: true,
        allowedHosts: [
          ".manuspre.computer",
          ".manus.computer",
          ".manus-asia.computer",
          ".manuscomputer.ai",
          ".manusvm.computer",
          "localhost",
          "127.0.0.1"
        ],
        fs: {
          strict: true,
          deny: ["**/.*"]
        }
      }
    });
  }
});

// server/_core/vite.ts
var vite_exports = {};
__export(vite_exports, {
  serveStatic: () => serveStatic,
  setupVite: () => setupVite
});
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await (0, import_vite3.createServer)({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = import_path2.default.resolve(
        import_meta2.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await import_fs.default.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${(0, import_nanoid2.nanoid)()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? import_path2.default.resolve(import_meta2.dirname, "../..", "dist", "public") : import_path2.default.resolve(import_meta2.dirname, "public");
  if (!import_fs.default.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(import_express4.default.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(import_path2.default.resolve(distPath, "index.html"));
  });
}
var import_express4, import_fs, import_nanoid2, import_path2, import_vite3, import_meta2;
var init_vite = __esm({
  "server/_core/vite.ts"() {
    "use strict";
    import_express4 = __toESM(require("express"), 1);
    import_fs = __toESM(require("fs"), 1);
    import_nanoid2 = require("nanoid");
    import_path2 = __toESM(require("path"), 1);
    import_vite3 = require("vite");
    init_vite_config();
    import_meta2 = {};
  }
});

// server/_core/index.ts
var import_config = require("dotenv/config");
var import_express5 = __toESM(require("express"), 1);
var import_http = require("http");
var import_net = __toESM(require("net"), 1);
var import_express6 = require("@trpc/server/adapters/express");

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
var import_axios = __toESM(require("axios"), 1);
var import_cookie = require("cookie");
var import_jose = require("jose");
init_db();
init_env();
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => import_axios.default.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = (0, import_cookie.parse)(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new import_jose.SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await (0, import_jose.jwtVerify)(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
var import_zod = require("zod");

// server/_core/notification.ts
var import_server = require("@trpc/server");
init_env();
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new import_server.TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new import_server.TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new import_server.TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
var import_server2 = require("@trpc/server");
var import_superjson = __toESM(require("superjson"), 1);
var t = import_server2.initTRPC.context().create({
  transformer: import_superjson.default
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new import_server2.TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new import_server2.TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    import_zod.z.object({
      timestamp: import_zod.z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    import_zod.z.object({
      title: import_zod.z.string().min(1, "title is required"),
      content: import_zod.z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers/serviceAreas.ts
var import_zod2 = require("zod");
var import_server3 = require("@trpc/server");
init_db();
var serviceAreasRouter = router({
  // Public: Get all service areas
  list: publicProcedure.query(async () => {
    return await getAllServiceAreas();
  }),
  // Public: Get service area by ID
  getById: publicProcedure.input(import_zod2.z.object({ id: import_zod2.z.string() })).query(async ({ input }) => {
    const area = await getServiceAreaById(input.id);
    if (!area) {
      throw new import_server3.TRPCError({
        code: "NOT_FOUND",
        message: "Service area not found"
      });
    }
    return area;
  }),
  // Public: Check if coordinates are within service area
  checkCoverage: publicProcedure.input(
    import_zod2.z.object({
      latitude: import_zod2.z.number().min(-90).max(90),
      longitude: import_zod2.z.number().min(-180).max(180)
    })
  ).query(async ({ input }) => {
    const area = await findServiceAreaByCoordinates(
      input.latitude,
      input.longitude
    );
    return {
      covered: !!area,
      serviceArea: area || null
    };
  }),
  // Admin: Create service area
  create: protectedProcedure.input(
    import_zod2.z.object({
      name: import_zod2.z.string().min(1),
      state: import_zod2.z.string().length(2),
      type: import_zod2.z.enum(["radius", "polygon"]),
      centerLat: import_zod2.z.number().min(-90).max(90),
      centerLng: import_zod2.z.number().min(-180).max(180),
      radiusMiles: import_zod2.z.number().positive().optional(),
      polygonGeoJson: import_zod2.z.any().optional(),
      isActive: import_zod2.z.boolean().default(true)
    })
  ).mutation(async ({ input, ctx }) => {
    return await createServiceArea(input);
  }),
  // Admin: Update service area
  update: protectedProcedure.input(
    import_zod2.z.object({
      id: import_zod2.z.string(),
      name: import_zod2.z.string().min(1).optional(),
      state: import_zod2.z.string().length(2).optional(),
      type: import_zod2.z.enum(["radius", "polygon"]).optional(),
      centerLat: import_zod2.z.number().min(-90).max(90).optional(),
      centerLng: import_zod2.z.number().min(-180).max(180).optional(),
      radiusMiles: import_zod2.z.number().positive().optional(),
      polygonGeoJson: import_zod2.z.any().optional(),
      isActive: import_zod2.z.boolean().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const { id, ...updates } = input;
    return await updateServiceArea(id, updates);
  }),
  // Admin: Delete service area
  delete: protectedProcedure.input(import_zod2.z.object({ id: import_zod2.z.string() })).mutation(async ({ input, ctx }) => {
    return await deleteServiceArea(input.id);
  })
});

// server/routers/pricing.ts
var import_zod3 = require("zod");
var import_server4 = require("@trpc/server");
init_db();
var VOLUME_TIERS = {
  "1_8": { min: 0, max: 3, label: "1/8 truck" },
  "1_4": { min: 3, max: 6, label: "1/4 truck" },
  "1_2": { min: 6, max: 12, label: "1/2 truck" },
  "3_4": { min: 12, max: 18, label: "3/4 truck" },
  full: { min: 18, max: 24, label: "Full truck" }
};
var ADDON_LABELS = {
  stairs_1: { name: "1 Flight of Stairs", description: "Additional charge for 1 flight of stairs" },
  stairs_2plus: { name: "2+ Flights of Stairs", description: "Additional charge for 2 or more flights" },
  long_carry: { name: "Long Carry", description: "Items require extended distance carry" },
  heavy: { name: "Heavy Items", description: "Extra heavy or bulky items" },
  mattress: { name: "Mattress Disposal", description: "Special mattress disposal fee" },
  appliances: { name: "Appliance Removal", description: "Refrigerator, washer, dryer, etc." },
  same_day: { name: "Same-Day Service", description: "Rush service for same-day pickup" }
};
function getVolumeTier(cubicYards) {
  for (const [tier, range] of Object.entries(VOLUME_TIERS)) {
    if (cubicYards >= range.min && cubicYards < range.max) {
      return tier;
    }
  }
  if (cubicYards >= 18) return "full";
  return null;
}
var pricingRouter = router({
  // Calculate quote for HAUL_AWAY service
  calculateHaulAway: publicProcedure.input(
    import_zod3.z.object({
      serviceAreaId: import_zod3.z.string(),
      volumeCubicYards: import_zod3.z.number().positive(),
      distanceMiles: import_zod3.z.number().nonnegative(),
      addonIds: import_zod3.z.array(import_zod3.z.number()).optional()
    })
  ).mutation(async ({ input }) => {
    const serviceArea = await getServiceAreaById(input.serviceAreaId);
    if (!serviceArea) {
      throw new import_server4.TRPCError({
        code: "NOT_FOUND",
        message: "Service area not found"
      });
    }
    const volumeTier = getVolumeTier(input.volumeCubicYards);
    if (!volumeTier) {
      throw new import_server4.TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid volume amount"
      });
    }
    const volumePrices = await getVolumePricing(input.serviceAreaId);
    const disposalCaps2 = await getDisposalCaps(input.serviceAreaId);
    const distanceRules2 = await getDistanceRules(input.serviceAreaId);
    const availableAddons = await getAddons(input.serviceAreaId);
    const volumePriceData = volumePrices.find((vp) => vp.volumeTier === volumeTier);
    const volumePrice = volumePriceData ? parseFloat(volumePriceData.basePrice) : 0;
    let distanceFee = 0;
    const sortedDistanceRules = distanceRules2.sort(
      (a, b) => parseFloat(a.minMiles) - parseFloat(b.minMiles)
    );
    for (const rule of sortedDistanceRules) {
      const minMiles = parseFloat(rule.minMiles);
      const maxMiles = rule.maxMiles ? parseFloat(rule.maxMiles) : Infinity;
      if (input.distanceMiles >= minMiles && input.distanceMiles <= maxMiles) {
        distanceFee = parseFloat(rule.surcharge);
        break;
      }
    }
    let addonsTotal = 0;
    const selectedAddons = [];
    if (input.addonIds && input.addonIds.length > 0) {
      for (const addonId of input.addonIds) {
        const addon = availableAddons.find((a) => a.id === addonId);
        if (addon) {
          addonsTotal += parseFloat(addon.price);
          const addonInfo = ADDON_LABELS[addon.addonType] || {
            name: addon.addonType,
            description: ""
          };
          selectedAddons.push({
            id: addon.id,
            name: addonInfo.name,
            price: parseFloat(addon.price)
          });
        }
      }
    }
    const disposalCapData = disposalCaps2.find((dc) => dc.volumeTier === volumeTier);
    const disposalCapAmount = disposalCapData ? parseFloat(disposalCapData.capAmount) : 0;
    const subtotal = volumePrice + distanceFee + addonsTotal;
    const platformFee = subtotal * 0.05;
    const total = subtotal + platformFee;
    return {
      serviceAreaId: input.serviceAreaId,
      serviceAreaName: serviceArea.name,
      serviceType: "HAUL_AWAY",
      volumeCubicYards: input.volumeCubicYards,
      volumeTier,
      volumeTierLabel: VOLUME_TIERS[volumeTier].label,
      distanceMiles: input.distanceMiles,
      lineItems: [
        {
          description: `Haul Away (${VOLUME_TIERS[volumeTier].label})`,
          amount: volumePrice
        },
        ...distanceFee > 0 ? [
          {
            description: `Distance Surcharge (${input.distanceMiles.toFixed(1)} miles)`,
            amount: distanceFee
          }
        ] : [],
        ...selectedAddons.map((addon) => ({
          description: addon.name,
          amount: addon.price
        })),
        {
          description: "Platform Fee (5%)",
          amount: platformFee
        }
      ],
      subtotal,
      platformFee,
      total,
      disposalCapAmount,
      disposalCapMessage: `Includes disposal up to $${disposalCapAmount.toFixed(2)}. Additional disposal costs will be reimbursed with receipt.`
    };
  }),
  // Calculate quote for LABOR_ONLY service
  calculateLaborOnly: publicProcedure.input(
    import_zod3.z.object({
      serviceAreaId: import_zod3.z.string(),
      hours: import_zod3.z.number().min(2),
      // 2-hour minimum
      distanceMiles: import_zod3.z.number().nonnegative()
    })
  ).mutation(async ({ input }) => {
    const serviceArea = await getServiceAreaById(input.serviceAreaId);
    if (!serviceArea) {
      throw new import_server4.TRPCError({
        code: "NOT_FOUND",
        message: "Service area not found"
      });
    }
    const laborRates2 = await getLaborRates(input.serviceAreaId);
    if (laborRates2.length === 0) {
      throw new import_server4.TRPCError({
        code: "NOT_FOUND",
        message: "No labor rates configured for this service area"
      });
    }
    const laborRate = laborRates2[0];
    const hourlyRate = parseFloat(laborRate.hourlyRate);
    const distanceRules2 = await getDistanceRules(input.serviceAreaId);
    let distanceFee = 0;
    const sortedDistanceRules = distanceRules2.sort(
      (a, b) => parseFloat(a.minMiles) - parseFloat(b.minMiles)
    );
    for (const rule of sortedDistanceRules) {
      const minMiles = parseFloat(rule.minMiles);
      const maxMiles = rule.maxMiles ? parseFloat(rule.maxMiles) : Infinity;
      if (input.distanceMiles >= minMiles && input.distanceMiles <= maxMiles) {
        distanceFee = parseFloat(rule.surcharge);
        break;
      }
    }
    const laborCost = hourlyRate * input.hours;
    const subtotal = laborCost + distanceFee;
    const platformFee = subtotal * 0.05;
    const total = subtotal + platformFee;
    return {
      serviceAreaId: input.serviceAreaId,
      serviceAreaName: serviceArea.name,
      serviceType: "LABOR_ONLY",
      hours: input.hours,
      hourlyRate,
      distanceMiles: input.distanceMiles,
      lineItems: [
        {
          description: `Labor (${input.hours} hours @ $${hourlyRate}/hr)`,
          amount: laborCost
        },
        ...distanceFee > 0 ? [
          {
            description: `Distance Surcharge (${input.distanceMiles.toFixed(1)} miles)`,
            amount: distanceFee
          }
        ] : [],
        {
          description: "Platform Fee (5%)",
          amount: platformFee
        }
      ],
      subtotal,
      platformFee,
      total,
      minimumHours: 2,
      note: "2-hour minimum. Additional time can be requested during the job."
    };
  }),
  // Get available addons for service area
  getAddons: publicProcedure.input(import_zod3.z.object({ serviceAreaId: import_zod3.z.string() })).query(async ({ input }) => {
    const addons2 = await getAddons(input.serviceAreaId);
    return addons2.map((addon) => {
      const addonInfo = ADDON_LABELS[addon.addonType] || {
        name: addon.addonType,
        description: ""
      };
      return {
        id: addon.id,
        type: addon.addonType,
        name: addonInfo.name,
        description: addonInfo.description,
        price: parseFloat(addon.price)
      };
    });
  })
});

// server/routers/jobs.ts
var import_zod4 = require("zod");
var import_server5 = require("@trpc/server");
init_db();
var jobsRouter = router({
  // Create a new job (customer)
  create: protectedProcedure.input(
    import_zod4.z.object({
      serviceAreaId: import_zod4.z.string(),
      serviceType: import_zod4.z.enum(["HAUL_AWAY", "LABOR_ONLY"]),
      pickupAddress: import_zod4.z.string(),
      pickupLat: import_zod4.z.number(),
      pickupLon: import_zod4.z.number(),
      scheduledFor: import_zod4.z.string().optional(),
      // ISO date string
      specialInstructions: import_zod4.z.string().optional(),
      // Haul Away specific
      volumeCubicYards: import_zod4.z.number().optional(),
      volumeTier: import_zod4.z.enum(["1_8", "1_4", "1_2", "3_4", "full"]).optional(),
      addonIds: import_zod4.z.array(import_zod4.z.number()).optional(),
      // Labor Only specific
      estimatedHours: import_zod4.z.number().optional(),
      // Pricing
      subtotal: import_zod4.z.number(),
      platformFee: import_zod4.z.number(),
      totalAmount: import_zod4.z.number()
    })
  ).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new import_server5.TRPCError({ code: "UNAUTHORIZED" });
    }
    let customer = await getCustomerByUserId(ctx.user.id);
    if (!customer) {
      customer = await createCustomer({
        userId: ctx.user.id
      });
    }
    if (!customer) {
      throw new import_server5.TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create customer"
      });
    }
    const job = await createJob({
      customerId: customer.id,
      serviceAreaId: input.serviceAreaId,
      serviceType: input.serviceType,
      status: "draft",
      pickupAddress: input.pickupAddress,
      pickupLat: input.pickupLat.toString(),
      pickupLon: input.pickupLon.toString(),
      scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
      specialInstructions: input.specialInstructions,
      subtotal: input.subtotal.toString(),
      platformFee: input.platformFee.toString(),
      totalAmount: input.totalAmount.toString()
    });
    if (!job) {
      throw new import_server5.TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create job"
      });
    }
    if (input.serviceType === "HAUL_AWAY" && input.volumeTier) {
      await createHaulAwayDetails({
        jobId: job.id,
        volumeCubicYards: input.volumeCubicYards?.toString() || "0",
        volumeTier: input.volumeTier,
        disposalCostActual: "0"
      });
    } else if (input.serviceType === "LABOR_ONLY" && input.estimatedHours) {
      await createLaborOnlyDetails({
        jobId: job.id,
        estimatedHours: input.estimatedHours.toString(),
        actualHours: input.estimatedHours.toString()
      });
    }
    return job;
  }),
  // Get job by ID
  getById: protectedProcedure.input(import_zod4.z.object({ id: import_zod4.z.string() })).query(async ({ input, ctx }) => {
    const job = await getJobById(input.id);
    if (!job) {
      throw new import_server5.TRPCError({ code: "NOT_FOUND", message: "Job not found" });
    }
    return job;
  }),
  // List jobs (with filters)
  list: protectedProcedure.input(
    import_zod4.z.object({
      status: import_zod4.z.string().optional(),
      customerId: import_zod4.z.number().optional(),
      driverId: import_zod4.z.number().optional(),
      limit: import_zod4.z.number().min(1).max(100).default(20),
      offset: import_zod4.z.number().min(0).default(0)
    }).optional()
  ).query(async ({ input, ctx }) => {
    const filters = input || {};
    return await getAllJobs(filters);
  }),
  // Update job status
  updateStatus: protectedProcedure.input(
    import_zod4.z.object({
      id: import_zod4.z.string(),
      status: import_zod4.z.enum([
        "draft",
        "quoted",
        "dispatching",
        "assigned",
        "en_route",
        "arrived",
        "started",
        "completed",
        "cancelled",
        "no_coverage"
      ])
    })
  ).mutation(async ({ input, ctx }) => {
    return await updateJob(input.id, { status: input.status });
  }),
  // Process payment for job
  pay: protectedProcedure.input(
    import_zod4.z.object({
      jobId: import_zod4.z.string(),
      paymentMethod: import_zod4.z.string(),
      paymentIntentId: import_zod4.z.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new import_server5.TRPCError({ code: "UNAUTHORIZED" });
    }
    const job = await getJobById(input.jobId);
    if (!job) {
      throw new import_server5.TRPCError({ code: "NOT_FOUND", message: "Job not found" });
    }
    if (job.status !== "draft" && job.status !== "quoted") {
      throw new import_server5.TRPCError({
        code: "BAD_REQUEST",
        message: "Job has already been paid or cancelled"
      });
    }
    const payment = await createPayment({
      jobId: job.id,
      customerId: job.customerId,
      amount: job.total || "0",
      provider: input.paymentMethod,
      providerRef: input.paymentIntentId,
      status: "succeeded"
    });
    await updateJob(job.id, { status: "dispatching", paidAt: /* @__PURE__ */ new Date() });
    return {
      success: true,
      payment,
      job: await getJobById(job.id)
    };
  }),
  // Cancel job
  cancel: protectedProcedure.input(
    import_zod4.z.object({
      jobId: import_zod4.z.string(),
      reason: import_zod4.z.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const job = await getJobById(input.jobId);
    if (!job) {
      throw new import_server5.TRPCError({ code: "NOT_FOUND", message: "Job not found" });
    }
    return await updateJob(job.id, {
      status: "cancelled",
      cancelledAt: /* @__PURE__ */ new Date(),
      cancellationReason: input.reason
    });
  })
});

// server/routers/media.ts
var import_zod5 = require("zod");
var import_server6 = require("@trpc/server");

// server/storage.ts
init_env();
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

// server/routers/media.ts
init_db();
var mediaRouter = router({
  // Generate upload URL for client-side upload
  getUploadUrl: protectedProcedure.input(
    import_zod5.z.object({
      filename: import_zod5.z.string(),
      contentType: import_zod5.z.string(),
      jobId: import_zod5.z.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new import_server6.TRPCError({ code: "UNAUTHORIZED" });
    }
    const timestamp2 = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileKey = `uploads/${ctx.user.id}/${timestamp2}-${random}-${input.filename}`;
    return {
      fileKey,
      uploadUrl: `/api/media/upload`
      // Client will POST here
    };
  }),
  // Upload file (called from client)
  upload: protectedProcedure.input(
    import_zod5.z.object({
      fileKey: import_zod5.z.string(),
      fileData: import_zod5.z.string(),
      // Base64 encoded
      contentType: import_zod5.z.string(),
      jobId: import_zod5.z.string().optional(),
      photoType: import_zod5.z.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new import_server6.TRPCError({ code: "UNAUTHORIZED" });
    }
    const buffer = Buffer.from(input.fileData, "base64");
    const result = await storagePut(input.fileKey, buffer, input.contentType);
    if (input.jobId) {
      await createJobPhoto({
        jobId: input.jobId,
        photoType: input.photoType || "other",
        url: result.url,
        uploadedBy: ctx.user.id.toString()
      });
    }
    return {
      success: true,
      url: result.url,
      key: result.key
    };
  }),
  // Get photos for a job
  getJobPhotos: protectedProcedure.input(
    import_zod5.z.object({
      jobId: import_zod5.z.string(),
      photoType: import_zod5.z.string().optional()
    })
  ).query(async ({ input, ctx }) => {
    return await getJobPhotos(input.jobId, input.photoType);
  })
});

// server/routers/drivers.ts
var import_zod6 = require("zod");
var import_server7 = require("@trpc/server");
init_db();
var driversRouter = router({
  // Driver onboarding (create driver profile)
  onboard: protectedProcedure.input(
    import_zod6.z.object({
      licenseNumber: import_zod6.z.string(),
      licenseState: import_zod6.z.string(),
      licenseExpiry: import_zod6.z.string(),
      // ISO date
      vehicleType: import_zod6.z.string(),
      vehicleMake: import_zod6.z.string(),
      vehicleModel: import_zod6.z.string(),
      vehicleYear: import_zod6.z.number(),
      vehiclePlate: import_zod6.z.string(),
      vehicleState: import_zod6.z.string(),
      insuranceProvider: import_zod6.z.string(),
      insurancePolicy: import_zod6.z.string(),
      insuranceExpiry: import_zod6.z.string()
      // ISO date
    })
  ).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new import_server7.TRPCError({ code: "UNAUTHORIZED" });
    }
    const existing = await getDriverByUserId(ctx.user.id);
    if (existing) {
      throw new import_server7.TRPCError({
        code: "BAD_REQUEST",
        message: "Driver profile already exists"
      });
    }
    const driver = await createDriver({
      userId: ctx.user.id,
      licenseNumber: input.licenseNumber,
      licenseState: input.licenseState,
      licenseExpiry: new Date(input.licenseExpiry),
      insuranceProvider: input.insuranceProvider,
      insurancePolicy: input.insurancePolicy,
      insuranceExpiry: new Date(input.insuranceExpiry),
      status: "pending_approval"
    });
    if (!driver) {
      throw new import_server7.TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create driver profile"
      });
    }
    await createDriverVehicle({
      driverId: driver.id,
      vehicleType: input.vehicleType,
      make: input.vehicleMake,
      model: input.vehicleModel,
      year: input.vehicleYear,
      licensePlate: input.vehiclePlate,
      state: input.vehicleState
    });
    return {
      success: true,
      driver,
      message: "Driver application submitted. We'll review and notify you within 24-48 hours."
    };
  }),
  // Get driver profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new import_server7.TRPCError({ code: "UNAUTHORIZED" });
    }
    const driver = await getDriverByUserId(ctx.user.id);
    if (!driver) {
      return null;
    }
    const vehicles = await getDriverVehicles(driver.id);
    return {
      ...driver,
      vehicles
    };
  }),
  // Admin: List all drivers
  listAll: protectedProcedure.input(
    import_zod6.z.object({
      status: import_zod6.z.string().optional(),
      limit: import_zod6.z.number().min(1).max(100).default(20),
      offset: import_zod6.z.number().min(0).default(0)
    }).optional()
  ).query(async ({ input, ctx }) => {
    const filters = input || {};
    return await getAllDrivers(filters);
  }),
  // Admin: Approve driver
  approve: protectedProcedure.input(import_zod6.z.object({ driverId: import_zod6.z.number() })).mutation(async ({ input, ctx }) => {
    return await updateDriver(input.driverId, {
      status: "approved",
      approvedAt: /* @__PURE__ */ new Date()
    });
  }),
  // Admin: Reject driver
  reject: protectedProcedure.input(
    import_zod6.z.object({
      driverId: import_zod6.z.number(),
      reason: import_zod6.z.string()
    })
  ).mutation(async ({ input, ctx }) => {
    return await updateDriver(input.driverId, {
      status: "rejected"
    });
  }),
  // Driver: Go online
  goOnline: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new import_server7.TRPCError({ code: "UNAUTHORIZED" });
    }
    const driver = await getDriverByUserId(ctx.user.id);
    if (!driver) {
      throw new import_server7.TRPCError({
        code: "NOT_FOUND",
        message: "Driver profile not found"
      });
    }
    if (driver.status !== "approved") {
      throw new import_server7.TRPCError({
        code: "FORBIDDEN",
        message: "Driver must be approved to go online"
      });
    }
    return await updateDriver(driver.id, { isOnline: true });
  }),
  // Driver: Go offline
  goOffline: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new import_server7.TRPCError({ code: "UNAUTHORIZED" });
    }
    const driver = await getDriverByUserId(ctx.user.id);
    if (!driver) {
      throw new import_server7.TRPCError({
        code: "NOT_FOUND",
        message: "Driver profile not found"
      });
    }
    return await updateDriver(driver.id, { isOnline: false });
  }),
  // Driver: Cancel order
  cancelOrder: protectedProcedure.input(import_zod6.z.object({ orderId: import_zod6.z.string() })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new import_server7.TRPCError({ code: "UNAUTHORIZED" });
    }
    const driver = await getDriverByUserId(ctx.user.id);
    if (!driver) {
      throw new import_server7.TRPCError({
        code: "NOT_FOUND",
        message: "Driver profile not found"
      });
    }
    const { updateJob: updateJob2 } = (init_db(), __toCommonJS(db_exports));
    await updateJob2(input.orderId, {
      status: "cancelled",
      cancellationReason: "Cancelled by driver"
    });
    return { success: true, message: "Order cancelled successfully" };
  })
});

// server/routers/dispatch.ts
var import_zod7 = require("zod");
var import_server8 = require("@trpc/server");
init_db();
var dispatchRouter = router({
  // Start dispatch process (find drivers)
  startDispatch: protectedProcedure.input(import_zod7.z.object({ jobId: import_zod7.z.string() })).mutation(async ({ input, ctx }) => {
    const job = await getJobById(input.jobId);
    if (!job) {
      throw new import_server8.TRPCError({ code: "NOT_FOUND", message: "Job not found" });
    }
    if (job.status !== "dispatching") {
      throw new import_server8.TRPCError({
        code: "BAD_REQUEST",
        message: "Job must be in dispatching status"
      });
    }
    const drivers2 = await getAllDrivers({
      status: "approved",
      isOnline: true
    });
    if (drivers2.length === 0) {
      await updateJob(input.jobId, { status: "no_coverage" });
      return {
        success: false,
        message: "No drivers available"
      };
    }
    const wave1Drivers = drivers2.slice(0, 3);
    const expiresAt = new Date(Date.now() + 2 * 60 * 1e3);
    for (const driver of wave1Drivers) {
      await createJobOffer({
        jobId: input.jobId,
        driverId: driver.id,
        wave: 1,
        expiresAt
      });
    }
    return {
      success: true,
      offersCreated: wave1Drivers.length,
      wave: 1
    };
  }),
  // Driver accepts offer
  acceptOffer: protectedProcedure.input(import_zod7.z.object({ offerId: import_zod7.z.string() })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new import_server8.TRPCError({ code: "UNAUTHORIZED" });
    }
    const offer = await updateJobOffer(input.offerId, {
      status: "accepted",
      respondedAt: /* @__PURE__ */ new Date()
    });
    if (!offer) {
      throw new import_server8.TRPCError({ code: "NOT_FOUND", message: "Offer not found" });
    }
    await createJobAssignment({
      jobId: offer.jobId,
      driverId: offer.driverId
    });
    await updateJob(offer.jobId, { status: "assigned" });
    return {
      success: true,
      job: await getJobById(offer.jobId)
    };
  }),
  // Driver rejects offer
  rejectOffer: protectedProcedure.input(import_zod7.z.object({ offerId: import_zod7.z.string() })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new import_server8.TRPCError({ code: "UNAUTHORIZED" });
    }
    await updateJobOffer(input.offerId, {
      status: "rejected",
      respondedAt: /* @__PURE__ */ new Date()
    });
    return { success: true };
  }),
  // Get pending offers for driver
  getMyOffers: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new import_server8.TRPCError({ code: "UNAUTHORIZED" });
    }
    return [];
  })
});

// server/routers/ledger.ts
var import_zod8 = require("zod");
var import_server9 = require("@trpc/server");
init_db();
var ledgerRouter = router({
  // Finalize job and create payout
  finalizeJob: protectedProcedure.input(
    import_zod8.z.object({
      jobId: import_zod8.z.string(),
      disposalCostActual: import_zod8.z.number().optional(),
      disposalReceiptUrl: import_zod8.z.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const job = await getJobById(input.jobId);
    if (!job) {
      throw new import_server9.TRPCError({ code: "NOT_FOUND", message: "Job not found" });
    }
    if (job.status !== "completed") {
      throw new import_server9.TRPCError({
        code: "BAD_REQUEST",
        message: "Job must be completed before finalization"
      });
    }
    const servicePrice = parseFloat(job.servicePrice || "0");
    const driverPayout = servicePrice * 0.6;
    let disposalReimbursement = 0;
    if (input.disposalCostActual && job.disposalCap) {
      const cap = parseFloat(job.disposalCap);
      if (input.disposalCostActual > cap) {
        disposalReimbursement = input.disposalCostActual - cap;
      }
    }
    const totalPayout = driverPayout + disposalReimbursement;
    const payout = await createPayout({
      jobId: job.id,
      driverId: 0,
      // TODO: Get driver ID from job assignment
      driverPayout: driverPayout.toString(),
      disposalReimbursement: disposalReimbursement.toString(),
      totalAmount: totalPayout.toString(),
      disposalReceiptUrl: input.disposalReceiptUrl
    });
    await updateJob(job.id, {
      completedAt: /* @__PURE__ */ new Date()
    });
    return {
      success: true,
      payout
    };
  }),
  // Get payout history for driver
  getMyPayouts: protectedProcedure.input(
    import_zod8.z.object({
      limit: import_zod8.z.number().min(1).max(100).default(20),
      offset: import_zod8.z.number().min(0).default(0)
    }).optional()
  ).query(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new import_server9.TRPCError({ code: "UNAUTHORIZED" });
    }
    return [];
  })
});

// server/routers/items.ts
var import_zod9 = require("zod");
init_db();
init_schema();
var import_drizzle_orm2 = require("drizzle-orm");
var import_nanoid = require("nanoid");
var ItemSchema = import_zod9.z.object({
  id: import_zod9.z.number(),
  name: import_zod9.z.string(),
  slug: import_zod9.z.string().nullable(),
  description: import_zod9.z.string().nullable(),
  category: import_zod9.z.string().nullable(),
  parentId: import_zod9.z.number().nullable(),
  basePrice: import_zod9.z.string(),
  isPopular: import_zod9.z.boolean().nullable(),
  displayOrder: import_zod9.z.number().nullable(),
  sortOrder: import_zod9.z.number().nullable(),
  imageUrl: import_zod9.z.string().nullable(),
  createdAt: import_zod9.z.date(),
  updatedAt: import_zod9.z.date()
});
var ItemsListOutputSchema = import_zod9.z.object({
  items: import_zod9.z.array(ItemSchema)
});
var itemsRouter = router({
  // Get items catalog with optional filtering
  list: publicProcedure.input(
    import_zod9.z.object({
      parentId: import_zod9.z.union([import_zod9.z.string(), import_zod9.z.number()]).nullable().optional(),
      popular: import_zod9.z.boolean().optional(),
      category: import_zod9.z.string().optional()
    }).optional()
  ).output(ItemsListOutputSchema).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { items: [] };
    let conditions = [];
    if (input?.parentId !== void 0) {
      conditions.push(
        input.parentId === null ? (0, import_drizzle_orm2.isNull)(items.parentId) : (0, import_drizzle_orm2.eq)(items.parentId, typeof input.parentId === "string" ? parseInt(input.parentId) : input.parentId)
      );
    }
    if (input?.popular) {
      conditions.push((0, import_drizzle_orm2.eq)(items.isPopular, true));
    }
    if (input?.category) {
      conditions.push((0, import_drizzle_orm2.eq)(items.category, input.category));
    }
    const result = await db.select().from(items).where(conditions.length > 0 ? (0, import_drizzle_orm2.and)(...conditions) : void 0).orderBy(items.displayOrder);
    return { items: result };
  }),
  // Calculate price for selected items
  calculatePrice: publicProcedure.input(
    import_zod9.z.object({
      items: import_zod9.z.array(
        import_zod9.z.object({
          id: import_zod9.z.string(),
          quantity: import_zod9.z.number().min(1)
        })
      )
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const itemIds = input.items.map((i) => i.id);
    const itemDetails = await db.select().from(items).where(
      (0, import_drizzle_orm2.or)(...itemIds.map((id) => (0, import_drizzle_orm2.eq)(items.id, parseInt(id))))
    );
    let subtotal = 0;
    const breakdown = input.items.map((selectedItem) => {
      const item = itemDetails.find((i) => String(i.id) === selectedItem.id);
      if (!item) {
        throw new Error(`Item ${selectedItem.id} not found`);
      }
      const itemTotal = parseFloat(item.basePrice) * selectedItem.quantity;
      subtotal += itemTotal;
      return {
        id: item.id,
        name: item.name,
        quantity: selectedItem.quantity,
        pricePerUnit: parseFloat(item.basePrice),
        total: itemTotal
      };
    });
    const taxRate = 0.08;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    return {
      subtotal,
      tax,
      taxRate,
      total,
      breakdown
    };
  }),
  // Apply promo code
  applyPromoCode: publicProcedure.input(
    import_zod9.z.object({
      code: import_zod9.z.string(),
      subtotal: import_zod9.z.number()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [promoCode] = await db.select().from(promoCodes).where((0, import_drizzle_orm2.eq)(promoCodes.code, input.code.toUpperCase())).limit(1);
    if (!promoCode) {
      throw new Error("Invalid promo code");
    }
    if (!promoCode.isActive) {
      throw new Error("Promo code is no longer active");
    }
    const now = /* @__PURE__ */ new Date();
    if (promoCode.validFrom && new Date(promoCode.validFrom) > now) {
      throw new Error("Promo code is not yet valid");
    }
    if (promoCode.validUntil && new Date(promoCode.validUntil) < now) {
      throw new Error("Promo code has expired");
    }
    if (promoCode.maxUses && promoCode.currentUses !== null && promoCode.currentUses >= promoCode.maxUses) {
      throw new Error("Promo code has reached maximum uses");
    }
    if (promoCode.minOrderAmount && input.subtotal < parseFloat(promoCode.minOrderAmount)) {
      throw new Error(`Minimum order amount is $${promoCode.minOrderAmount}`);
    }
    let discountAmount = 0;
    if (promoCode.discountType === "percentage") {
      discountAmount = input.subtotal * (parseFloat(promoCode.discountValue) / 100);
    } else {
      discountAmount = parseFloat(promoCode.discountValue);
    }
    if (promoCode.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, parseFloat(promoCode.maxDiscountAmount));
    }
    return {
      valid: true,
      code: promoCode.code,
      discountAmount,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      description: promoCode.description
    };
  }),
  // Save quote
  saveQuote: publicProcedure.input(
    import_zod9.z.object({
      customerInfo: import_zod9.z.object({
        name: import_zod9.z.string(),
        email: import_zod9.z.string().email(),
        phone: import_zod9.z.string()
      }),
      serviceAddress: import_zod9.z.object({
        street: import_zod9.z.string(),
        city: import_zod9.z.string(),
        state: import_zod9.z.string(),
        zip: import_zod9.z.string()
      }),
      items: import_zod9.z.array(
        import_zod9.z.object({
          id: import_zod9.z.string(),
          name: import_zod9.z.string(),
          quantity: import_zod9.z.number(),
          pricePerUnit: import_zod9.z.number()
        })
      ),
      pricing: import_zod9.z.object({
        subtotal: import_zod9.z.number(),
        tax: import_zod9.z.number(),
        discount: import_zod9.z.number().optional(),
        total: import_zod9.z.number()
      }),
      promoCode: import_zod9.z.string().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const quoteId = `HK-${(/* @__PURE__ */ new Date()).getFullYear()}-${(0, import_nanoid.nanoid)(8).toUpperCase()}`;
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await db.insert(savedQuotes).values({
      id: (0, import_nanoid.nanoid)(),
      quoteId,
      customerName: input.customerInfo.name,
      customerEmail: input.customerInfo.email,
      customerPhone: input.customerInfo.phone,
      serviceStreet: input.serviceAddress.street,
      serviceCity: input.serviceAddress.city,
      serviceState: input.serviceAddress.state,
      serviceZip: input.serviceAddress.zip,
      items: JSON.stringify(input.items),
      subtotal: input.pricing.subtotal.toString(),
      tax: input.pricing.tax.toString(),
      discount: input.pricing.discount?.toString() || "0",
      total: input.pricing.total.toString(),
      promoCode: input.promoCode || null,
      expiresAt,
      createdAt: /* @__PURE__ */ new Date()
    });
    return {
      success: true,
      quoteId,
      expiresAt
    };
  }),
  // Get saved quote
  getQuote: publicProcedure.input(
    import_zod9.z.object({
      quoteId: import_zod9.z.string()
    })
  ).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [quote] = await db.select().from(savedQuotes).where((0, import_drizzle_orm2.eq)(savedQuotes.quoteId, input.quoteId)).limit(1);
    if (!quote) {
      throw new Error("Quote not found");
    }
    if (new Date(quote.expiresAt) < /* @__PURE__ */ new Date()) {
      throw new Error("Quote has expired");
    }
    return {
      ...quote,
      items: JSON.parse(quote.items)
    };
  })
});

// server/routers/customerAuth.ts
var import_zod10 = require("zod");
init_db();
init_schema();
init_db();
var import_drizzle_orm3 = require("drizzle-orm");
var bcrypt = __toESM(require("bcryptjs"), 1);
var jwt = __toESM(require("jsonwebtoken"), 1);
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
var customerAuthRouter = router({
  signup: publicProcedure.input(
    import_zod10.z.object({
      name: import_zod10.z.string(),
      email: import_zod10.z.string().email(),
      password: import_zod10.z.string().min(6),
      phone: import_zod10.z.string().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    const existingUser = await db.select().from(users).where((0, import_drizzle_orm3.eq)(users.email, input.email)).limit(1).then((rows) => rows[0]);
    if (existingUser) {
      throw new Error("Email already registered");
    }
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const result = await db.insert(users).values({
      email: input.email,
      name: input.name,
      phone: input.phone || null,
      openId: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      loginMethod: "email",
      role: "user",
      lastSignedIn: /* @__PURE__ */ new Date(),
      // @ts-ignore - password field exists but not in type
      password: hashedPassword
    });
    const userId = Number(result[0].insertId);
    await createCustomer({ userId });
    const customer = await getCustomerByUserId(userId);
    if (!customer) {
      throw new Error("Failed to create customer profile");
    }
    const token = jwt.sign(
      { userId, customerId: customer.id, email: input.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );
    return {
      token,
      customer: {
        id: customer.id,
        name: input.name,
        email: input.email,
        phone: input.phone || ""
      }
    };
  }),
  login: publicProcedure.input(
    import_zod10.z.object({
      email: import_zod10.z.string().email(),
      password: import_zod10.z.string()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }
    const user = await db.select().from(users).where((0, import_drizzle_orm3.eq)(users.email, input.email)).limit(1).then((rows) => rows[0]);
    if (!user) {
      throw new Error("Invalid email or password");
    }
    const isValidPassword = await bcrypt.compare(input.password, user.password || "");
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }
    const customer = await getCustomerByUserId(user.id);
    if (!customer) {
      throw new Error("Customer profile not found");
    }
    const token = jwt.sign(
      { userId: user.id, customerId: customer.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "30d" }
    );
    return {
      token,
      customer: {
        id: customer.id,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || ""
      }
    };
  })
});

// server/routers.ts
var appRouter = router({
  // Core system routes
  system: systemRouter,
  // Auth routes
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  // Feature routers
  serviceAreas: serviceAreasRouter,
  pricing: pricingRouter,
  jobs: jobsRouter,
  media: mediaRouter,
  drivers: driversRouter,
  dispatch: dispatchRouter,
  ledger: ledgerRouter,
  items: itemsRouter,
  customerAuth: customerAuthRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/health.ts
var import_express = require("express");
var healthRouter = (0, import_express.Router)();
healthRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString(), socketio: "enabled" });
});
healthRouter.get("/health/db", async (_req, res) => {
  const dbUrl = process.env.DATABASE_URL || "";
  const masked = dbUrl ? dbUrl.replace(/\/\/[^@]+@/, "//***:***@").substring(0, 80) : "NOT SET";
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ status: "timeout", DATABASE_URL_MASKED: masked });
    }
  }, 8e3);
  try {
    const { default: pg } = await import("pg");
    const pool = new pg.Pool({ connectionString: dbUrl, max: 2, connectionTimeoutMillis: 5e3 });
    const tablesResult = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
    const tables = tablesResult.rows.map((r) => r.table_name);
    const getColumns = async (tableName) => {
      const result = await pool.query(
        `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
        [tableName]
      );
      return result.rows.map((r) => `${r.column_name} (${r.data_type}, nullable=${r.is_nullable})`);
    };
    const usersColumns = await getColumns("users");
    const driversColumns = await getColumns("drivers");
    const customersColumns = await getColumns("customers");
    const ordersColumns = await getColumns("orders");
    await pool.end();
    clearTimeout(timeout);
    if (!res.headersSent) {
      res.json({
        status: "ok",
        DATABASE_URL_MASKED: masked,
        tables,
        usersColumns,
        driversColumns,
        customersColumns,
        ordersColumns
      });
    }
  } catch (error) {
    clearTimeout(timeout);
    if (!res.headersSent) {
      res.status(500).json({ status: "error", message: error?.message || String(error), DATABASE_URL_MASKED: masked });
    }
  }
});

// server/_core/driverAuth.ts
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var pgPool = null;
async function getPgPool() {
  if (pgPool) return pgPool;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  try {
    const { default: pg } = await import("pg");
    pgPool = new pg.Pool({
      connectionString: dbUrl,
      max: 5,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 1e4
    });
    const client = await pgPool.connect();
    client.release();
    console.log("[DriverAuth] PostgreSQL connection established");
    return pgPool;
  } catch (e) {
    console.error("[DriverAuth] Failed to connect to PostgreSQL:", e);
    pgPool = null;
    return null;
  }
}
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    return import_jsonwebtoken.default.verify(authHeader.split(" ")[1], process.env.JWT_SECRET || "secret");
  } catch (e) {
    return null;
  }
}
function registerDriverAuthRoutes(app) {
  (async () => {
    try {
      const pool = await getPgPool();
      if (pool) {
        await pool.query(`
          ALTER TABLE drivers 
          ADD COLUMN IF NOT EXISTS first_name TEXT,
          ADD COLUMN IF NOT EXISTS last_name TEXT,
          ADD COLUMN IF NOT EXISTS address TEXT,
          ADD COLUMN IF NOT EXISTS city TEXT,
          ADD COLUMN IF NOT EXISTS state TEXT,
          ADD COLUMN IF NOT EXISTS zip_code TEXT,
          ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
          ADD COLUMN IF NOT EXISTS vehicle_capacity TEXT,
          ADD COLUMN IF NOT EXISTS lifting_limit TEXT,
          ADD COLUMN IF NOT EXISTS license_plate TEXT,
          ADD COLUMN IF NOT EXISTS services TEXT,
          ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false
        `);
        console.log("[DriverAuth] Driver columns ensured");
        await pool.query(`
          CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            customer_id TEXT,
            customer_name TEXT,
            customer_phone TEXT,
            customer_email TEXT,
            service_type TEXT DEFAULT 'HAUL_AWAY',
            status TEXT DEFAULT 'pending',
            pickup_address TEXT,
            pickup_lat DECIMAL(10,7),
            pickup_lng DECIMAL(10,7),
            dropoff_address TEXT,
            description TEXT,
            items_json TEXT,
            estimated_price DECIMAL(10,2),
            final_price DECIMAL(10,2),
            assigned_driver_id TEXT,
            scheduled_for TIMESTAMP,
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log("[DriverAuth] Jobs table ensured");
        await pool.query(`
          CREATE TABLE IF NOT EXISTS job_assignments (
            id SERIAL PRIMARY KEY,
            job_id TEXT REFERENCES jobs(id),
            driver_id TEXT,
            status TEXT DEFAULT 'assigned',
            assigned_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log("[DriverAuth] Job assignments table ensured");
        await pool.query(`
          CREATE OR REPLACE VIEW orders AS
          SELECT 
            id, service_type, customer_name, customer_phone as phone,
            customer_email as email, pickup_address as street,
            '' as city, '' as state, '' as zip,
            pickup_lat as lat, pickup_lng as lng,
            scheduled_for as pickup_date, '' as pickup_time_window,
            items_json, estimated_price as pricing_json,
            status, assigned_driver_id,
            created_at, updated_at
          FROM jobs
        `);
        console.log("[DriverAuth] Orders view ensured");
      }
    } catch (e) {
      console.log("[DriverAuth] DB setup note:", e?.message);
    }
  })();
  app.get("/api/db/tables", async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      const result = await pool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' ORDER BY table_name
      `);
      res.json({ tables: result.rows.map((r) => r.table_name) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/orders/create", async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      const {
        customerName,
        customerPhone,
        customerEmail,
        serviceType,
        pickupAddress,
        dropoffAddress,
        description,
        estimatedPrice,
        items: items2,
        scheduledFor
      } = req.body;
      if (!customerName || !pickupAddress) {
        return res.status(400).json({ error: "customerName and pickupAddress are required" });
      }
      const result = await pool.query(
        `INSERT INTO jobs (
          customer_name, customer_phone, customer_email,
          service_type, status, pickup_address, dropoff_address,
          description, estimated_price, items_json, scheduled_for,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *`,
        [
          customerName,
          customerPhone || "",
          customerEmail || "",
          serviceType || "HAUL_AWAY",
          pickupAddress,
          dropoffAddress || "",
          description || "",
          estimatedPrice || 0,
          items2 ? JSON.stringify(items2) : "[]",
          scheduledFor || null
        ]
      );
      const job = result.rows[0];
      console.log(`[Orders] New job created: ${job.id} - ${customerName}`);
      res.json({ success: true, order: job });
    } catch (err) {
      console.error("Create order error:", err);
      res.status(500).json({ error: "Failed to create order", details: err.message });
    }
  });
  app.get("/api/orders", async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      const { status, limit = 50 } = req.query;
      let query = "SELECT * FROM jobs WHERE 1=1";
      const params = [];
      let idx = 1;
      if (status) {
        query += ` AND status = $${idx++}`;
        params.push(status);
      }
      query += ` ORDER BY created_at DESC LIMIT $${idx++}`;
      params.push(limit);
      const result = await pool.query(query, params);
      res.json({ orders: result.rows, total: result.rows.length });
    } catch (err) {
      console.error("List orders error:", err);
      res.status(500).json({ error: "Failed to list orders" });
    }
  });
  app.put("/api/orders/:id/assign", async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      const { driver_id } = req.body;
      if (!driver_id) return res.status(400).json({ error: "driver_id required" });
      await pool.query(
        `UPDATE jobs SET assigned_driver_id = $1, status = 'assigned', updated_at = NOW() WHERE id = $2`,
        [driver_id, req.params.id]
      );
      await pool.query(
        `INSERT INTO job_assignments (job_id, driver_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [req.params.id, driver_id]
      );
      const result = await pool.query("SELECT * FROM jobs WHERE id = $1", [req.params.id]);
      res.json({ success: true, order: result.rows[0] });
    } catch (err) {
      console.error("Assign order error:", err);
      res.status(500).json({ error: "Failed to assign order" });
    }
  });
  app.post("/driver/auth/signup", async (req, res) => {
    try {
      const {
        email,
        password,
        name,
        phone,
        firstName,
        lastName,
        address,
        city,
        state,
        zipCode
      } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }
      const existingResult = await pool.query(
        "SELECT id FROM users WHERE email = $1 LIMIT 1",
        [email]
      );
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }
      const existingDriver = await pool.query(
        "SELECT id FROM drivers WHERE email = $1 LIMIT 1",
        [email]
      );
      if (existingDriver.rows.length > 0) {
        return res.status(400).json({ error: "Email already registered as driver" });
      }
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : name || "";
      const hashedPassword = await import_bcryptjs.default.hash(password, 10);
      const insertResult = await pool.query(
        `INSERT INTO users (email, name, phone, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [email, fullName, phone || null, hashedPassword]
      );
      const userId = insertResult.rows[0]?.id;
      const driverResult = await pool.query(
        `INSERT INTO drivers (
          name, phone, email, status, 
          first_name, last_name, address, city, state, zip_code,
          created_at, updated_at
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING id`,
        [
          fullName,
          phone || "",
          email,
          "pending",
          firstName || "",
          lastName || "",
          address || "",
          city || "",
          state || "",
          zipCode || ""
        ]
      );
      const driverId = driverResult.rows[0]?.id;
      const token = import_jsonwebtoken.default.sign(
        { userId, email, role: "driver", driverId },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
      );
      res.json({
        success: true,
        token,
        driver: {
          id: driverId,
          userId,
          email,
          name: fullName,
          status: "pending"
        }
      });
    } catch (error) {
      console.error("Driver signup error:", error);
      res.status(500).json({ error: "Failed to create account", details: error?.message || String(error) });
    }
  });
  app.post("/driver/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }
      const result = await pool.query(
        "SELECT id, email, password_hash, name FROM users WHERE email = $1 LIMIT 1",
        [email]
      );
      const user = result.rows[0];
      if (!user || !user.password_hash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const isValid = await import_bcryptjs.default.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const driverResult = await pool.query(
        "SELECT id, status, first_name, last_name, vehicle_type FROM drivers WHERE email = $1 LIMIT 1",
        [email]
      );
      const driver = driverResult.rows[0];
      if (!driver) {
        return res.status(404).json({ error: "Driver profile not found" });
      }
      const token = import_jsonwebtoken.default.sign(
        { userId: user.id, email: user.email, role: "driver", driverId: driver.id },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
      );
      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name },
        driver: {
          id: driver.id,
          status: driver.status,
          firstName: driver.first_name,
          lastName: driver.last_name,
          vehicleType: driver.vehicle_type
        }
      });
    } catch (err) {
      console.error("Driver login error:", err);
      res.status(500).json({ error: "Internal server error", details: err?.message || String(err) });
    }
  });
  app.post("/driver/onboarding", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }
      const { vehicleType, vehicleCapacity, liftingLimit, licensePlate, services } = req.body;
      await pool.query(
        `UPDATE drivers SET 
          vehicle_type = COALESCE($1, vehicle_type),
          vehicle_capacity = COALESCE($2, vehicle_capacity),
          lifting_limit = COALESCE($3, lifting_limit),
          license_plate = COALESCE($4, license_plate),
          services = COALESCE($5, services),
          updated_at = NOW()
        WHERE id = $6`,
        [
          vehicleType || null,
          vehicleCapacity || null,
          liftingLimit || null,
          licensePlate || null,
          services || null,
          decoded.driverId
        ]
      );
      res.json({ success: true, message: "Onboarding data saved" });
    } catch (err) {
      console.error("Driver onboarding error:", err);
      res.status(500).json({ error: "Failed to save onboarding data", details: err?.message });
    }
  });
  app.post("/driver/online", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }
      const { online } = req.body;
      await pool.query(
        "UPDATE drivers SET is_online = $1, updated_at = NOW() WHERE id = $2",
        [!!online, decoded.driverId]
      );
      res.json({ success: true, online: !!online });
    } catch (err) {
      console.error("Driver online toggle error:", err);
      res.status(500).json({ error: "Failed to update status" });
    }
  });
  app.get("/driver/orders/available", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }
      const result = await pool.query(
        `SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at DESC LIMIT 20`
      );
      res.json({ orders: result.rows || [] });
    } catch (err) {
      console.error("Get available orders error:", err);
      res.json({ orders: [] });
    }
  });
  app.get("/driver/profile", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }
      const result = await pool.query(
        "SELECT * FROM drivers WHERE id = $1 LIMIT 1",
        [decoded.driverId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Driver not found" });
      }
      const driver = result.rows[0];
      res.json({
        driver: {
          id: driver.id,
          name: driver.name,
          firstName: driver.first_name,
          lastName: driver.last_name,
          email: driver.email,
          phone: driver.phone,
          address: driver.address,
          city: driver.city,
          state: driver.state,
          zipCode: driver.zip_code,
          status: driver.status,
          vehicleType: driver.vehicle_type,
          vehicleCapacity: driver.vehicle_capacity,
          isOnline: driver.is_online,
          createdAt: driver.created_at
        }
      });
    } catch (err) {
      console.error("Get driver profile error:", err);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });
  app.put("/driver/profile", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }
      const { firstName, lastName, phone, address, city, state, zipCode } = req.body;
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : void 0;
      await pool.query(
        `UPDATE drivers SET 
          name = COALESCE($1, name),
          first_name = COALESCE($2, first_name),
          last_name = COALESCE($3, last_name),
          phone = COALESCE($4, phone),
          address = COALESCE($5, address),
          city = COALESCE($6, city),
          state = COALESCE($7, state),
          zip_code = COALESCE($8, zip_code),
          updated_at = NOW()
        WHERE id = $9`,
        [fullName, firstName, lastName, phone, address, city, state, zipCode, decoded.driverId]
      );
      res.json({ success: true, message: "Profile updated" });
    } catch (err) {
      console.error("Update driver profile error:", err);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  app.get("/driver/orders/history", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }
      try {
        const result = await pool.query(
          `SELECT j.* FROM jobs j 
           JOIN job_assignments ja ON j.id = ja.job_id 
           WHERE ja.driver_id = $1 
           ORDER BY j.created_at DESC LIMIT 50`,
          [decoded.driverId]
        );
        res.json({ orders: result.rows || [] });
      } catch (e) {
        res.json({ orders: [] });
      }
    } catch (err) {
      console.error("Get order history error:", err);
      res.json({ orders: [] });
    }
  });
  app.get("/driver/earnings", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      res.json({
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        total: 0,
        completedJobs: 0,
        pendingPayout: 0
      });
    } catch (err) {
      console.error("Get earnings error:", err);
      res.json({ today: 0, thisWeek: 0, thisMonth: 0, total: 0 });
    }
  });
  app.post("/driver/orders/:id/accept", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }
      const orderId = req.params.id;
      await pool.query(
        "UPDATE jobs SET status = 'assigned', assigned_driver_id = $1, updated_at = NOW() WHERE id = $2",
        [decoded.driverId, orderId]
      );
      try {
        await pool.query(
          `INSERT INTO job_assignments (job_id, driver_id) VALUES ($1, $2)`,
          [orderId, decoded.driverId]
        );
      } catch (e) {
      }
      res.json({ success: true, message: "Order accepted" });
    } catch (err) {
      console.error("Accept order error:", err);
      res.status(500).json({ error: "Failed to accept order" });
    }
  });
  app.post("/driver/orders/:id/reject", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      res.json({ success: true, message: "Order rejected" });
    } catch (err) {
      console.error("Reject order error:", err);
      res.status(500).json({ error: "Failed to reject order" });
    }
  });
  app.post("/driver/orders/:id/complete", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }
      const orderId = req.params.id;
      await pool.query(
        "UPDATE jobs SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = $1",
        [orderId]
      );
      res.json({ success: true, message: "Order completed" });
    } catch (err) {
      console.error("Complete order error:", err);
      res.status(500).json({ error: "Failed to complete order" });
    }
  });
  app.post("/driver/orders/:id/start-trip", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      await pool.query(
        "UPDATE jobs SET status = 'en_route', updated_at = NOW() WHERE id = $1 AND assigned_driver_id = $2",
        [req.params.id, decoded.driverId]
      );
      res.json({ success: true, message: "Trip started - en route to pickup" });
    } catch (err) {
      console.error("Start trip error:", err);
      res.status(500).json({ error: "Failed to start trip" });
    }
  });
  app.post("/driver/orders/:id/arrived", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      await pool.query(
        "UPDATE jobs SET status = 'arrived', updated_at = NOW() WHERE id = $1 AND assigned_driver_id = $2",
        [req.params.id, decoded.driverId]
      );
      res.json({ success: true, message: "Arrived at pickup location" });
    } catch (err) {
      console.error("Arrived error:", err);
      res.status(500).json({ error: "Failed to update arrival" });
    }
  });
  app.post("/driver/orders/:id/start-work", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      await pool.query(
        "UPDATE jobs SET status = 'in_progress', updated_at = NOW() WHERE id = $1 AND assigned_driver_id = $2",
        [req.params.id, decoded.driverId]
      );
      res.json({ success: true, message: "Work started" });
    } catch (err) {
      console.error("Start work error:", err);
      res.status(500).json({ error: "Failed to start work" });
    }
  });
  app.post("/driver/orders/:id/upload-photo", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      const { photo_base64 } = req.body;
      await pool.query(
        "UPDATE jobs SET status = 'photo_taken', updated_at = NOW() WHERE id = $1 AND assigned_driver_id = $2",
        [req.params.id, decoded.driverId]
      );
      res.json({ success: true, message: "Photo uploaded" });
    } catch (err) {
      console.error("Upload photo error:", err);
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });
  app.post("/driver/orders/:id/signature", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      const { signature_base64 } = req.body;
      await pool.query(
        "UPDATE jobs SET status = 'signed', updated_at = NOW() WHERE id = $1 AND assigned_driver_id = $2",
        [req.params.id, decoded.driverId]
      );
      res.json({ success: true, message: "Signature captured" });
    } catch (err) {
      console.error("Signature error:", err);
      res.status(500).json({ error: "Failed to capture signature" });
    }
  });
  app.get("/driver/orders/:id", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      const result = await pool.query("SELECT * FROM jobs WHERE id = $1", [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: "Order not found" });
      res.json({ order: result.rows[0] });
    } catch (err) {
      console.error("Get order error:", err);
      res.status(500).json({ error: "Failed to get order" });
    }
  });
  app.post("/api/setup/admin", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "No DB" });
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT,
          role TEXT DEFAULT 'admin',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
      const hash2 = await import_bcryptjs.default.hash(password, 10);
      if (existing.rows.length > 0) {
        await pool.query("UPDATE users SET password_hash = $1, name = $2 WHERE email = $3", [hash2, name || "Admin", email]);
        return res.json({ success: true, message: "Admin user updated" });
      }
      await pool.query(
        "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)",
        [email, hash2, name || "Admin", "admin"]
      );
      res.json({ success: true, message: "Admin user created" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/driver/orders/:id/cancel", async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      const orderId = req.params.id;
      await pool.query(
        "UPDATE jobs SET status = 'pending', assigned_driver_id = NULL, updated_at = NOW() WHERE id = $1",
        [orderId]
      );
      res.json({ success: true, message: "Order cancelled and returned to available orders" });
    } catch (err) {
      console.error("Cancel order error:", err);
      res.status(500).json({ error: "Failed to cancel order" });
    }
  });
}

// server/_core/adminAuth.ts
var import_bcryptjs2 = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var pgPool2 = null;
async function getPgPool2() {
  if (pgPool2) return pgPool2;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  try {
    const { default: pg } = await import("pg");
    pgPool2 = new pg.Pool({
      connectionString: dbUrl,
      max: 5,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 1e4
    });
    const client = await pgPool2.connect();
    client.release();
    console.log("[AdminAuth] PostgreSQL connection established");
    return pgPool2;
  } catch (e) {
    console.error("[AdminAuth] Failed to connect to PostgreSQL:", e);
    pgPool2 = null;
    return null;
  }
}
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.substring(7);
  try {
    const decoded = import_jsonwebtoken2.default.verify(token, process.env.JWT_SECRET || "secret");
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
function registerAdminAuthRoutes(app) {
  app.post("/admin/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const pool = await getPgPool2();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }
      const result = await pool.query(
        "SELECT id, email, password_hash, name FROM users WHERE email = $1 LIMIT 1",
        [email]
      );
      const user = result.rows[0];
      if (!user || !user.password_hash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const adminEmails = [
        "support@haulkind.com"
      ];
      if (!adminEmails.includes(email.toLowerCase())) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const isValid = await import_bcryptjs2.default.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const token = import_jsonwebtoken2.default.sign(
        { userId: user.id, email: user.email, role: "admin" },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "24h" }
      );
      res.json({
        token,
        admin: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (err) {
      console.error("Admin login error:", err);
      res.status(500).json({ error: "Internal server error", details: err?.message || String(err) });
    }
  });
  app.get("/admin/auth/me", requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool2();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }
      const result = await pool.query(
        "SELECT id, email, name FROM users WHERE id = $1 LIMIT 1",
        [req.user.userId]
      );
      const user = result.rows[0];
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        admin: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (err) {
      console.error("Get admin user error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}

// server/_core/adminApi.ts
var pgPool3 = null;
async function getPgPool3() {
  if (pgPool3) return pgPool3;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  try {
    const { default: pg } = await import("pg");
    pgPool3 = new pg.Pool({
      connectionString: dbUrl,
      max: 10,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 1e4
    });
    return pgPool3;
  } catch (e) {
    console.error("[AdminAPI] Failed to connect to PostgreSQL:", e);
    return null;
  }
}
function registerAdminApiRoutes(app) {
  app.get("/admin/stats/overview", requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool3();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      const driversResult = await pool.query(`
        SELECT status, COUNT(*) as count 
        FROM drivers 
        GROUP BY status
      `);
      const driverStats = driversResult.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {});
      const customersResult = await pool.query("SELECT COUNT(*) as count FROM customers");
      const totalCustomers = parseInt(customersResult.rows[0]?.count || 0);
      const ordersResult = await pool.query(`
        SELECT status, COUNT(*) as count FROM (
          SELECT status FROM orders
          UNION ALL
          SELECT status FROM jobs
        ) combined
        GROUP BY status
      `);
      const orderStats = ordersResult.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {});
      const today = await pool.query(`SELECT COUNT(*) as count FROM (
        SELECT created_at FROM orders WHERE created_at >= NOW() - INTERVAL '1 day'
        UNION ALL
        SELECT created_at FROM jobs WHERE created_at >= NOW() - INTERVAL '1 day'
      ) combined`);
      const thisWeek = await pool.query(`SELECT COUNT(*) as count FROM (
        SELECT created_at FROM orders WHERE created_at >= NOW() - INTERVAL '7 days'
        UNION ALL
        SELECT created_at FROM jobs WHERE created_at >= NOW() - INTERVAL '7 days'
      ) combined`);
      const thisMonth = await pool.query(`SELECT COUNT(*) as count FROM (
        SELECT created_at FROM orders WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT created_at FROM jobs WHERE created_at >= NOW() - INTERVAL '30 days'
      ) combined`);
      res.json({
        drivers: {
          total: Object.values(driverStats).reduce((sum, val) => sum + val, 0),
          pending: driverStats.pending || 0,
          approved: driverStats.approved || 0,
          blocked: driverStats.blocked || 0
        },
        customers: {
          total: totalCustomers
        },
        orders: {
          total: Object.values(orderStats).reduce((sum, val) => sum + val, 0),
          today: parseInt(today.rows[0]?.count || 0),
          thisWeek: parseInt(thisWeek.rows[0]?.count || 0),
          thisMonth: parseInt(thisMonth.rows[0]?.count || 0),
          byStatus: orderStats
        }
      });
    } catch (err) {
      console.error("Get stats error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/admin/drivers", requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool3();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      const { status, search, limit = 50, offset = 0 } = req.query;
      let query = "SELECT * FROM drivers WHERE 1=1";
      const params = [];
      let paramIndex = 1;
      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }
      if (search) {
        query += ` AND (name ILIKE $${paramIndex++} OR email ILIKE $${paramIndex++} OR phone ILIKE $${paramIndex++})`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);
      const result = await pool.query(query, params);
      let countQuery = "SELECT COUNT(*) as count FROM drivers WHERE 1=1";
      const countParams = [];
      let countParamIndex = 1;
      if (status) {
        countQuery += ` AND status = $${countParamIndex++}`;
        countParams.push(status);
      }
      if (search) {
        countQuery += ` AND (name ILIKE $${countParamIndex++} OR email ILIKE $${countParamIndex++} OR phone ILIKE $${countParamIndex++})`;
        const searchPattern = `%${search}%`;
        countParams.push(searchPattern, searchPattern, searchPattern);
      }
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0]?.count || 0);
      res.json({ drivers: result.rows, total, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (err) {
      console.error("Get drivers error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/admin/drivers/:id", requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool3();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      const result = await pool.query("SELECT * FROM drivers WHERE id = $1", [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.json({ driver: result.rows[0] });
    } catch (err) {
      console.error("Get driver error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.put("/admin/drivers/:id/status", requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool3();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      const { status } = req.body;
      if (!["pending", "approved", "blocked"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const result = await pool.query(
        "UPDATE drivers SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
        [status, req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.json({ driver: result.rows[0] });
    } catch (err) {
      console.error("Update driver status error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/admin/customers", requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool3();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      const { search, limit = 50, offset = 0 } = req.query;
      let query = `
        SELECT c.id, c.user_id, u.name, u.email, u.phone,
               COUNT(o.id) as total_orders
        FROM customers c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN orders o ON o.email = u.email
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;
      if (search) {
        query += ` AND (u.name ILIKE $${paramIndex++} OR u.email ILIKE $${paramIndex++})`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
      }
      query += ` GROUP BY c.id, c.user_id, u.name, u.email, u.phone ORDER BY c.id DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);
      const result = await pool.query(query, params);
      const countResult = await pool.query("SELECT COUNT(*) as count FROM customers");
      const total = parseInt(countResult.rows[0]?.count || 0);
      res.json({ customers: result.rows, total, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (err) {
      console.error("Get customers error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/admin/customers/:id", requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool3();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      const result = await pool.query(`
        SELECT c.id, c.user_id, u.name, u.email, u.phone
        FROM customers c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = $1
      `, [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json({ customer: result.rows[0] });
    } catch (err) {
      console.error("Get customer error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/admin/orders", requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool3();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      const { status, service_type, search, limit = 50, offset = 0 } = req.query;
      let baseQuery = `
        SELECT id::text, service_type, customer_name, phone, email,
               street, city, state, zip, lat::double precision, lng::double precision,
               pickup_date::text, pickup_time_window::text,
               items_json::text, pricing_json::text, status,
               assigned_driver_id::text, created_at, updated_at
        FROM orders
        UNION ALL
        SELECT id::text, service_type, customer_name, customer_phone as phone, customer_email as email,
               pickup_address as street, '' as city, '' as state, '' as zip,
               pickup_lat::double precision as lat, pickup_lng::double precision as lng,
               scheduled_for::text as pickup_date, '' as pickup_time_window,
               COALESCE(items_json::text, '[]') as items_json, json_build_object('total', COALESCE(estimated_price, '0'))::text as pricing_json,
               status, assigned_driver_id::text, created_at, updated_at
        FROM jobs
      `;
      let query = `SELECT * FROM (${baseQuery}) combined WHERE 1=1`;
      const params = [];
      let paramIndex = 1;
      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }
      if (service_type) {
        query += ` AND service_type = $${paramIndex++}`;
        params.push(service_type);
      }
      if (search) {
        query += ` AND (customer_name ILIKE $${paramIndex++} OR email ILIKE $${paramIndex++} OR phone ILIKE $${paramIndex++})`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);
      const result = await pool.query(query, params);
      let countQuery = `SELECT COUNT(*) as count FROM (${baseQuery}) combined WHERE 1=1`;
      const countParams = [];
      let countParamIndex = 1;
      if (status) {
        countQuery += ` AND status = $${countParamIndex++}`;
        countParams.push(status);
      }
      if (service_type) {
        countQuery += ` AND service_type = $${countParamIndex++}`;
        countParams.push(service_type);
      }
      if (search) {
        countQuery += ` AND (customer_name ILIKE $${countParamIndex++} OR email ILIKE $${countParamIndex++} OR phone ILIKE $${countParamIndex++})`;
        const searchPattern = `%${search}%`;
        countParams.push(searchPattern, searchPattern, searchPattern);
      }
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0]?.count || 0);
      res.json({ orders: result.rows, total, limit: parseInt(limit), offset: parseInt(offset) });
    } catch (err) {
      console.error("Get orders error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool3();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      let result = await pool.query("SELECT * FROM jobs WHERE id = $1", [req.params.id]);
      if (result.rows.length === 0) {
        result = await pool.query("SELECT * FROM orders WHERE id::text = $1", [req.params.id]);
      }
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json({ order: result.rows[0] });
    } catch (err) {
      console.error("Get order error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.put("/admin/orders/:id/assign", requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool3();
      if (!pool) return res.status(500).json({ error: "Database not available" });
      const { driver_id } = req.body;
      if (!driver_id) {
        return res.status(400).json({ error: "driver_id is required" });
      }
      const driverCheck = await pool.query("SELECT id FROM drivers WHERE id = $1", [driver_id]);
      if (driverCheck.rows.length === 0) {
        return res.status(404).json({ error: "Driver not found" });
      }
      const result = await pool.query(
        "UPDATE orders SET assigned_driver_id = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
        [driver_id, "assigned", req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json({ order: result.rows[0] });
    } catch (err) {
      console.error("Assign order error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}

// server/_core/socket.ts
var import_socket = require("socket.io");
var io = null;
var connectedUsers = /* @__PURE__ */ new Map();
var driverSockets = /* @__PURE__ */ new Map();
var customerSockets = /* @__PURE__ */ new Map();
var adminSockets = /* @__PURE__ */ new Set();
function initializeSocket(httpServer) {
  io = new import_socket.Server(httpServer, {
    cors: {
      origin: "*",
      // In production, specify allowed origins
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ["websocket", "polling"]
  });
  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);
    socket.on("authenticate", (data) => {
      const user = {
        userId: data.userId,
        role: data.role,
        driverId: data.driverId,
        customerId: data.customerId
      };
      connectedUsers.set(socket.id, user);
      if (user.role === "driver" && user.driverId) {
        driverSockets.set(user.driverId, socket.id);
        socket.join(`driver:${user.driverId}`);
        console.log(`[Socket.io] Driver ${user.driverId} authenticated`);
      } else if (user.role === "customer" && user.customerId) {
        customerSockets.set(user.customerId, socket.id);
        socket.join(`customer:${user.customerId}`);
        console.log(`[Socket.io] Customer ${user.customerId} authenticated`);
      } else if (user.role === "admin") {
        adminSockets.add(socket.id);
        socket.join("admins");
        console.log(`[Socket.io] Admin authenticated`);
      }
      socket.emit("authenticated", { success: true });
    });
    socket.on("driver:set_status", (data) => {
      const user = connectedUsers.get(socket.id);
      if (user?.role === "driver") {
        socket.join(data.isOnline ? "drivers:online" : "drivers:offline");
        socket.leave(data.isOnline ? "drivers:offline" : "drivers:online");
        io?.to("admins").emit("driver:status_changed", {
          driverId: data.driverId,
          isOnline: data.isOnline
        });
        console.log(`[Socket.io] Driver ${data.driverId} is now ${data.isOnline ? "online" : "offline"}`);
      }
    });
    socket.on("driver:location_update", (data) => {
      const user = connectedUsers.get(socket.id);
      if (user?.role === "driver") {
        io?.to("admins").emit("driver:location", data);
        console.log(`[Socket.io] Driver ${data.driverId} location updated: ${data.lat}, ${data.lng}`);
      }
    });
    socket.on("disconnect", () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        if (user.role === "driver" && user.driverId) {
          driverSockets.delete(user.driverId);
          console.log(`[Socket.io] Driver ${user.driverId} disconnected`);
        } else if (user.role === "customer" && user.customerId) {
          customerSockets.delete(user.customerId);
          console.log(`[Socket.io] Customer ${user.customerId} disconnected`);
        } else if (user.role === "admin") {
          adminSockets.delete(socket.id);
          console.log(`[Socket.io] Admin disconnected`);
        }
        connectedUsers.delete(socket.id);
      }
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
    socket.on("chat:send_message", (data) => {
      io?.to(`job:${data.jobId}`).emit("chat:new_message", {
        jobId: data.jobId,
        senderId: data.senderId,
        message: data.message,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      console.log(`[Socket.io] Chat message sent in job ${data.jobId}`);
    });
    socket.on("job:join", (data) => {
      socket.join(`job:${data.jobId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined job room: ${data.jobId}`);
    });
    socket.on("job:leave", (data) => {
      socket.leave(`job:${data.jobId}`);
      console.log(`[Socket.io] Socket ${socket.id} left job room: ${data.jobId}`);
    });
  });
  console.log("[Socket.io] Server initialized");
  return io;
}

// server/_core/realtime.ts
var import_express2 = require("express");
var realtimeRouter = (0, import_express2.Router)();
realtimeRouter.get("/api/realtime/health", (req, res) => {
  res.json({ ok: true, realtime: "active" });
});
realtimeRouter.get("/api/realtime/orders", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: "heartbeat", ts: Date.now() })}

`);
  }, 3e4);
  req.on("close", () => {
    clearInterval(heartbeat);
  });
});

// server/_core/migrate.ts
var import_express3 = require("express");
var migrateRouter = (0, import_express3.Router)();
migrateRouter.post("/migrate/events", async (req, res) => {
  try {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await req.db.query(`
      CREATE TABLE IF NOT EXISTS events (
        id BIGSERIAL PRIMARY KEY,
        channel TEXT NOT NULL,
        type TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await req.db.query(`
      CREATE INDEX IF NOT EXISTS idx_events_channel_id ON events(channel, id);
    `);
    await req.db.query(`
      CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
    `);
    res.json({ success: true, message: "Events table created successfully" });
  } catch (error) {
    console.error("[Migration] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// server/_core/index.ts
var import_bcryptjs3 = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken3 = __toESM(require("jsonwebtoken"), 1);
init_db();
var import_drizzle_orm4 = require("drizzle-orm");
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = import_net.default.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = (0, import_express5.default)();
  const server = (0, import_http.createServer)(app);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://exciting-bravery-production.up.railway.app",
      "https://admin.haulkind.com",
      "https://haulkind.com",
      "https://www.haulkind.com",
      "https://haulkind-admin.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001"
    ];
    if (origin && (allowedOrigins.includes(origin) || /\.up\.railway\.app$/.test(origin) || /\.vercel\.app$/.test(origin))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });
  app.use(import_express5.default.json({ limit: "50mb" }));
  app.use(import_express5.default.urlencoded({ limit: "50mb", extended: true }));
  app.use(healthRouter);
  app.use(realtimeRouter);
  app.use(migrateRouter);
  registerOAuthRoutes(app);
  app.post("/customer/auth/signup", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email and password are required" });
      }
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      const existingResult = await db.execute(import_drizzle_orm4.sql`
        SELECT id FROM users WHERE email = ${email} LIMIT 1
      `);
      const existing = existingResult[0] || [];
      if (existing.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }
      const hashedPassword = await import_bcryptjs3.default.hash(password, 10);
      const insertResult = await db.execute(import_drizzle_orm4.sql`
        INSERT INTO users (email, password_hash, role, full_name, created_at, updated_at)
        VALUES (${email}, ${hashedPassword}, 'customer', ${name}, NOW(), NOW())
      `);
      const userId = insertResult[0]?.insertId;
      if (!userId) {
        return res.status(500).json({ error: "Failed to create user account" });
      }
      await db.execute(import_drizzle_orm4.sql`
        INSERT INTO customers (user_id, name, email, created_at)
        VALUES (${userId}, ${name}, ${email}, NOW())
      `);
      const token = import_jsonwebtoken3.default.sign(
        { userId, email, role: "customer" },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
      );
      res.json({
        success: true,
        token,
        customer: { id: userId, name, email }
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account", details: String(error) });
    }
  });
  app.post("/customer/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }
      const result = await db.execute(import_drizzle_orm4.sql`
        SELECT id, email, password_hash, full_name, role FROM users WHERE email = ${email} LIMIT 1
      `);
      const rows = result[0] || [];
      const user = rows[0];
      if (!user || !user.password_hash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const isValid = await import_bcryptjs3.default.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const token = import_jsonwebtoken3.default.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
      );
      res.json({
        success: true,
        token,
        customer: { id: user.id, name: user.full_name, email: user.email }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login", details: String(error) });
    }
  });
  registerDriverAuthRoutes(app);
  registerAdminAuthRoutes(app);
  registerAdminApiRoutes(app);
  app.use(
    "/api/trpc",
    (0, import_express6.createExpressMiddleware)({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    const { setupVite: setupVite2 } = await Promise.resolve().then(() => (init_vite(), vite_exports));
    await setupVite2(app, server);
  } else {
  }
  initializeSocket(server);
  console.log("[Server] Socket.io initialized");
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
