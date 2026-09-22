export const SERVICE_TIMEZONE = "America/New_York";
export const CONTACT_STATUSES = ["en_route", "arrived", "in_progress", "started", "photo_taken", "signed"];
export const ETA_STATUSES = ["accepted", "assigned", "en_route"];

export interface OrderRecord extends Record<string, unknown> {
  status?: string;
  assigned_driver_id?: string | number | null;
  scheduled_for?: string | Date | null;
  pickup_date?: string | Date | null;
  driver_eta_at?: string | Date | null;
  eta_driver_id?: string | number | null;
  driver?: { id: string | number; name?: string; phone?: string | null; selfie_url?: string };
}

export function serviceDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return Number.isNaN(Date.parse(value)) ? null : value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SERVICE_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  return ["year", "month", "day"].map(type => parts.find(part => part.type === type)?.value).join("-");
}

export function isServiceDay(order: OrderRecord, now = new Date()): boolean {
  const scheduled = serviceDate(order.scheduled_for || order.pickup_date);
  return scheduled !== null && scheduled === serviceDate(now);
}

export function orderForAudience(order: OrderRecord, audience: "driver" | "customer" | "public", driverId?: string | number) {
  const now = new Date();
  const status = order.status || "";
  const assigned = order.assigned_driver_id != null;
  const active = [...ETA_STATUSES, ...CONTACT_STATUSES].includes(status);
  const today = isServiceDay(order, now);
  const customerContact = audience === "driver" && assigned && driverId != null &&
    String(order.assigned_driver_id) === String(driverId) && today && CONTACT_STATUSES.includes(status);
  const driverContact = audience === "customer" && assigned && today && active;
  const copy: OrderRecord = { ...order };
  const customerPhone = order.customer_phone || order.customerPhone || order.phone;
  for (const key of ["customer_phone", "customerPhone", "phone", "driver_phone", "driverPhone"]) delete copy[key];
  if (customerContact && typeof customerPhone === "string") copy.customer_phone = customerPhone;
  if (copy.driver) {
    const { phone, ...driver } = copy.driver;
    copy.driver = driverContact ? { ...driver, phone } : driver;
  }
  if (audience !== "customer") delete copy.tracking_token;
  const eta = order.driver_eta_at ? new Date(order.driver_eta_at) : null;
  copy.driver_eta_at = assigned && ETA_STATUSES.includes(status) &&
    String(order.eta_driver_id) === String(order.assigned_driver_id) &&
    eta && Number.isFinite(eta.getTime()) && serviceDate(eta) === serviceDate(order.scheduled_for)
    ? eta.toISOString() : null;
  delete copy.eta_driver_id;
  if (audience !== "customer" || !today || !CONTACT_STATUSES.includes(status)) delete copy.driver_location;
  const localTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: SERVICE_TIMEZONE, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).format(now).split(":").map(Number);
  const untilMidnight = (86400 - localTime[0] * 3600 - localTime[1] * 60 - localTime[2]) * 1000 - now.getMilliseconds();
  return {
    ...copy,
    service_date: serviceDate(order.scheduled_for || order.pickup_date),
    service_timezone: SERVICE_TIMEZONE,
    can_contact_customer: customerContact,
    can_contact_driver: driverContact,
    contact_expires_at: customerContact || driverContact
      ? new Date(now.getTime() + Math.min(30000, untilMidnight)).toISOString() : null,
    server_time: now.toISOString(),
  };
}
