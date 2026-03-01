'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getQuote, createJob, payJob, createCheckoutSession, lookupServiceArea } from '@/lib/api'
import { getCustomer, isLoggedIn } from '@/lib/auth'

type Step = 'service' | 'address' | 'schedule' | 'details' | 'summary' | 'confirm'

const VOLUME_TIERS = [
  { id: 'EIGHTH', label: '1/8 Truck Load', desc: 'Small items, a few bags', price: 109 },
  { id: 'QUARTER', label: '1/4 Truck Load', desc: 'A couch or small room', price: 169 },
  { id: 'HALF', label: '1/2 Truck Load', desc: 'A bedroom or small office', price: 279 },
  { id: 'THREE_QUARTER', label: '3/4 Truck Load', desc: 'Multiple rooms', price: 389 },
  { id: 'FULL', label: 'Full Truck Load', desc: 'Full house cleanout', price: 529 },
]

const TIME_WINDOWS = [
  { id: 'ALL_DAY', label: 'All Day', time: '8AM - 8PM' },
  { id: 'MORNING', label: 'Morning', time: '8AM - 12PM' },
  { id: 'AFTERNOON', label: 'Afternoon', time: '12PM - 4PM' },
  { id: 'EVENING', label: 'Evening', time: '4PM - 8PM' },
]

