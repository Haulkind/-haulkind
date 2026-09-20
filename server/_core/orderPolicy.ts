import type { Request, Response, NextFunction } from "express";

export const SERVICE_TIMEZONE = "America/New_York";
export const AVAILABLE_STATUSES = ["pending", "dispatching", "paid", "scheduled"];
export const PRE_TRIP_STATUSES = ["assigned", "accepted", "scheduled"];
export const WORK_STATUSES = ["en_route", "arrived", "in_progress", "started", "photo_taken", "signed"];
export const ACTIVE_STATUSES = [...PRE_TRIP_STATUSES, ...WORK_STATUSES];
export const ETA_STATUSES = [...PRE_TRIP_STATUSES, "en_route"];

type Timestamp = string | Date | null;
type Numeric = string | number | null;

export interface OrderRow {
  id: string;
  status: string;
  assigned_driver_id?: string | number | null;
  service_date?: string | null;
  scheduled_for?: Timestamp;
  pickup_date?: Timestamp;
  customer_name?: string | null;
  customer_phone?: string | null;
  phone?: string | null;
  customer_email?: string | null;
  customer_account_id?: string | number | null;
  tracking_token?: string | null;
  eta_supported?: boolean;
  eta_revision?: string | null;
  service_type?: string | null;
  pickup_address?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  pickup_lat?: Numeric;
  pickup_lng?: Numeric;
  lat?: Numeric;
  lng?: Numeric;
  dropoff_address?: string | null;
  description?: string | null;
  volume_tier?: string | null;
  estimated_hours?: Numeric;
  helper_count?: number | null;
  items_json?: unknown;
  estimated_price?: Numeric;
  final_price?: Numeric;
  pricing_json?: unknown;
  pickup_time_window?: string | null;
  photo_urls?: unknown;
  before_photos?: string | null;
  after_photos?: string | null;
  completion_photos?: string | null;
  signature_data?: string | null;
  completed_at?: Timestamp;
  created_at?: Timestamp;
  updated_at?: Timestamp;
  paid_at?: Timestamp;
  driver_earnings_cents?: number | null;
  payout_status?: string | null;
  driver_eta_at?: Timestamp;
  driver_eta_updated_at?: Timestamp;
  driver_eta_driver_id?: string | null;
  driver_eta_service_date?: string | Date | null;
  driver?: { id: string | number; name?: string; phone?: string | null; selfie_url?: string | null };
  driver_location?: {
    lat: number; lng: number; heading: number | null; speed: number | null;
    updated_at: Timestamp; distance_km: number; distance_miles: number; eta_minutes: number;
  };
}

export interface OrderDatabase {
  query(sql: string, values?: unknown[]): Promise<{ rows: OrderRow[]; rowCount: number | null }>;
}

export function noStore(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("Pragma", "no-cache");
  next();
}

export function calendarDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}

const easternFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SERVICE_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

function easternParts(date: Date) {
  const parts = easternFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value || "";
  return { date: `${part("year")}-${part("month")}-${part("day")}`, time: `${part("hour")}:${part("minute")}:${part("second")}` };
}

export function easternDate(now = new Date()): string {
  return easternParts(now).date;
}

