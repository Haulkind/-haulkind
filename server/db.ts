import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  customers,
  drivers,
  serviceAreas,
  volumePricing,
  disposalCaps,
  addons,
  distanceRules,
  laborRates,
  jobs,
  haulAwayDetails,
  laborOnlyDetails,
  jobOffers,
  jobAssignments,
  payments,
  payouts,
  jobPhotos,
  driverLocations,
  driverDocuments,
  timeExtensionRequests,
  auditLogs,
  driverStrikes,
  ratings,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER & AUTH
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "phone", "photoUrl", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// SERVICE AREAS
// ============================================================================

export async function getAllServiceAreas() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(serviceAreas).where(eq(serviceAreas.isActive, true));
}

export async function getServiceAreaById(id: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(serviceAreas).where(eq(serviceAreas.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// PRICING
// ============================================================================

export async function getVolumePricing(serviceAreaId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(volumePricing)
    .where(eq(volumePricing.serviceAreaId, serviceAreaId));
}

export async function getDisposalCaps(serviceAreaId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(disposalCaps).where(eq(disposalCaps.serviceAreaId, serviceAreaId));
}

export async function getAddons(serviceAreaId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(addons).where(eq(addons.serviceAreaId, serviceAreaId));
}

export async function getDistanceRules(serviceAreaId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(distanceRules)
    .where(eq(distanceRules.serviceAreaId, serviceAreaId));
}

export async function getLaborRates(serviceAreaId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(laborRates).where(eq(laborRates.serviceAreaId, serviceAreaId));
}

// ============================================================================
// CUSTOMERS
// ============================================================================

export async function getOrCreateCustomer(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  let result = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1);

  if (result.length === 0) {
    await db.insert(customers).values({ userId });
    result = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1);
  }

  return result[0];
}

// ============================================================================
// DRIVERS
// ============================================================================

export async function getDriverByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(drivers).where(eq(drivers.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDriverById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(drivers).where(eq(drivers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllDrivers(filters?: { status?: string; isOnline?: boolean }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(drivers.status, filters.status as any));
  }
  if (filters?.isOnline !== undefined) {
    conditions.push(eq(drivers.isOnline, filters.isOnline));
  }

  if (conditions.length > 0) {
    return await db
      .select()
      .from(drivers)
      .where(and(...conditions))
      .orderBy(desc(drivers.createdAt));
  }

  return await db.select().from(drivers).orderBy(desc(drivers.createdAt));
}

// ============================================================================
// JOBS
// ============================================================================

export async function getJobById(id: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getJobsByCustomerId(customerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(jobs)
    .where(eq(jobs.customerId, customerId))
    .orderBy(desc(jobs.createdAt));
}

export async function getHaulAwayDetails(jobId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(haulAwayDetails)
    .where(eq(haulAwayDetails.jobId, jobId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLaborOnlyDetails(jobId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(laborOnlyDetails)
    .where(eq(laborOnlyDetails.jobId, jobId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// JOB PHOTOS
// ============================================================================

export async function getJobPhotos(jobId: string, photoType?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(jobPhotos.jobId, jobId)];
  if (photoType) {
    conditions.push(eq(jobPhotos.photoType, photoType as any));
  }

  return await db
    .select()
    .from(jobPhotos)
    .where(and(...conditions))
    .orderBy(jobPhotos.createdAt);
}

// ============================================================================
// JOB ASSIGNMENTS
// ============================================================================

export async function getJobAssignment(jobId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(jobAssignments)
    .where(eq(jobAssignments.jobId, jobId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDriverActiveJob(driverId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({ job: jobs, assignment: jobAssignments })
    .from(jobAssignments)
    .innerJoin(jobs, eq(jobs.id, jobAssignments.jobId))
    .where(
      and(
        eq(jobAssignments.driverId, driverId),
        sql`${jobs.status} IN ('assigned', 'en_route', 'arrived', 'started')`
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// PAYMENTS & PAYOUTS
// ============================================================================

export async function getPaymentByJobId(jobId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(payments).where(eq(payments.jobId, jobId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPayoutByJobId(jobId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(payouts).where(eq(payouts.jobId, jobId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getEligiblePayouts() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(payouts)
    .where(eq(payouts.status, "eligible"))
    .orderBy(desc(payouts.createdAt));
}

// ============================================================================
// DRIVER LOCATIONS
// ============================================================================

export async function getLatestDriverLocation(driverId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(driverLocations)
    .where(eq(driverLocations.driverId, driverId))
    .orderBy(desc(driverLocations.timestamp))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export async function createAuditLog(log: {
  userId?: number;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) return;

  await db.insert(auditLogs).values(log);
}

// ============================================================================
// RATINGS
// ============================================================================

export async function getDriverRatings(driverId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(ratings)
    .where(eq(ratings.driverId, driverId))
    .orderBy(desc(ratings.createdAt));
}

// Service Area CRUD operations
export async function createServiceArea(data: {
  name: string;
  state: string;
  type: "radius" | "polygon";
  centerLat: number;
  centerLng: number;
  radiusMiles?: number;
  polygonGeoJson?: any;
  isActive?: boolean;
}) {
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
    isActive: data.isActive ?? true,
  });

  return await getServiceAreaById(id);
}

export async function updateServiceArea(
  id: string,
  updates: {
    name?: string;
    state?: string;
    type?: "radius" | "polygon";
    centerLat?: number;
    centerLng?: number;
    radiusMiles?: number;
    polygonGeoJson?: any;
    isActive?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.state) updateData.state = updates.state;
  if (updates.type) updateData.type = updates.type;
  if (updates.centerLat) updateData.centerLat = updates.centerLat.toString();
  if (updates.centerLng) updateData.centerLng = updates.centerLng.toString();
  if (updates.radiusMiles) updateData.radiusMiles = updates.radiusMiles.toString();
  if (updates.polygonGeoJson !== undefined) updateData.polygonGeoJson = updates.polygonGeoJson;
  if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

  await db.update(serviceAreas).set(updateData).where(eq(serviceAreas.id, id));
  return await getServiceAreaById(id);
}

export async function deleteServiceArea(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(serviceAreas).set({ isActive: false }).where(eq(serviceAreas.id, id));
  return { success: true };
}

export async function findServiceAreaByCoordinates(lat: number, lon: number) {
  const db = await getDb();
  if (!db) return undefined;

  // Get all active service areas
  const areas = await db.select().from(serviceAreas).where(eq(serviceAreas.isActive, true));

  // Simple radius-based check (for production, use PostGIS or proper geospatial library)
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
    // TODO: Add polygon check for polygonGeoJson
  }

  return undefined;
}

// Helper: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Job CRUD operations
export async function createJob(data: {
  customerId: number;
  serviceAreaId: string;
  serviceType: "HAUL_AWAY" | "LABOR_ONLY";
  status: string;
  pickupAddress: string;
  pickupLat: string;
  pickupLon: string;
  scheduledFor: Date | null;
  specialInstructions?: string;
  subtotal: string;
  platformFee: string;
  totalAmount: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Get customer info for contact details
  const customer = await getCustomerById(data.customerId);
  const user = customer ? await getUserById(customer.userId) : null;
  
  await db.insert(jobs).values({
    id,
    customerId: data.customerId,
    serviceAreaId: data.serviceAreaId,
    jobType: data.serviceType,
    status: data.status as any,
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
    scheduledFor: data.scheduledFor,
  });

  return await getJobById(id);
}

export async function updateJob(id: string, updates: {
  status?: string;
  paidAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (updates.status) updateData.status = updates.status;
  if (updates.paidAt) updateData.paidAt = updates.paidAt;
  if (updates.completedAt) updateData.completedAt = updates.completedAt;
  // Note: cancelledAt and cancellationReason not in schema, using notes field
  if (updates.cancellationReason) updateData.pickupNotes = updates.cancellationReason;

  await db.update(jobs).set(updateData).where(eq(jobs.id, id));
  return await getJobById(id);
}

export async function getAllJobs(filters?: {
  status?: string;
  customerId?: number;
  driverId?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(jobs);

  // Apply filters
  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(jobs.status, filters.status as any));
  }
  if (filters?.customerId) {
    conditions.push(eq(jobs.customerId, filters.customerId));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  // Apply pagination
  const limit = filters?.limit || 20;
  const offset = filters?.offset || 0;

  return await query.orderBy(desc(jobs.createdAt)).limit(limit).offset(offset);
}

export async function createHaulAwayDetails(data: {
  jobId: string;
  volumeCubicYards: string;
  volumeTier: "1_8" | "1_4" | "1_2" | "3_4" | "full";
  disposalCostActual: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(haulAwayDetails).values({
    jobId: data.jobId,
    volumeTier: data.volumeTier,
    disposalCap: data.disposalCostActual,
    sameDay: false,
  });
}

export async function createLaborOnlyDetails(data: {
  jobId: string;
  estimatedHours: string;
  actualHours: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const hours = parseInt(data.estimatedHours);
  
  await db.insert(laborOnlyDetails).values({
    jobId: data.jobId,
    helpersCount: 1,
    hoursBooked: hours,
  });
}

export async function createPayment(data: {
  jobId: string;
  customerId: number;
  amount: string;
  provider: string;
  providerRef?: string;
  status: string;
}) {
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
    status: data.status as any,
  });

  const result = await db
    .select()
    .from(payments)
    .where(eq(payments.id, id))
    .limit(1);
  return result[0];
}

export async function getCustomerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCustomer(data: {
  userId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(customers).values({
    userId: data.userId,
  });

  return await getCustomerByUserId(data.userId);
}

export async function createJobPhoto(data: {
  jobId: string;
  photoType: string;
  url: string;
  uploadedBy: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(jobPhotos).values({
    jobId: data.jobId,
    photoType: data.photoType as any,
    fileUrl: data.url,
    storageKey: data.url, // Use URL as key for now
    uploadedBy: parseInt(data.uploadedBy),
  });

  // Get the inserted record
  const photos = await db
    .select()
    .from(jobPhotos)
    .where(eq(jobPhotos.jobId, data.jobId))
    .orderBy(desc(jobPhotos.createdAt))
    .limit(1);
  return photos[0];
}

// Driver operations
export async function createDriver(data: {
  userId: number;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: Date;
  insuranceProvider: string;
  insurancePolicy: string;
  insuranceExpiry: Date;
  status: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(drivers).values({
    userId: data.userId,
    insuranceProvider: data.insuranceProvider,
    insurancePolicyNumber: data.insurancePolicy,
    insuranceExpiresAt: data.insuranceExpiry,
    status: data.status as any,
  });

  return await getDriverByUserId(data.userId);
}

export async function updateDriver(id: number, updates: {
  status?: string;
  approvedAt?: Date;
  isOnline?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (updates.status) updateData.status = updates.status;
  if (updates.isOnline !== undefined) updateData.isOnline = updates.isOnline;

  await db.update(drivers).set(updateData).where(eq(drivers.id, id));
  return await getDriverById(id);
}

export async function createDriverVehicle(data: {
  driverId: number;
  vehicleType: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  state: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Store vehicle info in driver record for now (schema doesn't have separate vehicles table)
  await db.update(drivers).set({
    vehicleType: data.vehicleType,
  }).where(eq(drivers.id, data.driverId));
}

export async function getDriverVehicles(driverId: number) {
  const db = await getDb();
  if (!db) return [];

  const driver = await getDriverById(driverId);
  if (!driver || !driver.vehicleType) return [];

  // Return vehicle info from driver record
  return [{
    vehicleType: driver.vehicleType,
  }];
}

// Job offers and assignments
export async function createJobOffer(data: {
  jobId: string;
  driverId: number;
  wave: number;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `offer_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  await db.insert(jobOffers).values({
    id,
    jobId: data.jobId,
    driverId: data.driverId,
    wave: data.wave,
    expiresAt: data.expiresAt,
  });

  const result = await db.select().from(jobOffers).where(eq(jobOffers.id, id)).limit(1);
  return result[0];
}

export async function getJobOffers(jobId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(jobOffers).where(eq(jobOffers.jobId, jobId));
}

export async function updateJobOffer(id: string, updates: {
  status?: string;
  respondedAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (updates.status) updateData.status = updates.status;
  if (updates.respondedAt) updateData.respondedAt = updates.respondedAt;

  await db.update(jobOffers).set(updateData).where(eq(jobOffers.id, id));

  const result = await db.select().from(jobOffers).where(eq(jobOffers.id, id)).limit(1);
  return result[0];
}

export async function createJobAssignment(data: {
  jobId: string;
  driverId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(jobAssignments).values({
    jobId: data.jobId,
    driverId: data.driverId,
  });

  const result = await db
    .select()
    .from(jobAssignments)
    .where(eq(jobAssignments.jobId, data.jobId))
    .limit(1);
  return result[0];
}

// Payouts
export async function createPayout(data: {
  jobId: string;
  driverId: number;
  driverPayout: string;
  disposalReimbursement: string;
  totalAmount: string;
  disposalReceiptUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `payout_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  await db.insert(payouts).values({
    id,
    jobId: data.jobId,
    driverId: data.driverId,
    driverPayout: data.driverPayout,
    disposalReimbursement: data.disposalReimbursement,
    totalAmount: data.totalAmount,
  });

  const result = await db.select().from(payouts).where(eq(payouts.id, id)).limit(1);
  return result[0];
}
