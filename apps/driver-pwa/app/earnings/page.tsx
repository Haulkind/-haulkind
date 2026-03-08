'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getEarnings, type EarningsData } from '@/lib/api'
import PageHeader from '@/components/PageHeader'

export default function EarningsPage() {
  const router = useRouter()
  const { token, isLoading } = useAuth()
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !token) router.replace('/login')
  }, [token, isLoading, router])

  const fetchEarnings = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const result = await getEarnings(token)
      setData(result)
    } catch (err) {
      console.error('Failed to fetch earnings:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchEarnings()
  }, [fetchEarnings])

  if (isLoading || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalCents = data?.total_earnings_cents || (data?.total_earnings ? data.total_earnings * 100 : 0)
  const weekCents = data?.this_week_cents || (data?.this_week ? data.this_week * 100 : 0)
  const todayCents = data?.today_cents || (data?.today ? data.today * 100 : 0)
  const completedJobs = data?.completed_jobs || 0

  return (
    <div className="bg-gray-50 min-h-screen">
      <PageHeader title="Earnings" />

      <div className="bg-primary-900 text-white px-5 pb-6">

        {/* Total Earnings */}
        <div className="bg-white/10 rounded-2xl p-5 text-center">
          <p className="text-primary-200 text-sm mb-1">Total Earnings</p>
          <p className="text-4xl font-bold">${(totalCents / 100).toFixed(2)}</p>
          <p className="text-primary-300 text-sm mt-2">{completedJobs} jobs completed</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-5 -mt-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Today</p>
            <p className="text-2xl font-bold text-green-600">${(todayCents / 100).toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">This Week</p>
            <p className="text-2xl font-bold text-primary-600">${(weekCents / 100).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Recent Earnings */}
      <div className="px-5 mt-5">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Recent Earnings</h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data?.earnings && data.earnings.length > 0 ? (
          <div className="space-y-2">
            {data.earnings.map((earning, i) => (
              <div key={earning.id || i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Job #{String(earning.job_id || '').slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {earning.created_at ? new Date(earning.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                    }) : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    +${((earning.amount_cents || earning.amount * 100) / 100).toFixed(2)}
                  </p>
                  <p className={`text-xs ${earning.status === 'paid' ? 'text-green-500' : 'text-gray-400'}`}>
                    {earning.status || 'pending'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">💰</p>
            <p className="text-gray-500 font-medium">No earnings yet</p>
            <p className="text-sm text-gray-400 mt-1">Complete orders to start earning</p>
          </div>
        )}

        <button
          onClick={fetchEarnings}
          className="w-full mt-4 py-3 text-sm text-primary-600 font-medium hover:bg-primary-50 rounded-xl transition"
        >
          Tap to refresh
        </button>
      </div>
    </div>
  )
}
