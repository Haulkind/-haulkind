'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading payment...</p>
      </div>
    </div>
  )
}

function CheckoutInner() {
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  const returnPath = searchParams.get('return') || '/quote/tracking'
  const [error, setError] = useState('')
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [stripeLoading, setStripeLoading] = useState(true)
  const [useHostedCheckout, setUseHostedCheckout] = useState(false)

  // Fetch Stripe publishable key dynamically; fall back to hosted checkout if unavailable
  useEffect(() => {
    async function fetchStripeKey() {
      const buildTimeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      if (buildTimeKey) {
        setStripePromise(loadStripe(buildTimeKey))
        setStripeLoading(false)
        return
      }
      try {
        const res = await fetch(`${API_URL}/api/stripe/publishable-key`)
        const data = await res.json()
        if (data.success && data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey))
          setStripeLoading(false)
          return
        }
      } catch {
        // publishable key not available
      }
      // Publishable key not available — fall back to hosted Stripe checkout
      setUseHostedCheckout(true)
      setStripeLoading(false)
    }
    fetchStripeKey()
  }, [])

  // If publishable key not available, redirect to Stripe hosted checkout
  useEffect(() => {
    if (!useHostedCheckout || !jobId) return
    async function redirectToHostedCheckout() {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://haulkind.com'
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            successUrl: `${origin}${returnPath}?jobId=${jobId}&payment=success`,
            cancelUrl: `${origin}${returnPath}?jobId=${jobId}&payment=cancel`,
          }),
        })
        const data = await res.json()
        if (data.success && data.url) {
          window.location.href = data.url
          return
        }
        setUseHostedCheckout(false)
        setError(data.error || 'Failed to create checkout session')
      } catch {
        setUseHostedCheckout(false)
        setError('Failed to create checkout session. Please try again.')
      }
    }
    redirectToHostedCheckout()
  }, [useHostedCheckout, jobId, returnPath])

  const fetchClientSecret = useCallback(async () => {
    if (!jobId) {
      setError('Missing order ID')
      return ''
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://haulkind.com'
    const returnUrl = `${origin}${returnPath}?jobId=${jobId}&payment=success`

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        uiMode: 'embedded',
        returnUrl,
      }),
    })

    const data = await res.json()
    if (!data.success || !data.clientSecret) {
      setError(data.error || 'Failed to create checkout session')
      return ''
    }

    return data.clientSecret
  }, [jobId, returnPath])

  if (stripeLoading || (useHostedCheckout && !error)) {
    return <Loading />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Go Back
          </button>
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
            className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary-600 px-4 py-6">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold text-white">Secure Payment</h1>
          <p className="text-primary-200 mt-1">Complete your payment below</p>
        </div>
      </div>

      <div className="py-4">
        <EmbeddedCheckoutProvider
          stripe={stripePromise!}
          options={{ fetchClientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  )
}
