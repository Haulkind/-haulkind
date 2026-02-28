'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackOrder } from '@/lib/api'
import StatusTimeline from '@/components/StatusTimeline'
import { subscribeToPush } from '@/lib/push'

function TrackContent() {
  const searchParams = useSearchParams()
  const tokenParam = searchParams.get('token')
  const orderIdParam = searchParams.get('orderId')

  const [trackInput, setTrackInput] = useState(tokenParam || orderIdParam || '')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pushEnabled, setPushEnabled] = useState(false)

  useEffect(() => {
    if (tokenParam || orderIdParam) {
      doTrack(tokenParam || undefined, orderIdParam || undefined)
    }
  }, [tokenParam, orderIdParam])

  // Auto-refresh when tracking an order
  useEffect(() => {
    if (!order) return
    const interval = setInterval(() => {
      doTrack(order.tracking_token || undefined, order.id || undefined)
    }, 10000)
    return () => clearInterval(interval)
  }, [order])

  const doTrack = async (token?: string, orderId?: string) => {
    setLoading(true)
    setError('')
    try {
      const data = await trackOrder({ token, orderId })
      if (data.error) {
        setError(data.error)
        setOrder(null)
      } else {
        setOrder(data.order)
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackInput.trim()) return
    // Strip leading # if present (e.g. "#44843f52-...")
    const cleaned = trackInput.trim().replace(/^#/, '')
    // If it looks like a UUID, search by orderId; otherwise by token
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(cleaned)
    if (isUuid) {
      doTrack(undefined, cleaned)
    } else {
      doTrack(cleaned, undefined)
    }
  }

  const handleEnablePush = async () => {
    const success = await subscribeToPush(order?.id)
    setPushEnabled(success)
  }

  const formatTimeWindow = (tw: string) => {
    if (tw === 'ALL_DAY') return 'All Day (8AM - 8PM)'
    if (tw === 'MORNING') return 'Morning (8AM - 12PM)'
    if (tw === 'AFTERNOON') return 'Afternoon (12PM - 4PM)'
    if (tw === 'EVENING') return 'Evening (4PM - 8PM)'
    return tw || ''
  }

  const statusColor = (s: string) => {
    if (s === 'completed') return 'bg-green-100 text-green-700'
    if (s === 'cancelled') return 'bg-red-100 text-red-700'
    if (['assigned', 'in_progress', 'en_route'].includes(s)) return 'bg-blue-100 text-blue-700'
    return 'bg-yellow-100 text-yellow-700'
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-primary-600 px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">Track Your Order</h1>
        <p className="text-primary-200 mt-1">Enter your tracking code or order ID</p>
      </div>

      {/* Search Form */}
      <div className="px-4 -mt-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={trackInput}
              onChange={e => setTrackInput(e.target.value)}
              placeholder="Tracking code or Order ID..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none font-mono text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? '...' : 'Track'}
            </button>
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 mt-4">
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">{error}</div>
        </div>
      )}

      {/* Order Details */}
      {order && (
        <div className="px-4 mt-4 space-y-4">
          {/* Status Banner */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">Order Status</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
                {order.status?.toUpperCase()}
              </span>
            </div>
            <StatusTimeline currentStatus={order.status} />
          </div>

          {/* Service Info */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3">Service Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium">{order.service_type === 'LABOR_ONLY' ? 'Labor Only' : 'Haul Away'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Address</span>
                <span className="font-medium text-right max-w-48 truncate">{order.pickup_address || 'N/A'}</span>
              </div>
              {order.scheduled_for && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">{new Date(order.scheduled_for).toLocaleDateString()}</span>
                </div>
              )}
              {order.pickup_time_window && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Time Window</span>
                  <span className="font-medium">{formatTimeWindow(order.pickup_time_window)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-lg text-primary-600">
                  ${Number(order.estimated_price || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Driver Info */}
          {order.driver && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-3">Your Driver</h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg">
                  {order.driver.name?.charAt(0) || 'D'}
                </div>
                <div>
                  <p className="font-medium">{order.driver.name || 'Driver'}</p>
                  {order.driver.phone && (
                    <a href={`tel:${order.driver.phone}`} className="text-primary-600 text-sm">
                      {order.driver.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Driver Location */}
          {order.driver_location && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-3">Driver Location</h2>
              <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl mb-2">📍</div>
                  <p className="text-sm text-gray-600">
                    Last updated: {new Date(order.driver_location.updated_at).toLocaleTimeString()}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${order.driver_location.lat},${order.driver_location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 text-sm font-medium mt-2 inline-block"
                  >
                    View on Google Maps
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Push Notification CTA */}
          {!pushEnabled && order.status !== 'completed' && order.status !== 'cancelled' && (
            <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
              <h3 className="font-bold text-primary-700 mb-1">Get Notified</h3>
              <p className="text-sm text-primary-600 mb-3">
                Receive updates when your driver is assigned, en route, and arrives.
              </p>
              <button
                onClick={handleEnablePush}
                className="w-full py-2 bg-primary-600 text-white rounded-lg font-medium text-sm"
              >
                Enable Notifications
              </button>
            </div>
          )}

          {pushEnabled && (
            <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm text-center">
              Notifications enabled! You will be notified of status changes.
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!order && !error && !loading && !tokenParam && !orderIdParam && (
        <div className="px-4 mt-8 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-500">Enter your tracking code to see your order status</p>
        </div>
      )}
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    }>
      <TrackContent />
    </Suspense>
  )
}
