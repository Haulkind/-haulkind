'use client'

import { Suspense, useCallback, useEffect, useState, useRef } from 'react'
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading payment...</p>
      </div>
    </div>
  )
}

function CheckoutInner() {
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  const returnPath = searchParams.get('return') || '/schedule'
  const [error, setError] = useState('')
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [stripeLoading, setStripeLoading] = useState(true)
  const [redirectingToHosted, setRedirectingToHosted] = useState(false)
  const [embeddedReady, setEmbeddedReady] = useState(false)
  const embeddedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch Stripe publishable key: build-time env → backend → hardcoded fallback → hosted checkout
  useEffect(() => {
    async function fetchStripeKey() {
      // 1. Build-time env var
      const buildTimeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      if (buildTimeKey) {
        setStripePromise(loadStripe(buildTimeKey))
        setStripeLoading(false)
        return
      }
      // 2. Fetch from backend
      try {
        const res = await fetch(`${API_URL}/api/stripe/publishable-key`)
        const data = await res.json()
        if (data.success && data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey))
          setStripeLoading(false)
          return
        }
      } catch {
        // backend not available
      }
      // 3. Hardcoded publishable key (public, safe to embed)
      const FALLBACK_KEY = 'pk_live_51SXMuWL8VIYulg0mxbLNX9PHQAt0jpjQ9Gm25XCHwECVN2PLtMkxnLMsbBG3mNI7huG3FMicaE7eo4DwZv7ABSpt00y4eGli4b'
      setStripePromise(loadStripe(FALLBACK_KEY))
      setStripeLoading(false)
    }
    fetchStripeKey()
  }, [])

  // Fallback: redirect to Stripe hosted checkout
  const redirectToHostedCheckout = useCallback(async () => {
    if (!jobId || redirectingToHosted) return
    setRedirectingToHosted(true)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.haulkind.com'
      const res = await fetch(`${API_URL}/api/checkout/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          successUrl: `${origin}${returnPath}?payment=success&orderId=${jobId}`,
          cancelUrl: `${origin}${returnPath}?payment=cancel&orderId=${jobId}`,
        }),
      })
      const data = await res.json()
      if (data.success && data.url) {
        window.location.href = data.url
        return
      }
      setRedirectingToHosted(false)
      setError(data.error || 'Failed to create checkout session')
    } catch {
      setRedirectingToHosted(false)
      setError('Failed to create checkout session. Please try again.')
    }
  }, [jobId, returnPath, redirectingToHosted])

  // Safety timeout: if embedded checkout doesn't render within 12s, fall back to hosted
  useEffect(() => {
    if (stripeLoading || !jobId || embeddedReady || redirectingToHosted || error) return
    embeddedTimerRef.current = setTimeout(() => {
      if (!embeddedReady && !error) {
        console.warn('[Checkout] Embedded checkout timed out — falling back to hosted')
        redirectToHostedCheckout()
      }
    }, 12000)
    return () => {
      if (embeddedTimerRef.current) clearTimeout(embeddedTimerRef.current)
    }
  }, [stripeLoading, jobId, embeddedReady, redirectingToHosted, error, redirectToHostedCheckout])

  const fetchClientSecret = useCallback(async () => {
    if (!jobId) {
      setError('Missing order ID')
      return ''
    }

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.haulkind.com'
      const returnUrl = `${origin}${returnPath}?payment=success&orderId=${jobId}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const res = await fetch(`${API_URL}/api/checkout/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          uiMode: 'embedded',
          returnUrl,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await res.json()
      if (!data.success || !data.clientSecret) {
        console.warn('[Checkout] Embedded session failed, falling back to hosted:', data.error)
        redirectToHostedCheckout()
        return ''
      }

      setEmbeddedReady(true)
      if (embeddedTimerRef.current) clearTimeout(embeddedTimerRef.current)
      return data.clientSecret
    } catch (err: any) {
      console.error('[Checkout] fetchClientSecret error:', err?.message)
      redirectToHostedCheckout()
      return ''
    }
  }, [jobId, returnPath, redirectToHostedCheckout])

  if (stripeLoading || redirectingToHosted) {
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
              onClick={() => redirectToHostedCheckout()}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-teal-600 px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">Secure Payment</h1>
        <p className="text-teal-200 mt-1">Complete your payment below</p>
      </div>

      <div className="px-0 py-4">
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
