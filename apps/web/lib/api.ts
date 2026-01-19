// API client for backend integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export interface ServiceAreaResponse {
  covered: boolean
  serviceArea?: {
    id: number
    name: string
    state: string
  }
}

export interface QuoteRequest {
  serviceType: 'HAUL_AWAY' | 'LABOR_ONLY'
  serviceAreaId: number
  pickupLat: number
  pickupLng: number
  pickupAddress: string
  scheduledFor: string
  volumeTier?: string
  addons?: string[]
  helperCount?: number
  estimatedHours?: number
}

export interface QuoteResponse {
  servicePrice: number
  addonPrice: number
  distancePrice: number
  disposalIncluded: number
  total: number
  breakdown: {
    label: string
    amount: number
  }[]
}

export interface JobCreateRequest {
  serviceType: 'HAUL_AWAY' | 'LABOR_ONLY'
  serviceAreaId: number
  pickupLat: number
  pickupLng: number
  pickupAddress: string
  scheduledFor: string
  volumeTier?: string
  addons?: string[]
  helperCount?: number
  estimatedHours?: number
  customerNotes?: string
  photoUrls?: string[]
}

export interface JobResponse {
  id: number
  status: string
  total: number
}

export async function checkServiceArea(lat: number, lng: number): Promise<ServiceAreaResponse> {
  const url = `${API_BASE_URL}/service-areas/lookup?lat=${lat}&lng=${lng}`
  console.log('[API] checkServiceArea URL:', url)
  
  const response = await fetch(url)
  console.log('[API] checkServiceArea status:', response.status, response.statusText)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('[API] checkServiceArea error:', response.status, errorText)
    throw new Error(`Service area lookup failed: ${response.status} ${errorText.substring(0, 100)}`)
  }
  
  const data = await response.json()
  console.log('[API] checkServiceArea result:', data)
  return data
}

export async function getQuote(request: QuoteRequest): Promise<QuoteResponse> {
  const response = await fetch(`${API_BASE_URL}/quotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error('Quote request failed')
  }
  return response.json()
}

export async function createJob(request: JobCreateRequest): Promise<JobResponse> {
  const response = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error('Job creation failed')
  }
  return response.json()
}

export async function payJob(jobId: number, paymentMethodId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentMethodId }),
  })
  if (!response.ok) {
    throw new Error('Payment failed')
  }
  return response.json()
}

export async function getJobStatus(jobId: number): Promise<{ status: string; driver?: any }> {
  const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`)
  if (!response.ok) {
    throw new Error('Failed to get job status')
  }
  return response.json()
}
