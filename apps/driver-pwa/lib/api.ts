const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

// ── Auth ──────────────────────────────────────────────
export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/driver/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Login failed')
  }
  return res.json() as Promise<{ token: string; driver: Driver }>
}

export async function signup(email: string, password: string, name: string) {
  const res = await fetch(`${API_BASE}/driver/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Signup failed')
  }
  return res.json() as Promise<{ token: string; driver: Driver }>
}

// ── Profile ───────────────────────────────────────────
export async function getProfile(token: string) {
  const res = await fetch(`${API_BASE}/driver/profile`, {
    headers: authHeaders(token),
  })
  if (!res.ok) {
    const err = new Error('Failed to get profile') as Error & { status: number }
    err.status = res.status
    throw err
  }
  return res.json() as Promise<{ driver: Driver }>
}

export async function updateProfile(token: string, data: Partial<Driver>) {
  const res = await fetch(`${API_BASE}/driver/profile`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update profile')
  return res.json()
}

// ── Online / Offline ──────────────────────────────────
export async function setOnlineStatus(token: string, online: boolean, lat?: number, lng?: number) {
  const res = await fetch(`${API_BASE}/driver/online`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ is_online: online, lat, lng }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const err = new Error(data.error || 'Failed to update status') as Error & { status: number }
    err.status = res.status
    throw err
  }
  return res.json()
}

// ── Orders ────────────────────────────────────────────
export async function getAvailableOrders(token: string) {
  const res = await fetch(`${API_BASE}/driver/orders/available`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to get orders')
  return res.json() as Promise<{ orders: Order[] }>
}

export async function getMyOrders(token: string, filter: string = 'today') {
  const res = await fetch(`${API_BASE}/driver/orders/my-orders?filter=${filter}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to get my orders')
  return res.json() as Promise<{ orders: Order[] }>
}

export async function getOrderDetail(token: string, id: string) {
  const res = await fetch(`${API_BASE}/driver/orders/${id}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to get order')
  return res.json() as Promise<{ order: Order }>
}

export async function getOrderHistory(token: string) {
  const res = await fetch(`${API_BASE}/driver/orders/history`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to get history')
  return res.json() as Promise<{ orders: Order[] }>
}

// ── Order Actions ─────────────────────────────────────
export async function acceptOrder(token: string, id: string) {
  const res = await fetch(`${API_BASE}/driver/orders/${id}/accept`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to accept')
  }
  return res.json()
}

export async function rejectOrder(token: string, id: string) {
  const res = await fetch(`${API_BASE}/driver/orders/${id}/reject`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to reject')
  return res.json()
}

export async function startTrip(token: string, id: string) {
  const res = await fetch(`${API_BASE}/driver/orders/${id}/start-trip`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to start trip')
  return res.json()
}

export async function markArrived(token: string, id: string) {
  const res = await fetch(`${API_BASE}/driver/orders/${id}/arrived`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to mark arrived')
  return res.json()
}

export async function startWork(token: string, id: string) {
  const res = await fetch(`${API_BASE}/driver/orders/${id}/start-work`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to start work')
  return res.json()
}

export async function completeOrder(token: string, id: string, signatureData?: string) {
  const res = await fetch(`${API_BASE}/driver/orders/${id}/complete`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ signature_data: signatureData }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to complete')
  }
  return res.json()
}

export async function cancelOrder(token: string, id: string) {
  const res = await fetch(`${API_BASE}/driver/orders/${id}/cancel`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to cancel')
  return res.json()
}

export async function uploadOrderPhoto(token: string, id: string, type: string, photoData: string) {
  const res = await fetch(`${API_BASE}/driver/orders/${id}/upload-photo`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ type, photo_data: photoData }),
  })
  if (!res.ok) throw new Error('Failed to upload photo')
  return res.json()
}

export async function submitSignature(token: string, id: string, signatureData: string) {
  const res = await fetch(`${API_BASE}/driver/orders/${id}/signature`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ signature_data: signatureData }),
  })
  if (!res.ok) throw new Error('Failed to submit signature')
  return res.json()
}

// ── Earnings ──────────────────────────────────────────
export async function getEarnings(token: string) {
  const res = await fetch(`${API_BASE}/driver/earnings`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to get earnings')
  return res.json() as Promise<EarningsData>
}

export async function getEarningsSummary(token: string) {
  const res = await fetch(`${API_BASE}/api/driver/earnings-summary`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to get earnings summary')
  return res.json()
}

// ── Location ──────────────────────────────────────────
export async function streamLocation(token: string, jobId: string, lat: number, lng: number) {
  const res = await fetch(`${API_BASE}/driver/jobs/${jobId}/location`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ lat, lng }),
  })
  if (!res.ok) throw new Error('Failed to stream location')
  return res.json()
}

export async function sendDriverLocation(token: string, lat: number, lng: number, heading?: number | null, speed?: number | null) {
  const res = await fetch(`${API_BASE}/driver/location`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ lat, lng, heading: heading || null, speed: speed || null }),
  })
  if (!res.ok) throw new Error('Failed to send location')
  return res.json()
}

// ── Types ─────────────────────────────────────────────
export interface Driver {
  id: number | string
  name: string
  email: string
  phone: string
  status: string
  first_name?: string
  last_name?: string
  vehicle_type?: string
  vehicle_capacity?: string
  license_plate?: string
  is_online?: boolean
  is_active?: boolean
  driver_status?: string
  selfie_url?: string
  created_at?: string
}

export interface Order {
  id: string
  service_type?: string
  serviceType?: string
  pickup_address?: string
  pickupAddress?: string
  pickup_lat?: number
  pickup_lng?: number
  scheduled_for?: string
  scheduledFor?: string
  status: string
  payout?: number
  price?: number
  total?: number
  driver_earnings?: number
  driver_earnings_cents?: number
  volume_tier?: string
  helper_count?: number
  estimated_hours?: number
  customer_notes?: string
  customer_name?: string
  customer_phone?: string
  photo_urls?: string[]
  photos?: string[]
  before_photos?: string[]
  after_photos?: string[]
  created_at?: string
  updated_at?: string
  time_window?: string
  pricing_json?: string
}

export interface EarningsData {
  total_earnings?: number
  total_earnings_cents?: number
  this_week?: number
  this_week_cents?: number
  today?: number
  today_cents?: number
  completed_jobs?: number
  earnings?: Array<{
    id: string
    amount: number
    amount_cents: number
    job_id: string
    created_at: string
    status: string
  }>
}
