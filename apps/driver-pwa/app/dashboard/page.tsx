'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { setOnlineStatus, getAvailableOrders, getMyOrders, acceptOrder, rejectOrder, getProfile, sendDriverLocation, type Order } from '@/lib/api'
import dynamic from 'next/dynamic'
import Sidebar from '@/components/Sidebar'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

const POLL_INTERVAL = 5000

type OrderTab = 'today' | 'all' | 'new'

// Shared AudioContext — created on first user interaction to comply with browser autoplay policy
let _audioCtx: AudioContext | null = null
function getAudioContext(): AudioContext | null {
  try {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    // Resume if suspended (browser suspends until user gesture)
    if (_audioCtx.state === 'suspended') {
      _audioCtx.resume()
    }
    return _audioCtx
  } catch (e) {
    console.log('[PWA Sound] AudioContext error:', e)
    return null
  }
}

// Warm up AudioContext on first user interaction (click/touch)
if (typeof window !== 'undefined') {
  const warmUp = () => {
    getAudioContext()
    window.removeEventListener('click', warmUp)
    window.removeEventListener('touchstart', warmUp)
  }
  window.addEventListener('click', warmUp, { once: true })
  window.addEventListener('touchstart', warmUp, { once: true })
}

// Play a notification beep using Web Audio API (works on all browsers, no sound file needed)
function playNotificationBeep() {
  try {
    const settings = JSON.parse(localStorage.getItem('driver_settings') || '{}')
    if (settings.sound === false) return
    const ctx = getAudioContext()
    if (!ctx) return
    // Play three quick ascending beeps
    const playTone = (startTime: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.6, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
      osc.start(startTime)
      osc.stop(startTime + duration)
    }
    playTone(ctx.currentTime, 880, 0.15)
    playTone(ctx.currentTime + 0.2, 1100, 0.15)
    playTone(ctx.currentTime + 0.4, 1320, 0.2)
    console.log('[PWA Sound] Beep played')
  } catch (e) {
    console.log('[PWA Sound] Error:', e)
  }
}

// Show browser notification for new orders
function showBrowserNotification(count: number, firstOrder: Order | undefined) {
  try {
    const settings = JSON.parse(localStorage.getItem('driver_settings') || '{}')
    if (settings.notifications === false) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const price = parseFloat(String(firstOrder?.estimated_price || firstOrder?.final_price || 0)).toFixed(0)
    const address = firstOrder?.pickup_address || 'Nearby'
    const title = count === 1 ? '\uD83D\uDE9B New Order Available!' : `\uD83D\uDE9B ${count} New Orders!`
    const body = count === 1 ? `$${price} \u2014 ${address}` : `$${price} and ${count - 1} more`
    new Notification(title, { body, icon: '/icon-192x192.png', tag: 'new-order', renotify: true })
    // Vibrate if supported
    if (settings.vibration !== false && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200])
    }
  } catch (e) {
    console.log('[PWA Notification] Error:', e)
  }
}

