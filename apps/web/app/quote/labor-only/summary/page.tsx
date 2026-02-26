'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuote } from '@/lib/QuoteContext'
import { getQuote, createJob, payJob } from '@/lib/api'

export default function LaborOnlySummaryPage() {
  const router = useRouter()
  const { data, updateData } = useQuote()
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchQuote()
  }, [])

  const fetchQuote = async () => {
    try {
      const quoteData = await getQuote({
        serviceType: 'LABOR_ONLY',
        serviceAreaId: data.serviceAreaId!,
        pickupLat: data.pickupLat!,
        pickupLng: data.pickupLng!,
        pickupAddress: data.pickupAddress,
        scheduledFor: data.scheduledFor,
        helperCount: data.helperCount,
        estimatedHours: data.estimatedHours,
      })
      setQuote(quoteData)
      updateData({ quoteData })
      setLoading(false)
    } catch (err) {
      setError('Failed to get quote. Please try again.')
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setPaying(true)
    setError('')

    try {
      const job = await createJob({
        serviceType: 'LABOR_ONLY',
        serviceAreaId: data.serviceAreaId!,
        pickupLat: data.pickupLat!,
        pickupLng: data.pickupLng!,
        pickupAddress: data.pickupAddress,
        scheduledFor: data.scheduledFor,
        helperCount: data.helperCount,
        estimatedHours: data.estimatedHours,
        customerNotes: data.customerNotes,
        photoUrls: data.photoUrls,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        timeWindow: data.timeWindow,
      })

      updateData({ jobId: job.id })

      await payJob(job.id, 'ledger_demo')

      router.push(`/quote/tracking?jobId=${job.id}`)
    } catch (err) {
      setError('Payment failed. Please try again.')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Calculating your quote...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Quote Summary</h1>
          <p className="text-gray-600 mb-8">Review your quote and proceed to payment</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Service Details */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Service Details</h2>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span>Service Type:</span>
                <span className="font-medium">Labor Only (Help Moving)</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-medium">{data.pickupAddress}</span>
              </div>
              <div className="flex justify-between">
                <span>Scheduled:</span>
                <span className="font-medium">{new Date(data.scheduledFor).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Helpers:</span>
                <span className="font-medium">{data.helperCount} helper{data.helperCount > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Hours:</span>
                <span className="font-medium">{data.estimatedHours} hours</span>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Price Breakdown</h2>
            <div className="space-y-3">
              {quote?.breakdown?.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-gray-700">
                  <span>{item.label}</span>
                  <span className="font-medium">${item.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Estimated Total</span>
                  <span className="text-3xl font-bold text-secondary-600">${quote?.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Labor Notice */}
          <div className="mb-8 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-900">
              <strong>Note:</strong> This is an estimated total based on {data.estimatedHours} hours. Final price may vary if the job takes longer or shorter than estimated. You will be charged for actual time worked.
            </p>
          </div>

          {/* Payment Button */}
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              disabled={paying}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handlePayment}
              disabled={paying}
              className="flex-1 px-6 py-4 bg-secondary-600 text-white rounded-lg font-bold text-lg hover:bg-secondary-700 transition disabled:opacity-50"
            >
              {paying ? 'Processing...' : `Pay $${quote?.total?.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
