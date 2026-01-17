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
