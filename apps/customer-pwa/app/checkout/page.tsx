'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://haulkind-production-285b.up.railway.app'

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CheckoutInner />
    </Suspense>
  )
}

function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to payment...</p>
      </div>
    </div>
  )
}

function CheckoutInner() {
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  const returnPath = searchParams.get('return') || '/schedule'
  const [error, setError] = useState('')
  const [redirecting, setRedirecting] = useState(false)

  const redirectToCheckout = useCallback(async () => {
    if (!jobId || redirecting) return
    setRedirecting(true)
    setError('')

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.haulkind.com'

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const res = await fetch(`${API_URL}/api/checkout/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          successUrl: `${origin}${returnPath}?payment=success&orderId=${jobId}`,
          cancelUrl: `${origin}${returnPath}?payment=cancel&orderId=${jobId}`,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await res.json()
      if (data.success && data.url) {
        window.location.href = data.url
        return
      }

      setRedirecting(false)
      setError(data.error || 'Failed to create checkout session')
    } catch (err: any) {
      setRedirecting(false)
      if (err.name === 'AbortError') {
        setError('Payment is taking too long. Please try again.')
      } else {
        setError('Failed to connect to payment. Please try again.')
      }
    }
  }, [jobId, returnPath, redirecting])

  // Auto-redirect to Stripe hosted checkout on mount
  useEffect(() => {
    if (jobId && !redirecting && !error) {
      redirectToCheckout()
    }
  }, [jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset state when restored from bfcache (iOS Safari back button)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setRedirecting(false)
        setError('')
      }
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  if (redirecting) {
    return <Loading />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center">
          <p className="text-red-600 font-medium mb-2">{error}</p>
          <p className="text-gray-500 text-sm mb-4">If the problem persists, please call us at (978) 515-4980</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => redirectToCheckout()}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg"
            >
              Try Again
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!jobId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center">
          <p className="text-red-600 font-medium">Missing order ID</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return <Loading />
}
