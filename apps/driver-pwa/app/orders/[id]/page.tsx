'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import {
  getOrderDetail, startTrip, markArrived, startWork, completeOrder,
  cancelOrder, uploadOrderPhoto, streamLocation, type Order,
} from '@/lib/api'

const STATUS_FLOW = ['accepted', 'assigned', 'en_route', 'arrived', 'started', 'completed']

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { token, isLoading } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [beforeCount, setBeforeCount] = useState(0)
  const [afterCount, setAfterCount] = useState(0)
  const locationRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before')

  useEffect(() => {
    if (!isLoading && !token) router.replace('/login')
  }, [token, isLoading, router])

  const fetchOrder = useCallback(async () => {
    if (!token || !id) return
    try {
      const data = await getOrderDetail(token, id)
      setOrder(data.order)
      // Count existing photos
      if (data.order.before_photos) setBeforeCount(data.order.before_photos.length)
      if (data.order.after_photos) setAfterCount(data.order.after_photos.length)
    } catch (err) {
      console.error('Failed to load order:', err)
    } finally {
      setLoading(false)
    }
  }, [token, id])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // GPS location streaming when en_route/arrived/started
  useEffect(() => {
    const status = order?.status?.toLowerCase()
    if (token && order && ['en_route', 'arrived', 'started'].includes(status || '')) {
      // Stream location every 30 seconds
      const stream = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            streamLocation(token, String(order.id), pos.coords.latitude, pos.coords.longitude).catch(console.error)
          },
          (err) => console.warn('GPS error:', err),
          { enableHighAccuracy: true, timeout: 15000 }
        )
      }
      stream() // immediate
      locationRef.current = window.setInterval(stream, 30000)
    }
    return () => {
      if (locationRef.current) window.clearInterval(locationRef.current)
    }
  }, [token, order?.status, order?.id])

  const handleAction = async (action: string) => {
    if (!token || !order) return
    setActing(true)
    try {
      switch (action) {
        case 'start-trip':
          await startTrip(token, String(order.id))
          break
        case 'arrived':
          await markArrived(token, String(order.id))
          break
        case 'start-work':
          if (beforeCount === 0) {
            alert('Please take at least one before photo first')
            setActing(false)
            return
          }
          await startWork(token, String(order.id))
          break
        case 'complete':
          if (afterCount === 0) {
            alert('Please take at least one after photo first')
            setActing(false)
            return
          }
          await completeOrder(token, String(order.id))
          break
        case 'cancel':
          if (confirm('Are you sure you want to cancel this order?')) {
            await cancelOrder(token, String(order.id))
          } else {
            setActing(false)
            return
          }
          break
      }
      await fetchOrder()
    } catch (err: any) {
      alert(err.message || 'Action failed')
    } finally {
      setActing(false)
    }
  }

  const handlePhotoCapture = (type: 'before' | 'after') => {
    setPhotoType(type)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token || !order) return

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        await uploadOrderPhoto(token, String(order.id), photoType, base64)
        if (photoType === 'before') setBeforeCount(prev => prev + 1)
        else setAfterCount(prev => prev + 1)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      alert('Failed to upload photo')
    }
    // Reset input
    e.target.value = ''
  }

  const openNavigation = () => {
    if (!order) return
    const lat = order.pickup_lat
    const lng = order.pickup_lng
    const address = order.pickup_address || order.pickupAddress
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
    } else if (address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank')
    }
  }

  const callCustomer = () => {
    const phone = order?.customer_phone
    if (phone) window.open(`tel:${phone}`, '_self')
  }

  if (isLoading || loading || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <p className="text-gray-500 text-lg mb-4">Order not found</p>
        <button onClick={() => router.back()} className="text-primary-600 font-semibold">Go back</button>
      </div>
    )
  }

  const status = order.status?.toLowerCase() || ''
  const isCompleted = status === 'completed'
  const isCancelled = status === 'cancelled'
  const isFinished = isCompleted || isCancelled

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hidden file input for photo capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="bg-primary-900 text-white px-5 pt-14 pb-5">
        <button onClick={() => router.back()} className="text-primary-200 text-sm mb-2">
          ← Back
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">Order #{String(order.id).slice(0, 8)}</h1>
            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded ${statusBadge(status)}`}>
              {status.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-400">${formatPayout(order)}</p>
            <p className="text-xs text-primary-300">Your earnings</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      {!isFinished && (
        <div className="flex bg-white border-b border-gray-200">
          {(status === 'accepted' || status === 'assigned' || status === 'en_route') && (
            <button onClick={openNavigation} className="flex-1 py-3 text-center text-sm font-semibold text-primary-600 border-r border-gray-200">
              🗺️ Navigate
            </button>
          )}
          {order.customer_phone && (
            <button onClick={callCustomer} className="flex-1 py-3 text-center text-sm font-semibold text-primary-600">
              📞 Call Customer
            </button>
          )}
        </div>
      )}

      {/* Order Info */}
      <div className="px-5 py-4 space-y-4">
        {/* Details Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Order Details</h3>
          <InfoRow label="Type" value={order.service_type || order.serviceType || 'Junk Removal'} />
          <InfoRow label="Address" value={order.pickup_address || order.pickupAddress || 'N/A'} />
          <InfoRow label="Scheduled" value={formatDate(order)} />
          {order.time_window && <InfoRow label="Window" value={order.time_window} />}
          {order.volume_tier && <InfoRow label="Volume" value={order.volume_tier} />}
          {order.estimated_hours && <InfoRow label="Est. Hours" value={`${order.estimated_hours}h`} />}
          {order.customer_name && <InfoRow label="Customer" value={order.customer_name} />}
          {order.customer_notes && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs font-semibold text-yellow-800 mb-1">Customer Notes:</p>
              <p className="text-sm text-yellow-900">{order.customer_notes}</p>
            </div>
          )}
        </div>

        {/* Photos Section */}
        {!isFinished && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Photos</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Before Photos ({beforeCount})</span>
                <button
                  onClick={() => handlePhotoCapture('before')}
                  className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 active:bg-gray-200"
                >
                  📷 Take Photo
                </button>
              </div>

              {['started'].includes(status) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">After Photos ({afterCount})</span>
                  <button
                    onClick={() => handlePhotoCapture('after')}
                    className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 active:bg-gray-200"
                  >
                    📷 Take Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Progress */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Progress</h3>
          <div className="space-y-2">
            {STATUS_FLOW.map((s, i) => {
              const currentIdx = STATUS_FLOW.indexOf(status)
              const isDone = i <= currentIdx
              const isCurrent = s === status
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm ${isDone ? 'text-green-700 font-medium' : isCurrent ? 'text-primary-700 font-medium' : 'text-gray-400'}`}>
                    {s.replace(/_/g, ' ').charAt(0).toUpperCase() + s.replace(/_/g, ' ').slice(1)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        {!isFinished && (
          <div className="space-y-3 pb-4">
            {getNextAction(status) && (
              <button
                onClick={() => handleAction(getNextAction(status)!)}
                disabled={acting}
                className="w-full py-4 bg-green-600 text-white rounded-xl text-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
              >
                {acting ? 'Processing...' : getActionLabel(status)}
              </button>
            )}

            {!isFinished && status !== 'completed' && (
              <button
                onClick={() => handleAction('cancel')}
                disabled={acting}
                className="w-full py-3 border-2 border-red-500 text-red-500 rounded-xl font-semibold hover:bg-red-50 transition disabled:opacity-50"
              >
                Cancel Order
              </button>
            )}
          </div>
        )}

        {/* Completed state */}
        {isCompleted && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 text-center">
            <p className="text-4xl mb-2">✅</p>
            <p className="text-green-800 font-bold text-lg">Order Completed</p>
            <p className="text-green-600 text-sm mt-1">Earnings will be added to your balance</p>
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 text-center">
            <p className="text-4xl mb-2">❌</p>
            <p className="text-red-800 font-bold text-lg">Order Cancelled</p>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
    </div>
  )
}

