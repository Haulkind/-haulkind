'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { setOnlineStatus, getAvailableOrders, getMyOrders, acceptOrder, rejectOrder, getProfile, sendDriverLocation, type Order } from '@/lib/api'
import dynamic from 'next/dynamic'
import Sidebar from '@/components/Sidebar'
import DriverLogo from '@/components/DriverLogo'
import { trackDriverLocation, type LocationStatus } from '@/lib/driverLocation'
import { formatPayout } from '@/lib/driverPayout'
import { formatDistance, getOrderDistance } from '@/lib/orderLocation'
import { enableOrderAlerts } from '@/lib/notifications'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

const POLL_INTERVAL = 5000

type OrderTab = 'today' | 'all' | 'new'

// Check if a date string is today
function isToday(dateStr: string | undefined | null): boolean {
  if (!dateStr) return true
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

export default function DashboardPage() {
  const router = useRouter()
  const { token, driver, isLoading, updateDriver, logout } = useAuth()
  const [isOnline, setIsOnline] = useState(false)
  const [statusLoaded, setStatusLoaded] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [availableOrders, setAvailableOrders] = useState<Order[]>([])
  const [todayOrders, setTodayOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<OrderTab>('all')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('locating')
  const [locationAttempt, setLocationAttempt] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fetchAllDataRef = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    if (!isLoading && !token) router.replace('/login')
  }, [token, isLoading, router])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable')
      return
    }
    if (!token) return
    let stopTracking: (() => void) | undefined
    const start = () => {
      stopTracking?.()
      if (document.visibilityState !== 'visible') return
      stopTracking = trackDriverLocation(navigator.geolocation, position => {
        setLat(position.coords.latitude)
        setLng(position.coords.longitude)
        setAccuracy(position.coords.accuracy)
        sendDriverLocation(token, position.coords.latitude, position.coords.longitude, position.coords.heading, position.coords.speed)
          .catch(error => console.warn('[PWA GPS] Location sync failed:', error?.message))
      }, setLocationStatus)
    }
    start()
    document.addEventListener('visibilitychange', start)
    return () => {
      stopTracking?.()
      document.removeEventListener('visibilitychange', start)
    }
  }, [token, locationAttempt])

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
    }).catch((err: any) => {
      if (err.status === 401) {
        logout()
        router.replace('/login')
      }
      setStatusLoaded(true)
    })
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

  // Re-fetch immediately when page/tab becomes visible (handles returning from cancel, app switch, etc.)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && isOnline && token) {
        fetchAllDataRef.current?.()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [isOnline, token])

  const fetchAllData = useCallback(async () => {
    if (!token) return
    try {
      // Only 2 API calls: available orders + driver's own orders
      // Backend ignores filter param, so one call to getMyOrders is enough
      const [available, myOrders] = await Promise.all([
        getAvailableOrders(token).catch(() => ({ orders: [] as Order[] })),
        getMyOrders(token, 'all').catch(() => ({ orders: [] as Order[] })),
      ])
      const newAvailable = available.orders || []
      const myOrdersList = myOrders.orders || []
      setAvailableOrders(newAvailable)
      setTodayOrders(myOrdersList)
    } catch (err) {
      console.error('Fetch orders error:', err)
    }
  }, [token])

  // Keep ref in sync so visibility/focus listeners can call latest version
  fetchAllDataRef.current = fetchAllData

  const toggleOnline = async () => {
    if (!token) return
    if (!isOnline) void enableOrderAlerts().catch(() => {})
    setToggling(true)
    try {
      await setOnlineStatus(token, !isOnline, lat ?? undefined, lng ?? undefined)
      setIsOnline(!isOnline)
      if (driver) updateDriver({ ...driver, is_online: !isOnline })
      if (isOnline) {
        setAvailableOrders([])
        setTodayOrders([])
      }
    } catch (err: any) {
      if (err.status === 401) {
        alert('Session expired. Please log in again.')
        logout()
        router.replace('/login')
      } else {
        alert(err.message || 'Failed to update status')
      }
    } finally {
      setToggling(false)
    }
  }

  const handleAccept = async (orderId: string) => {
    if (!token) return
    setLoading(true)
    try {
      await acceptOrder(token, orderId)
      // Remove from available immediately (optimistic update)
      setAvailableOrders(prev => prev.filter(o => String(o.id) !== String(orderId)))
      // Force refresh to pick up the order in my-orders lists
      fetchAllData()
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

  const nearbyOrders = availableOrders.filter(order => {
    const distance = getOrderDistance(order, lat, lng)
    return distance === null || distance <= 80
  })
  const newCount = nearbyOrders.filter(order => !order.created_at || Date.now() - new Date(order.created_at).getTime() < 86400000).length
  const todayFiltered = todayOrders.filter(o => {
    const scheduledFor = o.scheduled_for || o.scheduledFor || o.created_at
    return isToday(scheduledFor)
  })
  const currentOrders = (isOnline ? tab === 'today' ? todayFiltered : nearbyOrders : [])
    .slice().sort((a, b) => (getOrderDistance(a, lat, lng) ?? Infinity) - (getOrderDistance(b, lat, lng) ?? Infinity))

  return (
    <div className="driver-dashboard fixed inset-0 overflow-hidden flex flex-col bg-white">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="z-10 bg-primary-800 shrink-0">
        <div className="flex items-center justify-between px-4 pb-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingLeft: 'max(16px, env(safe-area-inset-left))', paddingRight: 'max(16px, env(safe-area-inset-right))' }}>
          {/* Hamburger menu */}
          <button
            aria-label="Open navigation menu"
            onClick={() => setSidebarOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center text-white"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Title + order count */}
          <div className="text-white flex-1 min-w-0 ml-3">
            <h1><DriverLogo size={40} /></h1>
            <p className="text-xs text-primary-200">{isOnline ? `${currentOrders.length} orders nearby` : "You're offline"}</p>
          </div>

          {/* Online toggle */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${isOnline ? 'text-green-400' : 'text-gray-400'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
            <button
              role="switch"
              aria-checked={isOnline}
              aria-label="Available for orders"
              onClick={toggleOnline}
              disabled={toggling}
              className="flex h-11 w-12 shrink-0 items-center rounded-full disabled:opacity-50"
            >
              <span
                aria-hidden="true"
                className={`relative block h-7 w-12 rounded-full transition-colors duration-200 ${
                  isOnline ? 'bg-green-500' : 'bg-gray-500'
                }`}
              >
                <span className={`absolute left-0.5 top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                  isOnline ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative isolate z-0 flex-1 min-h-0">
        <MapView
          lat={lat}
          lng={lng}
          accuracy={accuracy}
          orders={currentOrders}
          locationStatus={locationStatus}
          onRetryLocation={() => {
            if (locationStatus === 'denied') {
              alert('Allow location for this site in your browser settings to show your distance to orders.')
            }
            setLocationAttempt(value => value + 1)
          }}
        />
      </div>

      <div className="z-10 bg-white border-t border-gray-200 pt-3 shrink-0 flex flex-col min-h-0" style={{ maxHeight: '45%', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>

        {/* Tab bar */}
        <div className="flex items-center px-4 pb-2 gap-2 shrink-0">
          {(['today', 'all', 'new'] as OrderTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative min-h-11 px-3 py-2 rounded-full text-sm font-semibold transition ${
                tab === t
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'new' && newCount > 0 && (
                <span className="inline-flex ml-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full items-center justify-center">
                  {newCount}
                </span>
              )}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">Within 80 mi</span>
        </div>

        {/* Orders list */}
        <div className="overflow-y-auto min-h-0 pb-3">
          {currentOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg font-bold text-gray-900">
                {!isOnline ? 'Go online to see orders' : 'No orders nearby'}
              </p>
                <p className="text-sm text-gray-400 mt-1">
                  {tab === 'today' ? 'No accepted orders for today' : 'Orders within 80 miles will appear here'}
                </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-3">
              {currentOrders.map((order) => (
                <div
                  key={order.id}
                  className="w-[78vw] shrink-0 snap-start bg-white rounded-2xl p-4 border border-gray-200 shadow-md"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400">You earn:</p>
                      <span className="text-[28px] font-bold text-green-600">
                        ${formatPayout(order)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {(!order.created_at || Date.now() - new Date(order.created_at).getTime() < 86400000) && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">NEW</span>
                      )}
                      <span className="bg-blue-100 text-blue-700 rounded-xl px-2.5 py-1 text-xs font-semibold">
                        {formatDistance(getOrderDistance(order, lat, lng))}
                      </span>
                    </div>
                  </div>
                  <p className="text-base font-bold text-gray-900 mb-1">{order.service_type || order.serviceType || 'HAUL_AWAY'}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusColor(order.status)}`}>
                    {order.status?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  {order.customer_name && (
                    <p className="text-xs text-gray-500 mt-1">Customer: {order.customer_name}</p>
                  )}
                  {/* Show brief item preview from description or items_json */}
                  {(() => {
                    const desc = stripDriverPricing(order.description || order.customer_notes || '')
                    if (desc.startsWith('Items:')) {
                      const itemLine = desc.split('\n')[0].replace('Items:', '').trim()
                      if (itemLine) return <p className="text-xs text-indigo-600 mt-1 truncate">📋 {itemLine}</p>
                    }
                    const ij = order.items_json
                    if (ij) {
                      try {
                        const arr = typeof ij === 'string' ? JSON.parse(ij) : ij
                        if (Array.isArray(arr) && arr.length > 0) {
                          const names = arr.map((i: any) => {
                            if (typeof i === 'string') return i
                            const qty = i.quantity || 1
                            return qty > 1 ? `${i.name} x${qty}` : i.name
                          }).filter(Boolean).join(', ')
                          if (names) return <p className="text-xs text-indigo-600 mt-1 truncate">📋 {names}</p>
                        }
                      } catch {}
                    }
                    return desc ? <p className="text-xs text-gray-500 mt-1 truncate">{desc}</p> : null
                  })()}
                  {(() => {
                    const pu = order.photo_urls || order.photos
                    if (!pu) return null
                    let arr: string[] = []
                    try { arr = typeof pu === 'string' ? JSON.parse(pu) : pu } catch {}
                    if (Array.isArray(arr) && arr.length > 0) {
                      return <p className="text-xs text-blue-600 mt-1">📷 {arr.length} customer photo{arr.length > 1 ? 's' : ''}</p>
                    }
                    return null
                  })()}
                  <p className="text-xs text-gray-400 mt-1">{formatTime(order)}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    📍 {order.pickup_address || order.pickupAddress || 'Address not available'}
                  </p>

                          {/* Action buttons for new/available orders */}
                          {tab !== 'today' && (
                            <div className="mt-3 space-y-2">
                              <button
                                onClick={() => router.push(`/orders/${order.id}`)}
                                className="w-full py-2.5 text-sm text-white bg-blue-600 font-semibold hover:bg-blue-700 rounded-lg transition"
                              >
                                View Details
                              </button>
                              <div className="flex gap-3">
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
                            </div>
                          )}

                          {tab === 'today' && (
                            <button
                              onClick={() => router.push(`/orders/${order.id}`)}
                              className="w-full mt-3 py-2 text-sm text-primary-600 font-semibold hover:bg-primary-50 rounded-lg transition"
                            >
                              Manage Order
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

// Strip pricing info — drivers should only see items, not prices/discounts/totals
function stripDriverPricing(text: string): string {
  if (!text) return ''
  let cleaned = text.replace(/\s*\(\$[\d,.]+\)/g, '')
  cleaned = cleaned.replace(/\s*\|\s*\d+%\s*(?:per-item\s+)?discount:\s*-?\$[\d,.]+/gi, '')
  cleaned = cleaned.replace(/\s*\|\s*Total:\s*\$[\d,.]+/gi, '')
  cleaned = cleaned.replace(/\s*\|\s*$/, '').trim()
  return cleaned
}

function formatTime(order: Order): string {
  const d = order.scheduled_for || order.scheduledFor || order.created_at
  const date = d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'
  const windows: Record<string, string> = {
    ALL_DAY: 'All Day (8AM - 8PM)',
    MORNING: 'Morning (8AM - 12PM)',
    AFTERNOON: 'Afternoon (12PM - 4PM)',
    EVENING: 'Evening (4PM - 8PM)',
  }
  const windowValue = order.pickup_time_window || order.time_window || ''
  const scheduled = order.scheduled_for || order.scheduledFor
  const fallback = scheduled ? new Date(scheduled).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Any time'
  const windowLabel = windows[windowValue] || windowValue || fallback
  return `${date} · ${windowLabel}`
}
