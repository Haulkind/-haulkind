// API client for backend integration
// MUST point to the official backend (285b) — same as admin dashboard and web app
const OFFICIAL_BACKEND = 'https://haulkind-production-285b.up.railway.app'
const API_BASE_URL = OFFICIAL_BACKEND

// Runtime logging
console.log('[Driver API] Using backend:', API_BASE_URL)

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  driver: {
    id: number
    name: string
    email: string
    phone: string
    status: string
  }
}

export interface OnboardingData {
  name: string
  phone: string
  vehicleType?: string
  vehicleCapacity?: string
  liftingLimit?: number
  canHaulAway: boolean
  canLaborOnly: boolean
  documents: {
    license: string
    insurance: string
    registration: string
  }
}

export interface Job {
  id: string
  serviceType: string
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  scheduledFor: string
  status: string
  payout: number
  distance: number
  eta: number
  volumeTier?: string
  helperCount?: number
  estimatedHours?: number
  customerNotes?: string
  photoUrls?: string[]
  customerName?: string
  customerPhone?: string
  customerEmail?: string
}

export interface Offer {
  jobId: string
  job: Job
  expiresAt: string
}

// Map raw DB row to Job interface — handles all possible field names from backend
function mapRowToJob(row: any): Job {
  const price = parseFloat(row.estimated_price) || parseFloat(row.payout) || parseFloat(row.total) || parseFloat(row.amount) || 0
  return {
    id: String(row.id),
    serviceType: row.service_type || row.serviceType || 'HAUL_AWAY',
    pickupAddress: row.pickup_address || row.pickupAddress || row.street || '',
    pickupLat: parseFloat(row.pickup_lat || row.pickupLat || row.lat) || 0,
    pickupLng: parseFloat(row.pickup_lng || row.pickupLng || row.lng) || 0,
    scheduledFor: row.scheduled_for || row.scheduledFor || row.pickup_date || '',
    status: row.status || 'pending',
    payout: price,
    distance: parseFloat(row.distance) || 0,
    eta: parseFloat(row.eta) || 0,
    volumeTier: row.volume_tier || row.volumeTier,
    helperCount: row.helper_count || row.helperCount,
    estimatedHours: row.estimated_hours || row.estimatedHours,
    customerNotes: row.description || row.customer_notes || row.customerNotes,
    photoUrls: row.photo_urls || row.photoUrls,
    customerName: row.customer_name || row.customerName,
    customerPhone: row.customer_phone || row.customerPhone,
    customerEmail: row.customer_email || row.customerEmail,
  }
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  console.log('[Driver API] POST /driver/auth/login')
  const response = await fetch(`${API_BASE_URL}/driver/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.text()
    console.error('[Driver API] Login failed:', response.status, err)
    throw new Error('Login failed')
  }
  const result = await response.json()
  console.log('[Driver API] Login success, driver:', result.driver?.id)
  return result
}

export async function signup(data: LoginRequest): Promise<LoginResponse> {
  console.log('[Driver API] POST /driver/auth/signup')
  const response = await fetch(`${API_BASE_URL}/driver/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.text()
    console.error('[Driver API] Signup failed:', response.status, err)
    throw new Error('Signup failed')
  }
  return response.json()
}

export async function completeOnboarding(token: string, data: OnboardingData): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/driver/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Onboarding failed')
  }
}

export async function goOnline(token: string): Promise<void> {
  console.log('[Driver API] POST /driver/online (online=true)')
  const response = await fetch(`${API_BASE_URL}/driver/online`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ online: true }),
  })
  if (!response.ok) {
    const err = await response.text()
    console.error('[Driver API] Go online failed:', response.status, err)
    throw new Error('Failed to go online')
  }
  console.log('[Driver API] Now online')
}

export async function goOffline(token: string): Promise<void> {
  console.log('[Driver API] POST /driver/online (online=false)')
  const response = await fetch(`${API_BASE_URL}/driver/online`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ online: false }),
  })
  if (!response.ok) {
    const err = await response.text()
    console.error('[Driver API] Go offline failed:', response.status, err)
    throw new Error('Failed to go offline')
  }
  console.log('[Driver API] Now offline')
}

export async function getAvailableOrders(token: string): Promise<Job[]> {
  console.log('[Driver API] GET /driver/orders/available')
  const response = await fetch(`${API_BASE_URL}/driver/orders/available`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) {
    const err = await response.text()
    console.error('[Driver API] Get available orders failed:', response.status, err)
    throw new Error('Failed to get available orders')
  }
  const data = await response.json()
  const orders = (data.orders || []).map(mapRowToJob)
  console.log('[Driver API] Available orders:', orders.length, orders.map((o: Job) => ({ id: String(o.id).substring(0, 8), payout: o.payout, status: o.status })))
  return orders
}

export async function acceptOrder(token: string, orderId: string): Promise<void> {
  console.log('[Driver API] POST /driver/orders/' + orderId + '/accept')
  const response = await fetch(`${API_BASE_URL}/driver/orders/${orderId}/accept`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) {
    const err = await response.text()
    console.error('[Driver API] Accept order failed:', response.status, err)
    throw new Error('Failed to accept order')
  }
  console.log('[Driver API] Order accepted:', orderId)
}

export async function rejectOrder(token: string, orderId: string): Promise<void> {
  console.log('[Driver API] POST /driver/orders/' + orderId + '/reject')
  const response = await fetch(`${API_BASE_URL}/driver/orders/${orderId}/reject`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error('Failed to reject order')
  }
}

export async function acceptOffer(token: string, jobId: string): Promise<void> {
  return acceptOrder(token, jobId)
}

export async function declineOffer(token: string, jobId: string): Promise<void> {
  return rejectOrder(token, jobId)
}

export async function updateJobStatus(token: string, jobId: string, status: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/driver/jobs/${jobId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    throw new Error('Failed to update job status')
  }
}

export async function uploadPhoto(token: string, jobId: string, type: string, photoUri: string): Promise<string> {
  // For demo: return the URI directly
  // In production: upload to S3 via backend
  return photoUri
}

export async function streamLocation(token: string, jobId: string, lat: number, lng: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/driver/jobs/${jobId}/location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ lat, lng }),
  })
  if (!response.ok) {
    throw new Error('Failed to stream location')
  }
}

export async function getActiveJob(token: string): Promise<Job | null> {
  console.log('[Driver API] GET /driver/jobs/active')
  const response = await fetch(`${API_BASE_URL}/driver/jobs/active`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error('Failed to get active job')
  }
  const data = await response.json()
  return data ? mapRowToJob(data) : null
}

export async function getOrderDetails(token: string, orderId: string): Promise<Job | null> {
  console.log('[Driver API] GET /driver/orders/' + orderId)
  const response = await fetch(`${API_BASE_URL}/driver/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error('Failed to get order details')
  }
  const data = await response.json()
  return data?.order ? mapRowToJob(data.order) : null
}

export function getApiBaseUrl(): string {
  return API_BASE_URL
}
