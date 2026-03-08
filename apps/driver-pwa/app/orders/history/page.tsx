'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getOrderHistory, type Order } from '@/lib/api'
import PageHeader from '@/components/PageHeader'

export default function OrderHistoryPage() {
  const router = useRouter()
  const { token, isLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !token) router.replace('/login')
  }, [token, isLoading, router])

  const fetchHistory = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await getOrderHistory(token)
      setOrders(data.orders || [])
    } catch (err) {
      console.error('Fetch history error:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  if (isLoading || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageHeader title="Order History" />

      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📜</p>
            <p className="text-gray-500 font-medium">No completed orders yet</p>
            <p className="text-sm text-gray-400 mt-1">Your completed orders will appear here</p>
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
                      {order.status?.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {order.service_type || order.serviceType || ''}
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
                <p className="text-xs text-gray-400 mt-1">{formatDate(order)}</p>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={fetchHistory}
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
    default: return 'bg-gray-100 text-gray-600'
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