export function nextDate(date: string): string {
  return new Date(new Date(`${date}T12:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10);
}

// PostgreSQL scheduled_for is a calendar timestamp without a timezone.
export const SERVICE_DATE_SQL = "scheduled_for::date::text";
export const SERVICE_DAY_SQL = "scheduled_for::date = (NOW() AT TIME ZONE 'America/New_York')::date";

export function arrivalInstants(date: string, time: string): Date[] {
  if (!calendarDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return [];
  const wall = new Date(`${date}T${time}:00Z`).getTime();
  const offsets = new Set<number>();
  for (const delta of [-86400000, 0, 86400000]) {
    const instant = new Date(wall + delta);
    const local = easternParts(instant);
    offsets.add(new Date(`${local.date}T${local.time}Z`).getTime() - instant.getTime());
  }
  return Array.from(offsets).map(offset => new Date(wall - offset))
    .filter(instant => {
      const local = easternParts(instant);
      return local.date === date && local.time === `${time}:00`;
    }).sort((a, b) => a.getTime() - b.getTime());
}

let etaReady = false;
let schemaAttempt: Promise<boolean> | null = null;
export async function ensureOrderEtaSchema(pool: OrderDatabase): Promise<boolean> {
  if (etaReady) return true;
  if (schemaAttempt) return schemaAttempt;
  schemaAttempt = (async () => {
    try {
      await pool.query(`
        ALTER TABLE jobs
          ADD COLUMN IF NOT EXISTS driver_eta_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS driver_eta_updated_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS driver_eta_driver_id TEXT,
          ADD COLUMN IF NOT EXISTS driver_eta_service_date DATE
      `);
      await pool.query(`
        CREATE OR REPLACE FUNCTION clear_job_arrival_estimate() RETURNS trigger AS $$
        BEGIN
          IF NEW.assigned_driver_id IS DISTINCT FROM OLD.assigned_driver_id
            OR NEW.scheduled_for IS DISTINCT FROM OLD.scheduled_for
            OR NEW.status NOT IN ('assigned', 'accepted', 'scheduled', 'en_route')
          THEN
            NEW.driver_eta_at := NULL;
            NEW.driver_eta_updated_at := NULL;
            NEW.driver_eta_driver_id := NULL;
            NEW.driver_eta_service_date := NULL;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
      `);
      await pool.query(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'jobs_clear_arrival_estimate' AND tgrelid = 'jobs'::regclass) THEN
            CREATE TRIGGER jobs_clear_arrival_estimate BEFORE UPDATE ON jobs
              FOR EACH ROW EXECUTE FUNCTION clear_job_arrival_estimate();
          END IF;
        END $$
      `);
      etaReady = true;
      return true;
    } catch (error) {
      console.error("[OrderPolicy] ETA schema unavailable:", error);
      return false;
    } finally {
      schemaAttempt = null;
    }
  })();
  return schemaAttempt;
}

type Audience = { kind: "driver"; driverId: string } | { kind: "customer" } | { kind: "public" };

