// Admin API client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export interface Driver {
  id: number
  name: string
  email: string
  phone: string
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED'
  canHaulAway: boolean
  canLaborOnly: boolean
  vehicleType?: string
  vehicleCapacity?: string
  liftingLimit?: number
  documentsUploaded: boolean
  licenseUrl?: string
  insuranceUrl?: string
  registrationUrl?: string
  createdAt: string
  lastSeenAt?: string
}

export interface Job {
  id: number
  serviceType: 'HAUL_AWAY' | 'LABOR_ONLY'
  status: string
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  scheduledFor: string
  totalPrice: number
  customerId: number
  driverId?: number
  driver?: {
    id: number
    name: string
    phone: string
  }
  customer?: {
    id: number
    name: string
    phone: string
  }
  volumeTier?: string
  helperCount?: number
  estimatedHours?: number
  createdAt: string
}

export interface EligibleDriver {
  driver: Driver
  distance: number
  eta: number
  completionRate: number
  averageRating: number
  jobsCompleted: number
}

export interface OfferWave {
  id: number
  jobId: number
  waveNumber: number
  driverIds: number[]
  expiresAt: string
  acceptedBy?: number
  createdAt: string
}

export interface VolumePricing {
  id: number
  tier: string
  basePrice: number
  disposalCap: number
  serviceAreaId: number
}

export interface Addon {
  id: number
  name: string
  price: number
  enabled: boolean
  serviceAreaId?: number
}

export interface LaborRate {
  id: number
  helperCount: number
  hourlyRate: number
  minimumHours: number
  serviceAreaId: number
}

export interface AuditLog {
  id: number
  entityType: string
  entityId: number
  action: string
  userId: number
  userName: string
  changes: any
  createdAt: string
}

export async function login(email: string, password: string): Promise<{ token: string }> {
  const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new Error('Login failed')
  return response.json()
}

// Drivers
export async function getDrivers(token: string, filters?: any): Promise<Driver[]> {
  const params = new URLSearchParams(filters)
  const response = await fetch(`${API_BASE_URL}/admin/drivers?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to get drivers')
  return response.json()
}

export async function getDriver(token: string, id: number): Promise<Driver> {
  const response = await fetch(`${API_BASE_URL}/admin/drivers/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to get driver')
  return response.json()
}

export async function approveDriver(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/drivers/${id}/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to approve driver')
}

export async function blockDriver(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/drivers/${id}/block`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to block driver')
}

export async function unblockDriver(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/drivers/${id}/unblock`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to unblock driver')
}

// Jobs
export async function getJobs(token: string, filters?: any): Promise<Job[]> {
  const params = new URLSearchParams(filters)
  const response = await fetch(`${API_BASE_URL}/admin/jobs?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to get jobs')
  return response.json()
}

export async function getJob(token: string, id: number): Promise<Job> {
  const response = await fetch(`${API_BASE_URL}/admin/jobs/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to get job')
  return response.json()
}

export async function getOfferWaves(token: string, jobId: number): Promise<OfferWave[]> {
  const response = await fetch(`${API_BASE_URL}/admin/jobs/${jobId}/offer-waves`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to get offer waves')
  return response.json()
}

// Dispatch
export async function getUnassignedJobs(token: string): Promise<Job[]> {
  const response = await fetch(`${API_BASE_URL}/admin/dispatch/unassigned`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to get unassigned jobs')
  return response.json()
}

export async function getEligibleDrivers(token: string, jobId: number): Promise<EligibleDriver[]> {
  const response = await fetch(`${API_BASE_URL}/admin/dispatch/eligible-drivers?jobId=${jobId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to get eligible drivers')
  return response.json()
}

export async function forceAssign(token: string, jobId: number, driverId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/dispatch/force-assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ jobId, driverId }),
  })
  if (!response.ok) throw new Error('Failed to force assign')
}

// Pricing
export async function getVolumePricing(token: string): Promise<VolumePricing[]> {
  const response = await fetch(`${API_BASE_URL}/admin/pricing/volumes`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to get volume pricing')
  return response.json()
}

export async function updateVolumePricing(token: string, id: number, data: Partial<VolumePricing>): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/pricing/volumes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to update volume pricing')
}

export async function getAddons(token: string): Promise<Addon[]> {
  const response = await fetch(`${API_BASE_URL}/admin/pricing/addons`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to get addons')
  return response.json()
}

export async function updateAddon(token: string, id: number, data: Partial<Addon>): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/pricing/addons/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to update addon')
}

export async function getLaborRates(token: string): Promise<LaborRate[]> {
  const response = await fetch(`${API_BASE_URL}/admin/pricing/labor-rates`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to get labor rates')
  return response.json()
}

export async function updateLaborRate(token: string, id: number, data: Partial<LaborRate>): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/pricing/labor-rates/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to update labor rate')
}

// Audit Logs
export async function getAuditLogs(token: string, filters?: any): Promise<AuditLog[]> {
  const params = new URLSearchParams(filters)
  const response = await fetch(`${API_BASE_URL}/admin/audit-logs?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to get audit logs')
  return response.json()
}

// Map
export async function getActiveDrivers(token: string): Promise<Driver[]> {
  const response = await fetch(`${API_BASE_URL}/admin/map/drivers`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to get active drivers')
  return response.json()
}

export async function getActiveJobs(token: string): Promise<Job[]> {
  const response = await fetch(`${API_BASE_URL}/admin/map/jobs`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to get active jobs')
  return response.json()
}
