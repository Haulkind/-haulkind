// API client for backend integration
// All API calls go through Next.js API route proxies to avoid CORS issues

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
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  timeWindow?: string
}

export interface JobResponse {
  id: string
  status: string
  total: number
}

export interface CheckoutSessionResponse {
  success: boolean
  sessionId: string
  url: string
  totalCents: number
  platformFeeCents: number
  driverEarningsCents: number
}

export async function checkServiceArea(lat: number, lng: number, state?: string): Promise<ServiceAreaResponse> {
  const stateParam = state ? `&state=${encodeURIComponent(state)}` : '';
  const url = `/api/service-area-lookup?lat=${lat}&lng=${lng}${stateParam}`
  console.log('[API] checkServiceArea URL:', url)
  
  const response = await fetch(url)
  console.log('[API] checkServiceArea status:', response.status, response.statusText)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    console.error('[API] checkServiceArea error:', response.status, errorData)
    throw new Error(errorData.error || `Service area lookup failed: ${response.status}`)
  }
  
  const data = await response.json()
  console.log('[API] checkServiceArea result:', data)
  return data
}

export async function getQuote(request: QuoteRequest): Promise<QuoteResponse> {
  console.log('[API] getQuote request:', JSON.stringify(request))
  const response = await fetch('/api/quotes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  console.log('[API] getQuote status:', response.status)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    console.error('[API] getQuote error:', errorData)
    throw new Error(errorData.error || 'Quote request failed')
  }
  const data = await response.json()
  console.log('[API] getQuote result:', data)
  return data
}

export async function createJob(request: JobCreateRequest): Promise<JobResponse> {
  console.log('[API] createJob request:', JSON.stringify(request))
  const response = await fetch('/api/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  console.log('[API] createJob status:', response.status)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    console.error('[API] createJob error:', errorData)
    throw new Error(errorData.error || 'Job creation failed')
  }
  const data = await response.json()
  console.log('[API] createJob result:', data)
  return data
}

export async function payJob(jobId: string, paymentMethodId: string): Promise<{ success: boolean }> {
  console.log('[API] payJob for job:', jobId)
  const response = await fetch(`/api/jobs/${jobId}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentMethodId }),
  })
  console.log('[API] payJob status:', response.status)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    console.error('[API] payJob error:', errorData)
    throw new Error(errorData.error || 'Payment failed')
  }
  const data = await response.json()
  console.log('[API] payJob result:', data)
  return data
}

export async function createCheckoutSession(jobId: string, successUrl: string, cancelUrl: string): Promise<CheckoutSessionResponse> {
  console.log('[API] createCheckoutSession for job:', jobId)
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jobId, successUrl, cancelUrl }),
  })
  console.log('[API] createCheckoutSession status:', response.status)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    console.error('[API] createCheckoutSession error:', errorData)
    throw new Error(errorData.error || 'Failed to create checkout session')
  }
  const data = await response.json()
  console.log('[API] createCheckoutSession result:', data)
  return data
}

export async function getJobStatus(jobId: string): Promise<{ status: string; driver?: any }> {
  console.log('[API] getJobStatus for job:', jobId)
  const response = await fetch(`/api/jobs/${jobId}`)
  console.log('[API] getJobStatus status:', response.status)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    console.error('[API] getJobStatus error:', errorData)
    throw new Error(errorData.error || 'Failed to get job status')
  }
  const data = await response.json()
  console.log('[API] getJobStatus result:', data)
  return data
}