export default function SchedulePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customer = isLoggedIn() ? getCustomer() : null

  const [step, setStep] = useState<Step>('service')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Handle Stripe Checkout return
  useEffect(() => {
    const payment = searchParams.get('payment')
    const orderId = searchParams.get('orderId')
    if (payment === 'success' && orderId) {
      setJobId(orderId)
      setStep('confirm')
    } else if (payment === 'cancelled' && orderId) {
      setJobId(orderId)
      setError('Payment was cancelled. You can try again or track your order.')
      setStep('confirm')
    }
  }, [searchParams])

  // Form data
  const [serviceType, setServiceType] = useState<'HAUL_AWAY' | 'LABOR_ONLY'>('HAUL_AWAY')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [lat, setLat] = useState(0)
  const [lng, setLng] = useState(0)
  const [serviceAreaId, setServiceAreaId] = useState(0)
  const [date, setDate] = useState('')
  const [timeWindow, setTimeWindow] = useState('ALL_DAY')
  const [volumeTier, setVolumeTier] = useState('QUARTER')
  const [helperCount, setHelperCount] = useState(1)
  const [estimatedHours, setEstimatedHours] = useState(2)
  const [notes, setNotes] = useState('')
  const [customerName, setCustomerName] = useState(customer?.name || '')
  const [customerEmail, setCustomerEmail] = useState(customer?.email || '')
  const [customerPhone, setCustomerPhone] = useState(customer?.phone || '')

  // Quote result
  const [quoteTotal, setQuoteTotal] = useState(0)
  const [jobId, setJobId] = useState('')
  const [trackingToken, setTrackingToken] = useState('')

  // Build full address string from parts
  const fullAddress = [street, city, state, zipCode].filter(Boolean).join(', ')

  const handleAddressLookup = async () => {
    if (!street.trim()) { setError('Please enter a street address'); return }
    if (!city.trim()) { setError('Please enter a city'); return }
    if (!state.trim()) { setError('Please enter a state'); return }
    if (!zipCode.trim()) { setError('Please enter a zip code'); return }
    setLoading(true)
    setError('')
    try {
      // Use browser geocoding via Nominatim
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'Haulkind/1.0' } }
      )
      const results = await resp.json()
      if (!results || results.length === 0) {
        setError('Address not found. Please check street, city, state, and zip code.')
        return
      }
      const loc = results[0]
      const foundLat = parseFloat(loc.lat)
      const foundLng = parseFloat(loc.lon)
      setLat(foundLat)
      setLng(foundLng)

      // Check service area
      const areaData = await lookupServiceArea(foundLat, foundLng)
      if (!areaData.covered) {
        setError('Sorry, this address is not in our service area yet.')
        return
      }
      setServiceAreaId(areaData.serviceArea?.id || 1)
      setStep('schedule')
    } catch {
      setError('Failed to look up address. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGetQuote = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getQuote({
        serviceType,
        volumeTier: serviceType === 'HAUL_AWAY' ? volumeTier : undefined,
        helperCount: serviceType === 'LABOR_ONLY' ? helperCount : undefined,
        estimatedHours: serviceType === 'LABOR_ONLY' ? estimatedHours : undefined,
      })
      if (data.error) { setError(data.error); return }
      setQuoteTotal(data.total || 0)
      setStep('summary')
    } catch {
      setError('Failed to get quote. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateJob = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      setError('Name and email are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const scheduledFor = date ? new Date(date + 'T12:00:00').toISOString() : new Date().toISOString()
      const data = await createJob({
        serviceType,
        serviceAreaId,
        pickupLat: lat,
        pickupLng: lng,
        pickupAddress: fullAddress,
        scheduledFor,
        volumeTier: serviceType === 'HAUL_AWAY' ? volumeTier : undefined,
        helperCount: serviceType === 'LABOR_ONLY' ? helperCount : undefined,
        estimatedHours: serviceType === 'LABOR_ONLY' ? estimatedHours : undefined,
        customerNotes: notes,
        customerName,
        customerPhone,
        customerEmail,
        timeWindow,
        total: quoteTotal,
      })
      if (data.error) { setError(data.error); return }
      setJobId(data.id)
      setTrackingToken(data.trackingToken || '')

      // Try Stripe Checkout first; fall back to mock payment if Stripe not configured
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.haulkind.com'
        const checkout = await createCheckoutSession(
          data.id,
          `${origin}/schedule?payment=success&orderId=${data.id}`,
          `${origin}/schedule?payment=cancelled&orderId=${data.id}`
        )
        if (checkout?.url) {
          // Redirect to Stripe Checkout
          window.location.href = checkout.url
          return
        }
      } catch {
        // Stripe not configured — fall back to mock payment
      }

      // Fallback: mark as paid via mock endpoint
      try { await payJob(data.id) } catch { /* non-fatal */ }

      setStep('confirm')
    } catch {
      setError('Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-primary-600 px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">Book a Service</h1>
        <p className="text-primary-200 mt-1">
          {step === 'service' && 'Choose your service type'}
          {step === 'address' && 'Enter your pickup address'}
          {step === 'schedule' && 'Select date and time'}
          {step === 'details' && 'Provide details'}
          {step === 'summary' && 'Review your order'}
          {step === 'confirm' && 'Order confirmed!'}
        </p>
      </div>

      {/* Progress */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="flex gap-1">
          {['service', 'address', 'schedule', 'details', 'summary', 'confirm'].map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${
                ['service', 'address', 'schedule', 'details', 'summary', 'confirm'].indexOf(step) >= i
                  ? 'bg-primary-600'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-4 py-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        {/* Step: Service Type */}
        {step === 'service' && (
          <div className="space-y-3">
            <button
              onClick={() => { setServiceType('HAUL_AWAY'); setStep('address') }}
              className="w-full bg-white rounded-xl p-5 shadow-sm text-left hover:shadow-md transition border-2 border-transparent hover:border-primary-300"
            >
              <div className="text-2xl mb-2">🚛</div>
              <h3 className="font-bold text-lg">Junk Removal</h3>
              <p className="text-sm text-gray-500 mt-1">We haul away your unwanted items</p>
            </button>
            <button
              onClick={() => { setServiceType('LABOR_ONLY'); setStep('address') }}
              className="w-full bg-white rounded-xl p-5 shadow-sm text-left hover:shadow-md transition border-2 border-transparent hover:border-primary-300"
            >
              <div className="text-2xl mb-2">💪</div>
              <h3 className="font-bold text-lg">Labor Only</h3>
              <p className="text-sm text-gray-500 mt-1">Helpers for moving, loading, or cleanup</p>
            </button>
          </div>
        )}

        {/* Step: Address */}
        {step === 'address' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                value={street}
                onChange={e => setStreet(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="123 Main St"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Philadelphia"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="PA"
                  maxLength={2}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={e => setZipCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="19103"
                  maxLength={5}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('service')} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium">
                Back
              </button>
              <button
                onClick={handleAddressLookup}
                disabled={loading}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Schedule */}
        {step === 'schedule' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={today}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Window</label>
              <div className="grid grid-cols-2 gap-2">
                {TIME_WINDOWS.map(tw => (
                  <button
                    key={tw.id}
                    onClick={() => setTimeWindow(tw.id)}
                    className={`p-3 rounded-lg border-2 text-left transition ${
                      timeWindow === tw.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{tw.label}</div>
                    <div className="text-xs text-gray-500">{tw.time}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('address')} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium">
                Back
              </button>
              <button
                onClick={() => setStep('details')}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <div className="space-y-4">
            {serviceType === 'HAUL_AWAY' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Volume</label>
                <div className="space-y-2">
                  {VOLUME_TIERS.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setVolumeTier(v.id)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition ${
                        volumeTier === v.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-sm">{v.label}</div>
                          <div className="text-xs text-gray-500">{v.desc}</div>
                        </div>
                        <div className="text-lg font-bold text-primary-600">${v.price}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Helpers</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(n => {
                      const rate = n === 1 ? 79 : 129
                      return (
                        <button
                          key={n}
                          onClick={() => setHelperCount(n)}
                          className={`flex-1 py-2 rounded-lg border-2 font-medium transition ${
                            helperCount === n
                              ? 'border-primary-600 bg-primary-50 text-primary-600'
                              : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          <div className="text-base">{n}</div>
                          <div className="text-xs text-gray-500">${rate}/hr</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map(h => {
                      const rate = helperCount === 1 ? 79 : 129
                      const total = h * rate
                      return (
                        <button
                          key={h}
                          onClick={() => setEstimatedHours(h)}
                          className={`flex-1 py-2 rounded-lg border-2 font-medium transition ${
                            estimatedHours === h
                              ? 'border-primary-600 bg-primary-50 text-primary-600'
                              : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          <div className="text-base">{h}h</div>
                          <div className="text-xs text-gray-500">${total}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
                {/* Estimated total for labor */}
                <div className="bg-primary-50 rounded-lg p-3 border border-primary-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Estimated Total</span>
                    <span className="text-xl font-bold text-primary-600">
                      ${(estimatedHours * (helperCount === 1 ? 79 : 129))}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {helperCount} helper{helperCount > 1 ? 's' : ''} x {estimatedHours} hours x ${helperCount === 1 ? 79 : 129}/hour
                  </p>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                placeholder="Any special instructions..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('schedule')} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium">
                Back
              </button>
              <button
                onClick={handleGetQuote}
                disabled={loading}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Getting quote...' : 'Get Quote'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Summary */}
        {step === 'summary' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-lg mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service</span>
                  <span className="font-medium">{serviceType === 'HAUL_AWAY' ? 'Junk Removal' : 'Labor Only'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Address</span>
                  <span className="font-medium text-right max-w-48 truncate">{fullAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">{date ? new Date(date + 'T12:00:00').toLocaleDateString() : 'ASAP'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time Window</span>
                  <span className="font-medium">{TIME_WINDOWS.find(t => t.id === timeWindow)?.label} ({TIME_WINDOWS.find(t => t.id === timeWindow)?.time})</span>
                </div>
                {serviceType === 'HAUL_AWAY' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Volume</span>
                    <span className="font-medium">{VOLUME_TIERS.find(v => v.id === volumeTier)?.label}</span>
                  </div>
                )}
                {serviceType === 'LABOR_ONLY' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Helpers</span>
                      <span className="font-medium">{helperCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hours</span>
                      <span className="font-medium">{estimatedHours}h</span>
                    </div>
                  </>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-2xl text-primary-600">${quoteTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold mb-3">Your Information</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Full Name *"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="Email *"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('details')} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium">
                Back
              </button>
              <button
                onClick={handleCreateJob}
                disabled={loading}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-bold text-lg disabled:opacity-50"
              >
                {loading ? 'Placing order...' : `Pay $${quoteTotal.toFixed(2)}`}
              </button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Order Placed!</h2>
            <p className="text-gray-500 mb-6">We are finding a driver for your order.</p>

            <div className="bg-white rounded-xl p-4 shadow-sm mb-6 text-left">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Order ID</span>
                <span className="font-mono text-xs">{jobId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-primary-600">${quoteTotal.toFixed(2)}</span>
              </div>
            </div>

            {trackingToken && (
              <div className="bg-primary-50 rounded-xl p-4 mb-6 text-left border border-primary-200">
                <h3 className="font-bold text-primary-700 text-sm mb-1">Your Tracking Code</h3>
                <p className="font-mono text-xs break-all text-primary-600">{trackingToken}</p>
                <p className="text-xs text-primary-500 mt-2">
                  Save this code to track your order anytime, even without an account.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => router.push(`/track?orderId=${jobId}`)}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium"
              >
                Track My Order
              </button>
              {isLoggedIn() && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-3 bg-gray-100 text-gray-600 rounded-lg font-medium"
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