function iso(value: Timestamp | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function legacyTotal(value: unknown): Numeric {
  try {
    const pricing: unknown = typeof value === "string" ? JSON.parse(value) : value;
    if (typeof pricing === "number") return pricing;
    if (typeof pricing === "object" && pricing !== null && "total" in pricing &&
      (typeof pricing.total === "number" || typeof pricing.total === "string")) {
      return pricing.total;
    }
  } catch {
    return null;
  }
  return null;
}

export function orderPolicy(order: OrderRow, audience: Audience, now = new Date()) {
  const serviceDate = calendarDate(order.service_date);
  const today = easternDate(now);
  const isServiceDay = serviceDate !== null && serviceDate === today;
  const assigned = order.assigned_driver_id != null;
  const own = audience.kind === "driver" && assigned && String(order.assigned_driver_id) === audience.driverId;
  const active = assigned && ACTIVE_STATUSES.includes(order.status);
  const canContactCustomer = own && isServiceDay && WORK_STATUSES.includes(order.status);
  const canContactDriver = audience.kind === "customer" && active && isServiceDay;
  const midnight = serviceDate ? arrivalInstants(nextDate(serviceDate), "00:00")[0] : null;
  const etaAt = iso(order.driver_eta_at);
  const etaDate = order.driver_eta_service_date instanceof Date
    ? `${order.driver_eta_service_date.getFullYear()}-${String(order.driver_eta_service_date.getMonth() + 1).padStart(2, "0")}-${String(order.driver_eta_service_date.getDate()).padStart(2, "0")}`
    : order.driver_eta_service_date;
  const etaAvailable = etaReady && order.eta_supported !== false;
  const showEta = etaAvailable && assigned && ETA_STATUSES.includes(order.status) &&
    serviceDate !== null && serviceDate >= today && etaDate === serviceDate &&
    order.driver_eta_driver_id === String(order.assigned_driver_id) && etaAt !== null &&
    easternDate(new Date(etaAt)) === serviceDate;
  return {
    service_date: serviceDate,
    service_timezone: SERVICE_TIMEZONE,
    server_time: now.toISOString(),
    can_contact_customer: canContactCustomer,
    can_contact_driver: canContactDriver,
    contact_expires_at: (canContactCustomer || canContactDriver) && midnight
      ? new Date(Math.min(midnight.getTime(), now.getTime() + 30000)).toISOString() : null,
    can_accept: order.eta_supported !== false && audience.kind === "driver" && !assigned && AVAILABLE_STATUSES.includes(order.status),
    can_start_trip: order.eta_supported !== false && own && isServiceDay && PRE_TRIP_STATUSES.includes(order.status),
    can_upload_photos: order.eta_supported !== false && own && isServiceDay && ACTIVE_STATUSES.includes(order.status),
    can_set_eta: etaAvailable && own && serviceDate !== null && serviceDate >= today && ETA_STATUSES.includes(order.status),
    eta_available: etaAvailable,
    driver_eta_at: showEta ? etaAt : null,
    driver_eta_updated_at: showEta ? iso(order.driver_eta_updated_at) : null,
  };
}

export function serializeOrder(order: OrderRow, audience: Audience, now = new Date()) {
  const policy = orderPolicy(order, audience, now);
  const ownDriver = audience.kind === "driver" && String(order.assigned_driver_id) === audience.driverId;
  const driver = order.driver;
  const showLocation = audience.kind !== "driver" && policy.service_date === easternDate(now) &&
    !!order.assigned_driver_id && ACTIVE_STATUSES.includes(order.status);
  return {
    id: order.id, status: order.status, assigned_driver_id: order.assigned_driver_id ?? null,
    customer_name: order.customer_name ?? null,
    customer_phone: policy.can_contact_customer ? order.customer_phone || order.phone || null : null,
    tracking_token: audience.kind === "customer" ? order.tracking_token : undefined,
    service_type: order.service_type,
    pickup_address: order.pickup_address ?? [order.street, order.city, order.state, order.zip].filter(Boolean).join(", "),
    pickup_lat: order.pickup_lat ?? order.lat ?? null, pickup_lng: order.pickup_lng ?? order.lng ?? null,
    dropoff_address: order.dropoff_address, description: order.description,
    volume_tier: order.volume_tier, estimated_hours: order.estimated_hours, helper_count: order.helper_count,
    items_json: order.items_json, estimated_price: order.estimated_price ?? legacyTotal(order.pricing_json), final_price: order.final_price,
    scheduled_for: order.scheduled_for ?? order.pickup_date ?? null,
    pickup_time_window: order.pickup_time_window, photo_urls: order.photo_urls,
    before_photos: ownDriver || audience.kind === "customer" ? order.before_photos : undefined,
    after_photos: ownDriver || audience.kind === "customer" ? order.after_photos : undefined,
    completion_photos: ownDriver || audience.kind === "customer" ? order.completion_photos : undefined,
    signature_data: ownDriver || audience.kind === "customer" ? order.signature_data : undefined,
    completed_at: order.completed_at, created_at: order.created_at, updated_at: order.updated_at,
    paid_at: order.paid_at, driver_earnings_cents: ownDriver ? order.driver_earnings_cents : undefined,
    payout_status: ownDriver ? order.payout_status : undefined,
    driver: driver ? {
      id: driver.id, name: driver.name, selfie_url: driver.selfie_url,
      phone: policy.can_contact_driver ? driver.phone ?? null : null,
    } : null,
    driver_location: showLocation && order.driver_location ? {
      ...order.driver_location,
      eta_minutes: order.status === "en_route" ? order.driver_location.eta_minutes : null,
      eta_source: "distance_estimate",
    } : null,
    ...policy,
  };
}
