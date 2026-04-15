'use client'

import { useState, useRef } from 'react'

interface LeadCaptureModalProps {
  selectedItems: string[]
  estimatedPrice: number
  serviceType: string
  itemDetails: Array<{ id: string; name: string; price: number; quantity?: number }>
  discountPercent?: number
  discountAmount?: number
  onClose: () => void
  onSuccess: () => void
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function unformatPhone(value: string): string {
  return value.replace(/\D/g, '')
}

// NJ ZIP code check: NJ ZIPs are 07001-08999 (start with 07 or 08)
function isNJZip(zip: string): boolean {
  const z = zip.replace(/\D/g, '').slice(0, 5)
  if (z.length !== 5) return false
  const num = parseInt(z, 10)
  return num >= 7001 && num <= 8999
}

// Items BLOCKED for NJ ZIP codes (solid waste / entulho — regulated by NJDEP)
// Furniture, appliances, electronics are ALLOWED because they are donation-eligible
const NJ_BLOCKED_ITEM_IDS = new Set([
  'garage_small', 'garage_medium', 'garage_large',
  'yard_partial', 'yard_full',
])

export default function LeadCaptureModal({
  selectedItems,
  estimatedPrice,
  serviceType,
  itemDetails,
  discountPercent = 0,
  discountAmount = 0,
  onClose,
  onSuccess,
}: LeadCaptureModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [zip, setZip] = useState('')
  const [tcpaConsent, setTcpaConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const phoneDigits = unformatPhone(phone)
  const isNJ = isNJZip(zip)
  // Check if any selected items are regulated (not allowed in NJ)
  const hasRegulatedItems = isNJ && itemDetails.some(item => NJ_BLOCKED_ITEM_IDS.has(item.id))
  const isValid = name.trim().length > 0 && phoneDigits.length === 10 && zip.length === 5 && tcpaConsent && !hasRegulatedItems

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || loading) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phoneDigits,
          zip_code: zip,
          items_selected: selectedItems,
          item_details: itemDetails,
          estimated_price: estimatedPrice,
          service_type: serviceType,
          tcpa_consent: tcpaConsent,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Something went wrong' }))
        throw new Error(data.error || 'Failed to submit')
      }

      // Store zip for the scheduling flow
      sessionStorage.setItem('hk_zip', zip)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
        {/* Header */}
        <div className="bg-teal-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Almost There!</h3>
              <p className="text-sm text-teal-100">Enter your info to lock in your quote</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Price summary */}
          <div className="mt-3 bg-teal-700/50 rounded-lg px-4 py-2">
            <p className="text-xl font-bold">${estimatedPrice.toFixed(2)}</p>
            {discountPercent > 0 && (
              <p className="text-xs text-green-300 font-medium">
                {discountPercent}% multi-item discount applied (-${discountAmount.toFixed(2)})
              </p>
            )}
            <p className="text-xs text-teal-200">
              {itemDetails.reduce((sum, i) => sum + (i.quantity || 1), 0)} item{itemDetails.reduce((sum, i) => sum + (i.quantity || 1), 0) !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="lead-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="lead-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Phone with US mask */}
          <div>
            <label htmlFor="lead-phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              id="lead-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(555) 123-4567"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* ZIP Code */}
          <div>
            <label htmlFor="lead-zip" className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code <span className="text-red-500">*</span>
            </label>
            <input
              id="lead-zip"
              type="text"
              inputMode="numeric"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="Enter 5-digit ZIP"
              required
              maxLength={5}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                hasRegulatedItems ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {hasRegulatedItems && (
              <div className="mt-2 p-3 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-sm text-red-700 font-medium">
                  We do not handle solid waste removal (Yard Debris, Garage Clearing) in New Jersey. Please go back and remove those items. Furniture, appliances, and electronics are available for Donation Pickup in NJ.
                </p>
              </div>
            )}
          </div>

          {/* TCPA Consent */}
          <div className="flex items-start gap-3">
            <input
              id="lead-tcpa"
              type="checkbox"
              checked={tcpaConsent}
              onChange={(e) => setTcpaConsent(e.target.checked)}
              required
              className="mt-1 h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <label htmlFor="lead-tcpa" className="text-xs text-gray-600 leading-relaxed">
              Yes, send me same-day deals and promos via text/call. Reply STOP to opt out. Message/data rates may apply.
            </label>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || loading}
            className={`w-full py-4 rounded-lg text-lg font-semibold transition shadow-lg ${
              isValid && !loading
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Submitting...' : 'See Availability & Book \u2192'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Your information is secure and will never be shared.
          </p>
        </form>
      </div>
    </div>
  )
}
