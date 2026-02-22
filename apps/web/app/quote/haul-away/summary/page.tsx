'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuote } from '@/lib/QuoteContext'
import { getQuote, createJob, payJob } from '@/lib/api'

const VOLUME_LABELS: Record<string, string> = {
  EIGHTH: '1/8 Truck (1-2 items)',
  QUARTER: '1/4 Truck (3-5 items)',
  HALF: '1/2 Truck (6-10 items)',
  THREE_QUARTER: '3/4 Truck (11-15 items)',
  FULL: 'Full Truck (16+ items)',
}

export default function HaulAwaySummaryPage() {
  const router = useRouter()
  const { data, updateData } = useQuote()
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [customerNotes, setCustomerNotes] = useState(data.customerNotes || '')

  useEffect(() => {
    fetchQuote()
  }, [])

  const fetchQuote = async () => {
    try {
      const quoteData = await getQuote({
        serviceType: 'HAUL_AWAY',
        serviceAreaId: data.serviceAreaId!,
        pickupLat: data.pickupLat!,
        pickupLng: data.pickupLng!,
        pickupAddress: data.pickupAddress,
        scheduledFor: data.scheduledFor,
        volumeTier: data.volumeTier,
        addons: data.addons,
      })
      setQuote(quoteData)
      updateData({ quoteData })
      setLoading(false)
    } catch (err) {
      console.error('[SUMMARY] Failed to get quote:', err)
      setError('Failed to get quote. Please try again.')
      setLoading(false)
    }
  }

  const formatScheduledDate = () => {
    if (data.asap) return 'ASAP (Next Available)'
    if (!data.scheduledFor) return 'Not specified'
    try {
      const date = new Date(data.scheduledFor)
      if (isNaN(date.getTime())) return data.serviceDate || 'Not specified'
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return data.serviceDate || 'Not specified'
    }
  }

  const getVolumeLabel = () => {
    if (!data.volumeTier) return 'Not specified'
    return VOLUME_LABELS[data.volumeTier] || data.volumeTier
  }

  const getTimeWindowLabel = () => {
    const labels: Record<string, string> = {
      ALL_DAY: 'All Day (8AM - 8PM)',
      MORNING: 'Morning (8AM - 12PM)',
      AFTERNOON: 'Afternoon (12PM - 4PM)',
      EVENING: 'Evening (4PM - 8PM)',
    }
    return labels[data.timeWindow] || data.timeWindow
  }

  const handlePayment = async () => {
    setPaying(true)
    setError('')
    updateData({ customerNotes })

    try {
      const job = await createJob({
        serviceType: 'HAUL_AWAY',
        serviceAreaId: data.serviceAreaId!,
        pickupLat: data.pickupLat!,
        pickupLng: data.pickupLng!,
        pickupAddress: data.pickupAddress,
        scheduledFor: data.scheduledFor,
        volumeTier: data.volumeTier,
        addons: data.addons,
        customerNotes: customerNotes,
        photoUrls: data.photoUrls,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
      })

      updateData({ jobId: job.id })
      await payJob(job.id, 'ledger_demo')
      router.push(`/quote/tracking?jobId=${job.id}`)
    } catch (err) {
      console.error('[SUMMARY] Payment failed:', err)
      setError('Payment failed. Please try again.')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
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

          {/* Customer Details */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Customer Details</h2>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span>Name:</span>
                <span className="font-medium">{data.customerName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span>Phone:</span>
                <span className="font-medium">{data.customerPhone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="font-medium">{data.customerEmail || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Service Details</h2>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between">
                <span>Service Type:</span>
                <span className="font-medium">Junk Removal (Haul Away)</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-medium text-right max-w-[60%]">{data.pickupAddress || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span>Scheduled:</span>
                <span className="font-medium">{formatScheduledDate()}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Window:</span>
                <span className="font-medium">{getTimeWindowLabel()}</span>
              </div>
              <div className="flex justify-between">
                <span>Volume:</span>
                <span className="font-medium">{getVolumeLabel()}</span>
              </div>
              {data.addons.length > 0 && (
                <div className="flex justify-between">
                  <span>Add-ons:</span>
                  <span className="font-medium">{data.addons.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Notes */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Notes & Special Instructions</h2>
            <textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Any special instructions for the driver? (e.g., gate code, parking info, item location, etc.)"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm"
            />
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
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-3xl font-bold text-primary-600">${quote?.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Disposal Notice */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Includes disposal up to ${quote?.disposalIncluded || 50}.</strong> If disposal fees exceed this amount, you will pay the difference (driver provides receipt).
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
              className="flex-1 px-6 py-4 bg-primary-600 text-white rounded-lg font-bold text-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {paying ? 'Processing...' : `Pay $${quote?.total?.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