// Haversine distance in miles between two lat/lng pairs
function getDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

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
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<OrderTab>('all')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const previousOrderIdsRef = useRef<Set<string>>(new Set())
  const hasCompletedFirstFetchRef = useRef(false)
  const fetchAllDataRef = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    if (!isLoading && !token) router.replace('/login')
  }, [token, isLoading, router])

  // Start GPS tracking + send location to backend for admin map
  const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const latRef = useRef<number | null>(null)
  const lngRef = useRef<number | null>(null)
  const gpsSendCountRef = useRef(0)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    if (!token) {
      console.log('[PWA GPS] No token yet, skipping GPS tracking')
      return
    }
    console.log('[PWA GPS] Starting GPS tracking with token:', token.substring(0, 20) + '...')
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        latRef.current = pos.coords.latitude
        lngRef.current = pos.coords.longitude
        // Send to backend immediately on position change
        sendDriverLocation(token, pos.coords.latitude, pos.coords.longitude, pos.coords.heading, pos.coords.speed)
          .then((res) => {
            gpsSendCountRef.current++
            if (gpsSendCountRef.current <= 5 || gpsSendCountRef.current % 10 === 0) {
              console.log(`[PWA GPS] Sent #${gpsSendCountRef.current}:`, pos.coords.latitude.toFixed(4), pos.coords.longitude.toFixed(4), 'result:', JSON.stringify(res))
            }
          })
          .catch((err) => console.warn('[PWA GPS] FAILED to send location:', err?.message))
      },
      (err) => console.warn('[PWA GPS] Geolocation error:', err.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
    // Send every 15 seconds as a heartbeat (even if position hasn't changed)
    gpsIntervalRef.current = setInterval(() => {
      if (latRef.current != null && lngRef.current != null) {
        sendDriverLocation(token, latRef.current, lngRef.current)
          .catch((err) => console.warn('[PWA GPS] Heartbeat failed:', err?.message))
      }
    }, 15000)
    return () => {
      navigator.geolocation.clearWatch(watchId)
      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current)
    }
  }, [token])

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

  // Request browser notification permission when going online
  useEffect(() => {
    if (isOnline && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [isOnline])

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
      // Detect brand-new orders and notify
      const currentIds = new Set(newAvailable.map((o: Order) => String(o.id)))
      if (hasCompletedFirstFetchRef.current) {
        const brandNew = newAvailable.filter((o: Order) => !previousOrderIdsRef.current.has(String(o.id)))
        if (brandNew.length > 0) {
          playNotificationBeep()
          showBrowserNotification(brandNew.length, brandNew[0])
        }
      }
      hasCompletedFirstFetchRef.current = true
      previousOrderIdsRef.current = currentIds
      setAvailableOrders(newAvailable)
      // Driver's own active orders (assigned/accepted, not completed/cancelled)
      setAllOrders(myOrdersList)
      setTodayOrders(myOrdersList)
    } catch (err) {
      console.error('Fetch orders error:', err)
    }
  }, [token])

  // Keep ref in sync so visibility/focus listeners can call latest version
  fetchAllDataRef.current = fetchAllData

  const toggleOnline = async () => {
    if (!token) return
    setToggling(true)
    try {
      await setOnlineStatus(token, !isOnline, lat || undefined, lng || undefined)
      setIsOnline(!isOnline)
      if (isOnline) setAvailableOrders([])
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

  const nearbyCount = availableOrders.length

  // Tab logic (matches native app behavior):
  // "New" tab = available unassigned orders (pending, no driver assigned)
  // "Today" tab = driver's OWN accepted orders scheduled for TODAY only
  // "All" tab = driver's OWN active orders (all dates, assigned/accepted)
  // After cancel: order disappears from All/Today, appears in New
  // After accept: order disappears from New, appears in All/Today
  const todayFiltered = todayOrders.filter(o => {
    const scheduledFor = o.scheduled_for || o.scheduledFor
    return isToday(scheduledFor)
  })
  const currentOrders = tab === 'today' ? todayFiltered : tab === 'new' ? availableOrders : allOrders

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Map (full screen) */}
      <MapView lat={lat} lng={lng} orders={currentOrders} />

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
              className={`relative px-5 py-2 rounded-full text-sm font-semibold transition ${
                tab === t
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'new' && nearbyCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {nearbyCount}
                </span>
              )}
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
                  {tab === 'new' ? 'Orders within 80 miles will appear here' : tab === 'today' ? 'No accepted orders for today' : tab === 'all' ? 'Accept orders from the New tab' : 'Check back soon'}
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
                    <div className="flex items-center gap-2">
                      {tab === 'new' && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">NEW</span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusColor(order.status)}`}>
                        {order.status?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatServiceTypeShort(order.service_type || order.serviceType || 'HAUL_AWAY')}
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
                  {/* Show brief item preview from description or items_json */}
                  {(() => {
                    const desc = order.description || order.customer_notes || ''
                    if (desc.startsWith('Items:')) {
                      const itemLine = desc.split('\n')[0].replace('Items:', '').trim()
                      if (itemLine) return <p className="text-xs text-indigo-600 mt-1 truncate">📋 {itemLine}</p>
                    }
                    const ij = order.items_json
                    if (ij) {
                      try {
                        const arr = typeof ij === 'string' ? JSON.parse(ij) : ij
                        if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] !== 'string') {
                          const names = arr.map((i: any) => {
                            const qty = i.quantity || 1
                            return qty > 1 ? `${i.name} x${qty}` : i.name
                          }).join(', ')
                          if (names) return <p className="text-xs text-indigo-600 mt-1 truncate">📋 {names}</p>
                        }
                      } catch {}
                    }
                    return null
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
                  {/* Distance from driver */}
                  {lat && lng && order.pickup_lat && order.pickup_lng && (
                    <p className="text-xs text-blue-500 mt-1">
                      📍 {getDistanceMiles(lat, lng, Number(order.pickup_lat), Number(order.pickup_lng)).toFixed(1)} mi away
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{formatTime(order)}</p>

                          {/* Action buttons for new/available orders */}
                          {tab === 'new' && (
                            <div className="mt-3 space-y-2">
                              <button
                                onClick={() => router.push(`/orders/${order.id}`)}
                                className="w-full py-2 text-sm text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition border border-blue-200"
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

                          {/* View details / manage for today/all (driver's own orders) */}
                          {tab !== 'new' && (
                            <button
                              onClick={() => router.push(`/orders/${order.id}`)}
                              className="w-full mt-3 py-2 text-sm text-primary-600 font-semibold hover:bg-primary-50 rounded-lg transition"
                            >
                              {tab === 'all' || tab === 'today' ? 'Manage Order' : 'View Details'}
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

function formatServiceTypeShort(type: string): string {
  const labels: Record<string, string> = {
    'HAUL_AWAY': 'Junk Removal',
    'LABOR_ONLY': 'Moving Labor',
    'MATTRESS_SWAP': 'Mattress Swap',
    'FURNITURE_ASSEMBLY': 'Assembly',
    'DUMPSTER_RENTAL': 'Dumpster',
    'DONATION_PICKUP': 'Donation',
  }
  return labels[type.toUpperCase()] || type.replace(/_/g, ' ')
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
