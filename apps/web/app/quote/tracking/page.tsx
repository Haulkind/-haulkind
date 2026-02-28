'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { getJobStatus } from '@/lib/api'
import Link from 'next/link'

const STATUS_MESSAGES = {
  PENDING: {
    title: 'Matching you with a local driver...',
    description: 'We are finding the best available driver in your area.',
    icon: '🔍',
  },
  ASSIGNED: {
    title: 'Driver Assigned!',
    description: 'Your driver has accepted the job and will be on their way soon.',
    icon: '✅',
  },
  EN_ROUTE: {
    title: 'Driver En Route',
    description: 'Your driver is on the way to your location.',
    icon: '🚗',
  },
  ARRIVED: {
    title: 'Driver Arrived',
    description: 'Your driver has arrived at your location.',
    icon: '📍',
  },
  STARTED: {
    title: 'Job In Progress',
    description: 'Your driver is working on your job.',
    icon: '🔨',
  },
  COMPLETED: {
    title: 'Job Completed',
    description: 'Your job has been completed successfully!',
    icon: '🎉',
  },
}

export default function TrackingPage() {
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  
  const [status, setStatus] = useState<string>('PENDING')
  const [driver, setDriver] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!jobId) {
      setError('No job ID provided')
      setLoading(false)
      return
    }

    fetchStatus()
    
    // Poll for status updates every 5 seconds
    const interval = setInterval(fetchStatus, 5000)
    
    return () => clearInterval(interval)
  }, [jobId])

  const fetchStatus = async () => {
    try {
      if (!jobId) return
      const data = await getJobStatus(jobId)
      setStatus(data.status)
      setDriver(data.driver)
      setLoading(false)
    } catch (err) {
      setError('Failed to get job status')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job status...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="text-primary-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = STATUS_MESSAGES[status as keyof typeof STATUS_MESSAGES] || STATUS_MESSAGES.PENDING

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Status Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{statusInfo.icon}</div>
            <h1 className="text-3xl font-bold mb-2">{statusInfo.title}</h1>
            <p className="text-gray-600">{statusInfo.description}</p>
          </div>

          {/* Job ID */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">Job ID</p>
            <p className="text-lg font-mono font-bold">#{jobId}</p>
          </div>

          {/* Driver Info */}
          {driver && (
            <div className="mb-8 p-6 border-2 border-primary-200 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Your Driver</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {driver.name?.charAt(0) || 'D'}
                </div>
                <div>
                  <p className="font-bold text-lg">{driver.name || 'Driver'}</p>
                  <p className="text-gray-600">{driver.vehicle || 'Vehicle info'}</p>
                  {driver.phone && (
                    <p className="text-primary-600">{driver.phone}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Job Progress</h2>
            <div className="space-y-4">
              {Object.entries(STATUS_MESSAGES).map(([key, value], index) => {
                const isActive = key === status
                const isPast = Object.keys(STATUS_MESSAGES).indexOf(key) < Object.keys(STATUS_MESSAGES).indexOf(status)
                
                return (
                  <div key={key} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isPast || isActive ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isPast ? '✓' : index + 1}
                    </div>
                    <div className={`flex-1 ${isActive ? 'font-bold' : ''}`}>
                      <p className={isActive ? 'text-primary-600' : 'text-gray-600'}>{value.title}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            {status === 'COMPLETED' ? (
              <Link href="/" className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition text-center">
                Book Another Job
              </Link>
            ) : (
              <div className="flex-1 text-center text-gray-600">
                <p className="text-sm">Updates will appear automatically</p>
                <p className="text-xs text-gray-500 mt-1">Refreshing every 5 seconds...</p>
              </div>
            )}
          </div>

          {/* PWA Install Prompt */}
          <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white text-xl font-bold">H</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Track orders on the go</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Install the Haulkind app on your phone for real-time tracking, push notifications, and easy rebooking.
                </p>
                <div className="flex gap-2">
                  <a
                    href={`https://app.haulkind.com/track?orderId=${jobId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                  >
                    Open Tracking App
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
