// API client for backend integration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  customer: {
    id: number
    name: string
    email: string
    phone: string
  }
}

export interface ServiceArea {
  id: number
  name: string
  state: string
}

export interface QuoteRequest {
  serviceType: 'HAUL_AWAY' | 'LABOR_ONLY'
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  scheduledFor: string
  volumeTier?: string
  addons?: string[]
  helperCount?: number
  estimatedHours?: number
  customerNotes?: string
  photoUrls?: string[]
}

export interface QuoteResponse {
  servicePrice: number
  addonsCost: number
  distanceFee: number
  disposalCap: number
  totalPrice: number
  breakdown: Array<{ label: string; amount: number }>
}

export interface Job {
  id: number
  serviceType: 'HAUL_AWAY' | 'LABOR_ONLY'
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  scheduledFor: string
  status: string
  totalPrice: number
  driverPayout: number
  volumeTier?: string
  helperCount?: number
  estimatedHours?: number
  customerNotes?: string
  photoUrls?: string[]
  driver?: {
    id: number
    name: string
    phone: string
    vehicleType?: string
  }
  driverLocation?: {
    lat: number
    lng: number
    updatedAt: string
  }
  eta?: number
  distance?: number
}

export interface TimeExtensionRequest {
  id: number
  jobId: number
  requestedHours: number
  additionalCost: number
  status: 'PENDING' | 'APPROVED' | 'DECLINED'
  createdAt: string
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/customer/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Login failed')
  }
  return response.json()
}

export async function signup(data: LoginRequest & { name: string; phone: string }): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/customer/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Signup failed')
  }
  return response.json()
}

export async function checkServiceArea(lat: number, lng: number): Promise<ServiceArea | null> {
  const response = await fetch(`${API_BASE_URL}/service-areas/lookup?lat=${lat}&lng=${lng}`)
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error('Service area lookup failed')
  }
  return response.json()
}

export async function getQuote(token: string, data: QuoteRequest): Promise<QuoteResponse> {
  const response = await fetch(`${API_BASE_URL}/quotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to get quote')
  }
  return response.json()
}

export async function createJob(token: string, data: QuoteRequest): Promise<Job> {
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create job')
  }
  return response.json()
}

export async function payForJob(token: string, jobId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/pay`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('Payment failed')
  }
}

export async function getJob(token: string, jobId: number): Promise<Job> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('Failed to get job')
  }
  return response.json()
}

export async function getMyJobs(token: string): Promise<Job[]> {
  const response = await fetch(`${API_BASE_URL}/customer/jobs`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('Failed to get jobs')
  }
  return response.json()
}

export async function getPendingExtensionRequest(token: string, jobId: number): Promise<TimeExtensionRequest | null> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/extension-requests`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error('Failed to get extension request')
  }
  return response.json()
}

export async function approveExtension(token: string, requestId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/extension-requests/${requestId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('Failed to approve extension')
  }
}

export async function declineExtension(token: string, requestId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/extension-requests/${requestId}/decline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('Failed to decline extension')
  }
}

export async function uploadPhoto(token: string, photoUri: string): Promise<string> {
  // For demo: return the URI directly
  // In production: upload to S3 via backend
  return photoUri
}
