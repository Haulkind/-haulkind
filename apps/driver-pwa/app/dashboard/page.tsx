'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { setOnlineStatus, getAvailableOrders, getMyOrders, acceptOrder, rejectOrder, getProfile, type Order } from '@/lib/api'
import dynamic from 'next/dynamic'
import Sidebar from '@/components/Sidebar'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

const POLL_INTERVAL = 10000

type OrderTab = 'today' | 'all' | 'new'

export default function DashboardPage() {
  const router = useRouter()
  const { token, driver, isLoading, updateDriver } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [statusLoaded, setStatusLoaded] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [availableOrders, setAvailableOrders] = useState<Order[]>([])
  const [todayOrders, setTodayOrders] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<OrderTab>('all')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isLoading && !token) router.replace('/login')
  }, [token, isLoading, router])

  // Start GPS tracking
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
      },
      (err) => console.warn('GPS error:', err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // Fetch profile on mount to get real name, selfie, and online status
  useEffect(() => {
    if (!token) return
    getProfile(token).then(data => {
      if (data.driver) {
        // Map camelCase from backend to snake_case for PWA Driver interface
        const d = data.driver as any
        const mapped: any = {
          ...d,
          first_name: d.first_name || d.firstName || '',
          last_name: d.last_name || d.lastName || '',
          selfie_url: d.selfie_url || d.selfieUrl || null,
          is_online: d.is_online !== undefined ? d.is_online : d.isOnline,
          is_active: d.is_active !== undefined ? d.is_active : d.isActive,
          driver_status: d.driver_status || d.driverStatus || 'pending_review',
        }
        updateDriver(mapped)
        const online = mapped.is_online === true
        setIsOnline(online)
      }
      setStatusLoaded(true)
    }).catch(() => setStatusLoaded(true))
  }, [token])

  // Poll for orders when online
  useEffect(() => {
    if (isOnline && token) {
      fetchAllData()
      pollRef.current = setInterval(fetchAllData, POLL_INTERVAL)
    } else {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [isOnline, token])

  // Fetch orders on mount
  useEffect(() => {
    if (token) {
      fetchTodayOrders()
      fetchAllOrders()
    }
  }, [token])

  const fetchAllData = useCallback(async () => {
    if (!token) return
    try {
      const [available, today, all] = await Promise.all([
        getAvailableOrders(token).catch(() => ({ orders: [] as Order[] })),
        getMyOrders(token, 'today').catch(() => ({ orders: [] as Order[] })),
        getMyOrders(token, 'all').catch(() => ({ orders: [] as Order[] })),
      ])
      setAvailableOrders(available.orders || [])
      setTodayOrders(today.orders || [])
      setAllOrders(all.orders || [])
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

  const fetchAllOrders = useCallback(async () => {
    if (!token) return
    try {
      const data = await getMyOrders(token, 'all')
      setAllOrders(data.orders || [])
    } catch (err) {
      console.error('Fetch all orders error:', err)
    }
  }, [token])

  const toggleOnline = async () => {
    if (!token) return
    setToggling(true)
    try {
      await setOnlineStatus(token, !isOnline, lat || undefined, lng || undefined)
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
      setAllOrders(prev => prev.filter(o => String(o.id) !== String(orderId)))
      await fetchAllData()
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
      <div className="flex items-center justify-center min-h-screen bg-primary-900">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const nearbyCount = availableOrders.length

  // Get current tab orders
  // "All" tab = my assigned orders (today + scheduled), "New" = available unassigned, "Today" = today's assigned
  // Filter out orders that are already accepted/en_route/in_progress from "New" available tab
  const filteredAvailable = availableOrders.filter(o => {
    const s = o.status?.toLowerCase()
    return s === 'pending' || s === 'dispatching'
  })
  const currentOrders = tab === 'today' ? todayOrders : tab === 'new' ? filteredAvailable : allOrders

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Map (full screen) */}
      <MapView lat={lat} lng={lng} />

      {/* Top bar overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-primary-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 pt-12 pb-3">
          {/* Hamburger menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-1"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Title + order count */}
          <div className="text-white text-center">
            <h1 className="text-lg font-bold leading-tight">Haulkind</h1>
            <p className="text-xs text-primary-200">{nearbyCount} orders nearby</p>
          </div>

          {/* Online toggle */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${isOnline ? 'text-green-400' : 'text-gray-400'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
            <button
              onClick={toggleOnline}
              disabled={toggling}
              className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                isOnline ? 'bg-green-500' : 'bg-gray-500'
              } disabled:opacity-50`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                  isOnline ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-white rounded-t-2xl shadow-2xl" style={{ maxHeight: '45vh' }}>
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Tab bar */}
        <div className="flex items-center px-4 pb-2 gap-2">
          {(['today', 'all', 'new'] as OrderTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                tab === t
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">Within 80 mi</span>
        </div>

        {/* Orders list */}
        <div className="overflow-y-auto px-4 pb-8" style={{ maxHeight: '32vh' }}>
          {currentOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg font-bold text-gray-900">
                {tab === 'new' && !isOnline ? 'Go online to see new orders' : 'No orders nearby'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {tab === 'new' ? 'Orders within 80 miles will appear here' : 'Check back soon'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusColor(order.status)}`}>
                        {order.status?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {order.service_type || order.serviceType || 'HAUL_AWAY'}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      ${formatPayout(order)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 truncate">
                    {order.pickup_address || order.pickupAddress || 'Address not available'}
                  </p>
                  {order.customer_name && (
                    <p className="text-xs text-gray-500 mt-1">Customer: {order.customer_name}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{formatTime(order)}</p>

                  {/* Action buttons for new/available orders */}
                  {tab === 'new' && (
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={() => handleReject(String(order.id))}
                        disabled={loading}
                        className="flex-1 py-2.5 border-2 border-red-500 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAccept(String(order.id))}
                        disabled={loading}
                        className="flex-[2] py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition disabled:opacity-50"
                      >
                        Accept Order
                      </button>
                    </div>
                  )}

                  {/* Tap to view for today/all orders */}
                  {tab !== 'new' && (
                    <button
                      onClick={() => router.push(`/orders/${order.id}`)}
                      className="w-full mt-3 py-2 text-sm text-primary-600 font-semibold hover:bg-primary-50 rounded-lg transition"
                    >
                      View Details
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function statusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'completed': return 'bg-green-100 text-green-700'
    case 'cancelled': return 'bg-red-100 text-red-700'
    case 'in_progress':
    case 'started':
    case 'en_route':
    case 'arrived': return 'bg-blue-100 text-blue-700'
    case 'accepted':
    case 'assigned': return 'bg-secondary-100 text-secondary-700'
    case 'pending': return 'bg-yellow-100 text-yellow-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function formatPayout(order: Order): string {
  // Backend applyDriverCommission already applies 70% to estimated_price
  // So we show estimated_price DIRECTLY — do NOT multiply by 0.7 again
  const ep = (order as any).estimated_price
  if (ep && Number(ep) > 0) {
    return Number(ep).toFixed(2)
  }
  // Check driver_earnings (pre-calculated by backend)
  if (order.driver_earnings && Number(order.driver_earnings) > 0) {
    return Number(order.driver_earnings).toFixed(2)
  }
  // Check payout field
  if (order.payout && Number(order.payout) > 0) {
    return Number(order.payout).toFixed(2)
  }
  // Check driver_earnings_cents (cents format)
  const cents = order.driver_earnings_cents
  if (cents && cents > 0) return (cents / 100).toFixed(2)
  // Fallback: price/total are already 70% from backend
  const price = order.price || order.total || 0
  if (Number(price) > 0) return Number(price).toFixed(2)
  return '0.00'
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
