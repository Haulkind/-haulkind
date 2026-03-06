'use client'

import { useState, useEffect, Suspense } from 'react'
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

function TrackingContent() {
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  const paymentStatus = searchParams.get('payment')
  
  const [status, setStatus] = useState<string>('PENDING')
  const [driver, setDriver] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInstallModal, setShowInstallModal] = useState(false)

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

  // Show PWA install modal after successful payment
  useEffect(() => {
    if (paymentStatus === 'success') {
      // Short delay so the page loads first
      const timer = setTimeout(() => setShowInstallModal(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [paymentStatus])

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
  const trackingAppUrl = `https://app.haulkind.com/track?orderId=${jobId}`

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">

        {/* Payment Success + Install App Modal (overlay) */}
        {showInstallModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-[scale-in_0.3s_ease-out]">
              {/* Green success header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center text-white">
                <div className="text-5xl mb-3">&#10003;</div>
                <h2 className="text-2xl font-bold">Payment Confirmed!</h2>
                <p className="text-green-100 mt-1">Your order has been placed successfully</p>
              </div>

              {/* Install CTA */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                    <span className="text-white text-2xl font-bold">H</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Install the Haulkind App</h3>
                    <p className="text-sm text-gray-500">Track your order in real time</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0 text-xs font-bold">&#10003;</span>
                    <span>Real-time driver tracking on the map</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0 text-xs font-bold">&#10003;</span>
                    <span>Push notifications when driver is on the way</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0 text-xs font-bold">&#10003;</span>
                    <span>Easy rebooking for future orders</span>
                  </div>
                </div>

                <a
                  href={trackingAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 bg-blue-600 text-white text-center font-bold text-lg rounded-xl hover:bg-blue-700 transition shadow-lg"
                >
                  Open Tracking App
                </a>

                <button
                  onClick={() => setShowInstallModal(false)}
                  className="block w-full py-3 mt-3 text-gray-500 text-sm font-medium hover:text-gray-700 transition"
                >
                  Continue without app
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Payment Success Banner (inline, stays after modal dismissed) */}
          {paymentStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-lg font-bold">&#10003;</span>
              </div>
              <div>
                <p className="font-bold text-green-800">Payment Successful!</p>
                <p className="text-sm text-green-700">Your order is confirmed and we&apos;re matching you with a driver.</p>
              </div>
            </div>
          )}

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

          {/* PWA Install CTA (always visible) */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl text-white shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center shrink-0">
                <span className="text-white text-2xl font-bold">H</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Download the Haulkind App</h3>
                <p className="text-sm text-blue-100 mb-4">
                  Track your driver in real time, get push notifications, and easily rebook. Free and instant — no app store needed!
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={trackingAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-white text-blue-700 font-bold rounded-lg hover:bg-blue-50 transition shadow"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Install App Now
                  </a>
                  <button
                    onClick={() => setShowInstallModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading job status...</p>
          </div>
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  )
}
