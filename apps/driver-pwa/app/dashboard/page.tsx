'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { setOnlineStatus, getAvailableOrders, getMyOrders, acceptOrder, rejectOrder, type Order } from '@/lib/api'

const POLL_INTERVAL = 10000

export default function DashboardPage() {
  const router = useRouter()
  const { token, driver, isLoading, logout } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [availableOrders, setAvailableOrders] = useState<Order[]>([])
  const [todayOrders, setTodayOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isLoading && !token) router.replace('/login')
  }, [token, isLoading, router])

  // Poll for orders when online
  useEffect(() => {
    if (isOnline && token) {
      fetchOrders()
      pollRef.current = setInterval(fetchOrders, POLL_INTERVAL)
    } else {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [isOnline, token])

  // Fetch today orders on mount
  useEffect(() => {
    if (token) fetchTodayOrders()
  }, [token])

  const fetchOrders = useCallback(async () => {
    if (!token) return
    try {
      const data = await getAvailableOrders(token)
      setAvailableOrders(data.orders || [])
    } catch (err) {
      console.error('Fetch orders error:', err)
    }
  }, [token])

  const fetchTodayOrders = useCallback(async () => {
    if (!token) return
    try {
      const data = await getMyOrders(token, 'today')
      setTodayOrders(data.orders || [])
    } catch (err) {
      console.error('Fetch today orders error:', err)
    }
  }, [token])

  const toggleOnline = async () => {
    if (!token) return
    setToggling(true)
    try {
      // Get GPS location for going online
      let lat: number | undefined
      let lng: number | undefined
      if (!isOnline && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
          )
          lat = pos.coords.latitude
          lng = pos.coords.longitude
        } catch (e) {
          console.warn('GPS not available:', e)
        }
      }
      await setOnlineStatus(token, !isOnline, lat, lng)
      setIsOnline(!isOnline)
      if (isOnline) setAvailableOrders([])
    } catch (err) {
      alert('Failed to update status')
    } finally {
      setToggling(false)
    }
  }

  const handleAccept = async (orderId: string) => {
    if (!token) return
    setLoading(true)
    try {
      await acceptOrder(token, orderId)
      setAvailableOrders(prev => prev.filter(o => String(o.id) !== String(orderId)))
      await fetchTodayOrders()
      router.push(`/orders/${orderId}`)
    } catch (err: any) {
      alert(err.message || 'Failed to accept order')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (orderId: string) => {
    if (!token) return
    try {
      await rejectOrder(token, orderId)
      setAvailableOrders(prev => prev.filter(o => String(o.id) !== String(orderId)))
    } catch (err) {
      alert('Failed to reject order')
    }
  }

  if (isLoading || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const driverName = driver?.first_name || driver?.name || 'Driver'

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-primary-900 text-white px-5 pt-14 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-200 text-sm">Welcome back</p>
            <h1 className="text-2xl font-bold">{driverName}</h1>
          </div>
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
        </div>

        {/* Online/Offline Toggle */}
        <button
          onClick={toggleOnline}
          disabled={toggling}
          className={`w-full py-4 rounded-xl text-lg font-bold transition ${
            isOnline
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          } disabled:opacity-50`}
        >
          {toggling ? 'Updating...' : isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* Active/Today Orders */}
      {todayOrders.length > 0 && (
        <div className="px-5 mt-5">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Today&apos;s Orders</h2>
          <div className="space-y-3">
            {todayOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => router.push(`/orders/${order.id}`)}
                className="w-full bg-white rounded-xl p-4 border-2 border-secondary-400 shadow-sm text-left"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-secondary-700 bg-secondary-100 px-2 py-0.5 rounded">
                    {order.status?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    ${formatPayout(order)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 truncate">{order.pickup_address || order.pickupAddress}</p>
                <p className="text-xs text-gray-400 mt-1">{formatTime(order)}</p>
                <p className="text-xs text-primary-600 font-semibold mt-2">Tap to view details →</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Available Orders (when online) */}
      {isOnline && (
        <div className="px-5 mt-5">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            {availableOrders.length > 0
              ? `${availableOrders.length} Available Order${availableOrders.length > 1 ? 's' : ''}`
              : 'Waiting for orders...'}
          </h2>
          {availableOrders.length === 0 && (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <p className="text-4xl mb-3">👀</p>
              <p className="text-gray-500">Looking for jobs nearby...</p>
              <p className="text-xs text-gray-400 mt-1">Orders refresh every 10 seconds</p>
            </div>
          )}
          <div className="space-y-3">
            {availableOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl p-4 border-2 border-primary-500 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-semibold text-primary-700 bg-primary-100 px-2 py-0.5 rounded">
                    {order.service_type || order.serviceType || 'HAUL_AWAY'}
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    ${formatPayout(order)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-1">{order.pickup_address || order.pickupAddress}</p>
                <p className="text-xs text-gray-400 mb-3">{formatTime(order)}</p>
                {order.customer_name && (
                  <p className="text-xs text-gray-500 mb-3">Customer: {order.customer_name}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReject(String(order.id))}
                    disabled={loading}
                    className="flex-1 py-3 border-2 border-red-500 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAccept(String(order.id))}
                    disabled={loading}
                    className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition disabled:opacity-50"
                  >
                    Accept Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline state */}
      {!isOnline && todayOrders.length === 0 && (
        <div className="px-5 mt-12 text-center">
          <p className="text-5xl mb-4">🚛</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">You&apos;re Offline</h2>
          <p className="text-gray-500 max-w-xs mx-auto">
            Go online to start receiving job offers from customers in your area.
          </p>
        </div>
      )}
    </div>
  )
}

function formatPayout(order: Order): string {
  const cents = order.driver_earnings_cents || order.driver_earnings
  if (cents && cents > 100) return (cents / 100).toFixed(2)
  if (order.payout) return order.payout.toFixed(2)
  if (order.driver_earnings) return order.driver_earnings.toFixed(2)
  const price = order.price || order.total || 0
  return (price * 0.7).toFixed(2) // 70% driver share
}

function formatTime(order: Order): string {
  const d = order.scheduled_for || order.scheduledFor
  if (!d) return ''
  try {
    const date = new Date(d)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' · ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } catch {
    return ''
  }
}
