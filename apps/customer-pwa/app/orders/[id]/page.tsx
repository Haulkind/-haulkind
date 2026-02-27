'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getOrderDetail } from '@/lib/api'
import { getToken, isLoggedIn } from '@/lib/auth'
import StatusTimeline from '@/components/StatusTimeline'

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/auth'); return }
    loadOrder()
    const interval = setInterval(loadOrder, 10000)
    return () => clearInterval(interval)
  }, [orderId])

  const loadOrder = async () => {
    const token = getToken()
    if (!token) return
    try {
      const data = await getOrderDetail(token, orderId)
      if (data.error) { setError(data.error); return }
      setOrder(data.order)
    } catch {
      setError('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-xl font-bold mb-2">Order Not Found</h1>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={() => router.back()} className="text-primary-600 font-medium">Go Back</button>
        </div>
      </div>
    )
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
      {/* Header */}
      <div className="bg-white border-b px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-primary-600 font-medium text-sm mb-2">
          ← Back
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
            {order.status?.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Service Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">Service Information</h2>
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
                <span className="text-gray-500">Scheduled</span>
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
              <span className="text-gray-500">Price</span>
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

        {/* Driver Location Map Placeholder */}
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

        {/* Status Timeline */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">Progress</h2>
          <StatusTimeline currentStatus={order.status} />
        </div>

        {/* Notes */}
        {order.description && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-2">Notes</h2>
            <p className="text-sm text-gray-600">{order.description}</p>
          </div>
        )}

        {/* Order ID */}
        <div className="text-center text-xs text-gray-400 py-4">
          Order ID: {order.id}
        </div>
      </div>
    </div>
  )
}
