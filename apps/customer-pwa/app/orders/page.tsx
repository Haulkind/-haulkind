'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getMyOrders } from '@/lib/api'
import { getToken, isLoggedIn } from '@/lib/auth'
import OrderCard from '@/components/OrderCard'

function OrdersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'completed' ? 'completed' : 'active'
  const [tab, setTab] = useState<'active' | 'completed'>(initialTab)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/auth'); return }
    loadOrders()
  }, [tab, router])

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    const token = getToken()
    if (!token) return
    try {
      const data = await getMyOrders(token, tab)
      if (data.error) {
        console.error('Orders API error:', data.error)
        setError(data.error)
        setOrders([])
      } else {
        setOrders(data.orders || [])
      }
    } catch (e) {
      console.error('Failed to load orders:', e)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <div className="flex mt-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab('active')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
              tab === 'active' ? 'bg-white shadow text-primary-600' : 'text-gray-500'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setTab('completed')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
              tab === 'completed' ? 'bg-white shadow text-primary-600' : 'text-gray-500'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button onClick={loadOrders} className="ml-2 underline font-medium">Retry</button>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : orders.length === 0 && !error ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">{tab === 'active' ? '📭' : '📋'}</div>
            <p className="text-gray-500">
              {tab === 'active' ? 'No active orders' : 'No completed orders yet'}
            </p>
            {tab === 'active' && (
              <button
                onClick={() => router.push('/schedule')}
                className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium"
              >
                Book a Service
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => router.push(`/orders/${order.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  )
}
