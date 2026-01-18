// API client for backend integration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

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
  id: number
  serviceType: 'HAUL_AWAY' | 'LABOR_ONLY'
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
}

export interface Offer {
  jobId: number
  job: Job
  expiresAt: string
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/driver/auth/login`, {
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

export async function signup(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/driver/auth/signup`, {
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
  const response = await fetch(`${API_BASE_URL}/driver/status/online`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('Failed to go online')
  }
}

export async function goOffline(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/driver/status/offline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('Failed to go offline')
  }
}

export async function acceptOffer(token: string, jobId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/driver/offers/${jobId}/accept`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('Failed to accept offer')
  }
}

export async function declineOffer(token: string, jobId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/driver/offers/${jobId}/decline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('Failed to decline offer')
  }
}

export async function updateJobStatus(token: string, jobId: number, status: string): Promise<void> {
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

export async function uploadPhoto(token: string, jobId: number, type: string, photoUri: string): Promise<string> {
  // For demo: return the URI directly
  // In production: upload to S3 via backend
  return photoUri
}

export async function streamLocation(token: string, jobId: number, lat: number, lng: number): Promise<void> {
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
  const response = await fetch(`${API_BASE_URL}/driver/jobs/active`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error('Failed to get active job')
  }
  return response.json()
}
