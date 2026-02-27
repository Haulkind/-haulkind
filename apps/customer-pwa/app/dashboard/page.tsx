'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getMyOrders } from '@/lib/api'
import { getToken, getCustomer, isLoggedIn } from '@/lib/auth'
import OrderCard from '@/components/OrderCard'

export default function DashboardPage() {
  const router = useRouter()
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [completedOrders, setCompletedOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const customer = getCustomer()

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/auth'); return }
    loadOrders()
  }, [router])

  const loadOrders = async () => {
    const token = getToken()
    if (!token) return
    try {
      const [activeRes, completedRes] = await Promise.all([
        getMyOrders(token, 'active'),
        getMyOrders(token, 'completed'),
      ])
      setActiveOrders(activeRes.orders || [])
      setCompletedOrders(completedRes.orders || [])
    } catch (e) {
      console.error('Failed to load orders:', e)
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

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-primary-600 px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">
          Hello, {customer?.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-primary-200 mt-1">Welcome to Haulkind</p>
      </div>

      {/* Quick Actions */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-xl shadow-md p-4 flex gap-3">
          <button
            onClick={() => router.push('/schedule')}
            className="flex-1 bg-primary-50 rounded-lg p-4 text-center hover:bg-primary-100 transition"
          >
            <div className="text-2xl mb-1">📦</div>
            <div className="text-sm font-medium text-primary-700">Book Service</div>
          </button>
          <button
            onClick={() => router.push('/track')}
            className="flex-1 bg-primary-50 rounded-lg p-4 text-center hover:bg-primary-100 transition"
          >
            <div className="text-2xl mb-1">📍</div>
            <div className="text-sm font-medium text-primary-700">Track Order</div>
          </button>
          <button
            onClick={() => router.push('/orders')}
            className="flex-1 bg-primary-50 rounded-lg p-4 text-center hover:bg-primary-100 transition"
          >
            <div className="text-2xl mb-1">📋</div>
            <div className="text-sm font-medium text-primary-700">My Orders</div>
          </button>
        </div>
      </div>

      {/* Active Orders */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Active Orders</h2>
        {activeOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>No active orders</p>
            <button
              onClick={() => router.push('/schedule')}
              className="mt-3 text-primary-600 font-medium text-sm"
            >
              Book a service
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.map(order => (
              <OrderCard key={order.id} order={order} onClick={() => router.push(`/orders/${order.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <div className="px-4 mt-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Recent Completed</h2>
          <div className="space-y-3">
            {completedOrders.slice(0, 3).map(order => (
              <OrderCard key={order.id} order={order} onClick={() => router.push(`/orders/${order.id}`)} />
            ))}
          </div>
          {completedOrders.length > 3 && (
            <button
              onClick={() => router.push('/orders?tab=completed')}
              className="mt-3 text-primary-600 font-medium text-sm"
            >
              View all ({completedOrders.length})
            </button>
          )}
        </div>
      )}
    </div>
  )
}
