'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuote } from '@/lib/QuoteContext'
import { getQuote, createJob, createCheckoutSession } from '@/lib/api'

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

  // Reset state when restored from bfcache (iOS Safari back button)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setPaying(false)
        setError('')
      }
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  // Check if we have calculator items (QuoteKind flow) vs old volume flow
  // Try context first, then sessionStorage as fallback (context may not have hydrated yet)
  const getCalculatorItems = () => {
    // 1. Try QuoteContext
    if (data.selectedItemDetails && data.selectedItemDetails.length > 0 && data.calculatorPrice != null) {
      return {
        items: data.selectedItemDetails,
        price: data.calculatorPrice,
        discountPercent: data.discountPercent || 0,
        discountAmount: data.discountAmount || 0,
      }
    }
    // 2. Fallback: read directly from sessionStorage
    if (typeof window !== 'undefined') {
      try {
        const storedItems = sessionStorage.getItem('hk_item_details')
        const storedPrice = sessionStorage.getItem('hk_estimated_price')
        if (storedItems && storedPrice) {
          const items = JSON.parse(storedItems)
          if (items && items.length > 0) {
            return {
              items,
              price: parseFloat(storedPrice),
              discountPercent: parseFloat(sessionStorage.getItem('hk_discount_percent') || '0'),
              discountAmount: parseFloat(sessionStorage.getItem('hk_discount_amount') || '0'),
            }
          }
        }
      } catch (e) {
        console.warn('[SUMMARY] Failed to read calculator items from sessionStorage:', e)
      }
    }
    return null
  }

  const hasCalculatorItems = data.selectedItemDetails && data.selectedItemDetails.length > 0 && data.calculatorPrice != null

  useEffect(() => {
    const calcData = getCalculatorItems()
    if (calcData) {
      // Use calculator pricing directly — no need to call getQuote API
      const { items, discountPercent, discountAmount } = calcData
      const breakdown: Array<{ label: string; amount: number }> = []
      items.forEach((item: any) => {
        const qty = item.quantity || 1
        if (qty > 1) {
          breakdown.push({ label: `${item.name} x${qty}`, amount: item.price * qty })
        } else {
          breakdown.push({ label: item.name, amount: item.price })
        }
      })
      // Add discount line if applicable
      if (discountAmount > 0) {
        breakdown.push({ label: `Multi-item discount (${discountPercent}%)`, amount: -discountAmount })
      }
      const subtotalBeforeDiscount = items.reduce((sum: number, i: any) => sum + i.price * (i.quantity || 1), 0)
      const afterDiscount = subtotalBeforeDiscount - discountAmount
      // Enforce $99 minimum visit fee (same as calculator)
      const MINIMUM_VISIT_FEE = 99
      const afterMinimum = Math.max(afterDiscount, MINIMUM_VISIT_FEE)
      // Show minimum fee adjustment in breakdown if it was applied
      if (afterDiscount < MINIMUM_VISIT_FEE) {
        breakdown.push({ label: 'Minimum Visit Fee adjustment', amount: MINIMUM_VISIT_FEE - afterDiscount })
      }
      const platformFee = Math.round(afterMinimum * 0.05 * 100) / 100
      const total = Math.round((afterMinimum + platformFee) * 100) / 100
      breakdown.push({ label: 'Platform Fee', amount: platformFee })
      setQuote({ breakdown, total })
      // Also update context so customer details and other fields display correctly
      if (!hasCalculatorItems) {
        updateData({
          selectedItemDetails: items,
          calculatorPrice: calcData.price,
          discountPercent,
          discountAmount,
          quoteData: { breakdown, total },
        })
      } else {
        updateData({ quoteData: { breakdown, total } })
      }
      setLoading(false)
    } else {
      // Fallback: old volume-based pricing
      fetchQuote()
    }
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

  const abortRef = useRef<AbortController | null>(null)

  const handlePayment = useCallback(async () => {
    if (paying) return
    setPaying(true)
    setError('')
    updateData({ customerNotes })

    // Create AbortController so safety timer can cancel in-flight request
    const controller = new AbortController()
    abortRef.current = controller

    // Safety timeout: if payment doesn't complete in 20s, abort and reset
    const safetyTimer = setTimeout(() => {
      controller.abort()
      setPaying(false)
      setError('Payment is taking too long. Please try again.')
    }, 20000)

    try {
      // Build description from calculator items if available (use sessionStorage fallback)
      const calcData = getCalculatorItems()
      const itemDescription = calcData
        ? calcData.items.map((i: any) => {
            const qty = i.quantity || 1
            return qty > 1 ? `${i.name} x${qty}` : i.name
          }).join(', ')
        : undefined

      const job = await createJob({
        serviceType: 'HAUL_AWAY',
        serviceAreaId: data.serviceAreaId!,
        pickupLat: data.pickupLat!,
        pickupLng: data.pickupLng!,
        pickupAddress: data.pickupAddress,
        scheduledFor: data.scheduledFor,
        volumeTier: calcData ? undefined : data.volumeTier,
        addons: data.addons,
        customerNotes: itemDescription
          ? `Items: ${itemDescription}${customerNotes ? '\n' + customerNotes : ''}`
          : customerNotes,
        photoUrls: data.photoUrls,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        timeWindow: data.timeWindow,
        total: quote?.total,
      }, controller.signal)

      clearTimeout(safetyTimer)
      if (controller.signal.aborted) return
      updateData({ jobId: job.id })

      const origin = window.location.origin
      window.location.href = `${origin}/checkout?jobId=${job.id}&return=/quote/tracking`
      return
    } catch (err: any) {
      clearTimeout(safetyTimer)
      if (err.name === 'AbortError') return
      console.error('[SUMMARY] Payment failed:', err)
      setError('Payment failed. Please try again.')
      setPaying(false)
    }
  }, [paying, customerNotes, data, updateData, quote])

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
                <span className="font-medium">
                  {typeof window !== 'undefined' && sessionStorage.getItem('hk_service_type') === 'DONATION_PICKUP'
                    ? 'Donation Pickup Service'
                    : 'Hauling & Removal Service'}
                </span>
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
              {/* Show selected items for calculator flow, volume for old flow */}
              {hasCalculatorItems ? (
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span className="font-medium text-right max-w-[60%]">
                    {data.selectedItemDetails.map(i => {
                      const qty = i.quantity || 1
                      return qty > 1 ? `${i.name} x${qty}` : i.name
                    }).join(', ')}
                  </span>
                </div>
              ) : (
                <>
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
                </>
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

          {/* All-in notice */}
          <div className="mb-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-900">
              <strong>All-in price.</strong> Disposal fee is already included. No per-mile charges. No receipts. No surprise fees when the driver arrives.
            </p>
          </div>

          {/* Price lock guarantee — BLOCO 5B */}
          <div className="mb-8 text-center">
            <p className="text-[12px] text-gray-500">
              Price lock guarantee: The price shown is your final price. Nothing changes when the driver arrives.
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
