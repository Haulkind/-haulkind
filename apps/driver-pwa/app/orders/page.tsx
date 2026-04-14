'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getMyOrders, getOrderHistory, type Order } from '@/lib/api'
import PageHeader from '@/components/PageHeader'

type Tab = 'today' | 'scheduled' | 'history'

export default function OrdersPage() {
  const router = useRouter()
  const { token, isLoading } = useAuth()
  const [tab, setTab] = useState<Tab>('today')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !token) router.replace('/login')
  }, [token, isLoading, router])

  const fetchOrders = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      if (tab === 'history') {
        const data = await getOrderHistory(token)
        setOrders(data.orders || [])
      } else {
        const data = await getMyOrders(token, tab)
        setOrders(data.orders || [])
      }
    } catch (err) {
      console.error('Fetch orders error:', err)
    } finally {
      setLoading(false)
    }
  }, [token, tab])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  if (isLoading || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageHeader title="My Orders" />

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200 sticky top-0 z-10">
        {(['today', 'scheduled', 'history'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold transition border-b-2 ${
              tab === t
                ? 'text-primary-600 border-primary-600'
                : 'text-gray-400 border-transparent'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">
              {tab === 'today' ? '📋' : tab === 'scheduled' ? '📅' : '📜'}
            </p>
            <p className="text-gray-500 font-medium">
              {tab === 'today'
                ? 'No orders for today'
                : tab === 'scheduled'
                ? 'No scheduled orders'
                : 'No completed orders yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => router.push(`/orders/${order.id}`)}
                className="w-full bg-white rounded-xl p-4 shadow-sm text-left border border-gray-100 active:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusColor(order.status)}`}>
                      {order.status?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {formatServiceTypeShort(order.service_type || order.serviceType || '')}
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
                {/* Item preview */}
                {(() => {
                  const desc = (order as any).description || order.customer_notes || ''
                  if (desc.startsWith('Items:')) {
                    const itemLine = desc.split('\n')[0].replace('Items:', '').trim()
                    if (itemLine) return <p className="text-xs text-indigo-600 mt-1 truncate">📋 {itemLine}</p>
                  }
                  return null
                })()}
                {(() => {
                  const pu = (order as any).photo_urls || (order as any).photos
                  if (!pu) return null
                  let arr: string[] = []
                  try { arr = typeof pu === 'string' ? JSON.parse(pu) : pu } catch {}
                  if (Array.isArray(arr) && arr.length > 0) {
                    return <p className="text-xs text-blue-600 mt-1">📷 {arr.length} customer photo{arr.length > 1 ? 's' : ''}</p>
                  }
                  return null
                })()}
                <p className="text-xs text-gray-400 mt-1">{formatDate(order)}</p>
              </button>
            ))}
          </div>
        )}

        {/* Pull to refresh hint */}
        <button
          onClick={fetchOrders}
          className="w-full mt-4 py-3 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded-xl transition"
        >
          Tap to refresh
        </button>
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
  if (order.driver_earnings && Number(order.driver_earnings) > 0) {
    return Number(order.driver_earnings).toFixed(2)
  }
  if (order.payout && Number(order.payout) > 0) {
    return Number(order.payout).toFixed(2)
  }
  const cents = order.driver_earnings_cents
  if (cents && cents > 0) return (cents / 100).toFixed(2)
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

function formatDate(order: Order): string {
  const d = order.scheduled_for || order.scheduledFor || order.created_at
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    })
  } catch {
    return ''
  }
}
