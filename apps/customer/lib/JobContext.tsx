import React, { createContext, useContext, useState, ReactNode } from 'react'

interface JobData {
  serviceType?: 'HAUL_AWAY' | 'LABOR_ONLY'
  pickupAddress?: string
  pickupLat?: number
  pickupLng?: number
  scheduledFor?: string
  volumeTier?: string
  addons?: string[]
  helperCount?: number
  estimatedHours?: number
  customerNotes?: string
  photoUrls?: string[]
}

interface JobContextType {
  jobData: JobData
  updateJobData: (data: Partial<JobData>) => void
  resetJobData: () => void
}

const JobContext = createContext<JobContextType | undefined>(undefined)

export function JobProvider({ children }: { children: ReactNode }) {
  const [jobData, setJobData] = useState<JobData>({})

  const updateJobData = (data: Partial<JobData>) => {
    setJobData(prev => ({ ...prev, ...data }))
  }

  const resetJobData = () => {
    setJobData({})
  }

  return (
    <JobContext.Provider value={{ jobData, updateJobData, resetJobData }}>
      {children}
    </JobContext.Provider>
  )
}

export function useJob() {
  const context = useContext(JobContext)
  if (!context) {
    throw new Error('useJob must be used within JobProvider')
  }
  return context
}