function getNextAction(status: string): string | null {
  switch (status) {
    case 'accepted':
    case 'assigned': return 'start-trip'
    case 'en_route': return 'arrived'
    case 'arrived': return 'start-work'
    case 'started': return 'complete'
    default: return null
  }
}

function getActionLabel(status: string): string {
  switch (status) {
    case 'accepted':
    case 'assigned': return '🚗 Start Trip'
    case 'en_route': return '📍 I\'ve Arrived'
    case 'arrived': return '🔨 Start Work'
    case 'started': return '✅ Complete Order'
    default: return 'Next Step'
  }
}

function statusBadge(status: string): string {
  switch (status) {
    case 'completed': return 'bg-green-800 text-green-100'
    case 'cancelled': return 'bg-red-800 text-red-100'
    case 'en_route':
    case 'arrived':
    case 'started': return 'bg-blue-800 text-blue-100'
    default: return 'bg-primary-800 text-primary-100'
  }
}

function formatPayout(order: Order): string {
  const cents = order.driver_earnings_cents || order.driver_earnings
  if (cents && cents > 100) return (cents / 100).toFixed(2)
  if (order.payout) return order.payout.toFixed(2)
  if (order.driver_earnings) return order.driver_earnings.toFixed(2)
  const price = order.price || order.total || 0
  return (price * 0.7).toFixed(2)
}

function formatDate(order: Order): string {
  const d = order.scheduled_for || order.scheduledFor
  if (!d) return 'N/A'
  try {
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    })
  } catch { return 'N/A' }
}
