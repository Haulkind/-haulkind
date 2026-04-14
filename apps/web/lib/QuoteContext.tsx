'use client'

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'

const STORAGE_KEY = 'hk_quote_context'

interface QuoteData {
  // Service
  serviceType: 'HAUL_AWAY' | 'LABOR_ONLY' | null
  
  // Customer Info
  customerName: string
  customerPhone: string
  customerEmail: string
  
  // Location & Time
  pickupAddress: string
  pickupLat: number | null
  pickupLng: number | null
  serviceAreaId: number | null
  serviceAreaName: string
  scheduledFor: string
  serviceDate: string
  timeWindow: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ALL_DAY'
  asap: boolean
  preferredDateTime: string
  
  // Haul Away specific
  volumeTier: string
  addons: string[]
  photoUrls: string[]
  
  // Calculator items (QuoteKind)
  selectedItemDetails: Array<{ id: string; name: string; price: number; quantity?: number }>
  calculatorPrice: number | null
  discountPercent: number
  discountAmount: number
  
  // Labor Only specific
  helperCount: number
  estimatedHours: number
  
  // Common
  customerNotes: string
  
  // Quote result
  quoteData: any | null
  jobId: string | null
}

interface QuoteContextType {
  data: QuoteData
  updateData: (updates: Partial<QuoteData>) => void
  resetData: () => void
}

const initialData: QuoteData = {
  serviceType: null,
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  pickupAddress: '',
  pickupLat: null,
  pickupLng: null,
  serviceAreaId: null,
  serviceAreaName: '',
  scheduledFor: '',
  serviceDate: '',
  timeWindow: 'ALL_DAY',
  asap: false,
  preferredDateTime: '',
  volumeTier: '',
  addons: [],
  photoUrls: [],
  selectedItemDetails: [],
  calculatorPrice: null,
  discountPercent: 0,
  discountAmount: 0,
  helperCount: 1,
  estimatedHours: 2,
  customerNotes: '',
  quoteData: null,
  jobId: null,
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined)

function loadFromStorage(): QuoteData {
  if (typeof window === 'undefined') return initialData
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...initialData, ...parsed }
    }
  } catch (e) {
    console.warn('[QuoteContext] Failed to load from sessionStorage:', e)
  }
  return initialData
}

function saveToStorage(data: QuoteData) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('[QuoteContext] Failed to save to sessionStorage:', e)
  }
}

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<QuoteData>(initialData)
  const initialized = useRef(false)

  // Hydrate from sessionStorage on mount (client-side only)
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      const stored = loadFromStorage()
      setData(stored)
    }
  }, [])

  // Persist to sessionStorage on every data change (skip initial render)
  useEffect(() => {
    if (initialized.current) {
      saveToStorage(data)
    }
  }, [data])

  const updateData = (updates: Partial<QuoteData>) => {
    setData(prev => {
      const next = { ...prev, ...updates }
      return next
    })
  }

  const resetData = () => {
    setData(initialData)
    if (typeof window !== 'undefined') {
      try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
    }
  }

  return (
    <QuoteContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </QuoteContext.Provider>
  )
}

export function useQuote() {
  const context = useContext(QuoteContext)
  if (!context) {
    throw new Error('useQuote must be used within QuoteProvider')
  }
  return context
}
