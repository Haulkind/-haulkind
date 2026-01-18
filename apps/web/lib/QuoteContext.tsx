'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface QuoteData {
  // Service
  serviceType: 'HAUL_AWAY' | 'LABOR_ONLY' | null
  
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
  
  // Labor Only specific
  helperCount: number
  estimatedHours: number
  
  // Common
  customerNotes: string
  
  // Quote result
  quoteData: any | null
  jobId: number | null
}

interface QuoteContextType {
  data: QuoteData
  updateData: (updates: Partial<QuoteData>) => void
  resetData: () => void
}

const initialData: QuoteData = {
  serviceType: null,
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
  helperCount: 1,
  estimatedHours: 2,
  customerNotes: '',
  quoteData: null,
  jobId: null,
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined)

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<QuoteData>(initialData)

  const updateData = (updates: Partial<QuoteData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const resetData = () => {
    setData(initialData)
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
