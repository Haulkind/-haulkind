// API client for backend integration
// HARDCODED URL - DO NOT CHANGE
const API_BASE_URL = 'https://haulkind-production-285b.up.railway.app'


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
