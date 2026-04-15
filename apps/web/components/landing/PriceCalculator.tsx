'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import LeadCaptureModal from './LeadCaptureModal'

// NJ ZIP code check: NJ ZIPs are 07001-08999 (start with 07 or 08)
function isNJZip(zip: string): boolean {
  const z = zip.replace(/\D/g, '').slice(0, 5)
  if (z.length !== 5) return false
  const num = parseInt(z, 10)
  return num >= 7001 && num <= 8999
}

// Pricing table for Hauling (Haul Away) & Donation Pickup
const PRICED_ITEMS = [
  { id: 'sofa', name: 'Sofa / Couch', icon: '🛋️', price: 89 },
  { id: 'sofa_set_2', name: 'Sofa Set (2-Piece)', icon: '🛋️', price: 170 },
  { id: 'sofa_set_3', name: 'Sofa Set (3-Piece)', icon: '🛋️', price: 190 },
  { id: 'mattress', name: 'Mattress', icon: '🛏️', price: 75 },
  { id: 'table', name: 'Table', icon: '🪑', price: 45 },
  { id: 'chair', name: 'Chair', icon: '💺', price: 25 },
  { id: 'dresser', name: 'Dresser / Cabinet', icon: '🗄️', price: 65 },
  { id: 'refrigerator', name: 'Refrigerator', icon: '🧊', price: 129 },
  { id: 'washer', name: 'Washer / Dryer', icon: '🧺', price: 99 },
  { id: 'stove', name: 'Stove / Oven', icon: '🍳', price: 89 },
  { id: 'tv', name: 'TV', icon: '📺', price: 45 },
  { id: 'computer', name: 'Computer / Monitor', icon: '🖥️', price: 35 },
  { id: 'garage_small', name: 'Garage Clearing (Small)', icon: '🏠', price: 399 },
  { id: 'garage_medium', name: 'Garage Clearing (Medium)', icon: '🏡', price: 499 },
  { id: 'garage_large', name: 'Garage Clearing (Large)', icon: '🏘️', price: 699 },
  { id: 'yard_partial', name: 'Yard Debris (Partial)', icon: '🌿', price: 299 },
  { id: 'yard_full', name: 'Yard Debris (Full Truck)', icon: '🌳', price: 899 },
]

// Items allowed for NJ ZIP codes (non-regulated services)
const NJ_ALLOWED_ITEMS = new Set([
  'garage_small', 'garage_medium', 'garage_large',
  'yard_partial', 'yard_full',
])

const MINIMUM_VISIT_FEE = 99
const MULTI_ITEM_DISCOUNT_PERCENT = 5

export default function PriceCalculator() {
  const router = useRouter()
  const [serviceType, setServiceType] = useState<'junk-removal' | 'furniture-assembly' | 'mattress-swap' | 'labor' | 'donation'>('junk-removal')
  // Quantity map: itemId -> quantity (0 means not selected)
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({})
  const [showModal, setShowModal] = useState(false)
  // NJ ZIP code compliance check
  const [userZip, setUserZip] = useState('')
  const isNJ = isNJZip(userZip)
  const junkRemovalBlocked = isNJ

  const setQuantity = useCallback((itemId: string, qty: number) => {
    setItemQuantities(prev => {
      const next = { ...prev }
      if (qty <= 0) {
        delete next[itemId]
      } else {
        next[itemId] = qty
      }
      // GA4 event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'item_selected', {
          item_id: itemId,
          item_name: PRICED_ITEMS.find(i => i.id === itemId)?.name || itemId,
          quantity: qty,
        })
      }
      return next
    })
  }, [])

  // Count total number of individual items (sum of all quantities)
  const totalItemCount = Object.values(itemQuantities).reduce((sum, qty) => sum + qty, 0)

  // Calculate subtotal (before discount)
  const subtotal = Object.entries(itemQuantities).reduce((sum, [id, qty]) => {
    const item = PRICED_ITEMS.find(i => i.id === id)
    return sum + (item?.price || 0) * qty
  }, 0)

  // Calculate discount: each additional item beyond the first gets 5% off ITS OWN price
  // E.g. Sofa $89 (full) + Dresser $65 → $61.75 (5% off) + Fridge $129 → $122.55 (5% off)
  const additionalItemCount = Math.max(0, totalItemCount - 1)
  const discountAmount = (() => {
    if (additionalItemCount === 0) return 0
    // Sort items by price descending — first (most expensive) item pays full price
    const allItems: { price: number }[] = []
    Object.entries(itemQuantities).forEach(([id, qty]) => {
      const item = PRICED_ITEMS.find(i => i.id === id)
      if (item) {
        for (let i = 0; i < qty; i++) allItems.push({ price: item.price })
      }
    })
    allItems.sort((a, b) => b.price - a.price)
    // First item = full price, all others get 5% off their own price
    let discount = 0
    for (let i = 1; i < allItems.length; i++) {
      discount += allItems[i].price * (MULTI_ITEM_DISCOUNT_PERCENT / 100)
    }
    return Math.round(discount * 100) / 100
  })()
  const rawTotal = Math.round((subtotal - discountAmount) * 100) / 100

  const displayPrice = Math.max(rawTotal, totalItemCount > 0 ? MINIMUM_VISIT_FEE : 0)

  // Build selected items list (for storage and display)
  const selectedItemsList = Object.entries(itemQuantities)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item = PRICED_ITEMS.find(i => i.id === id)
      return { id, name: item?.name || id, price: item?.price || 0, quantity: qty }
    })

  const handleGetQuote = () => {
    // Fire Google Ads conversion event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'ads_conversion_Solicitar_cota_o_1', {})
    }

    // For Junk Removal & Donation: show Lead Capture Modal
    if (serviceType === 'junk-removal' || serviceType === 'donation') {
      // GA4: lead_capture_start
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'lead_capture_start', {
          service_type: serviceType,
          items_count: totalItemCount,
          estimated_price: displayPrice,
        })
      }
      setShowModal(true)
      return
    }

    // Other services redirect directly (unchanged behavior)
    if (serviceType === 'mattress-swap') {
      router.push('/quote/mattress-swap')
    } else if (serviceType === 'furniture-assembly') {
      router.push('/quote/assembly')
    } else {
      router.push('/quote/labor-only/hours')
    }
  }

  const handleLeadSuccess = () => {
    // GA4: lead_capture_success
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'lead_capture_success', {
        service_type: serviceType,
        items_count: totalItemCount,
        estimated_price: displayPrice,
      })
    }
    // Store selections for the scheduling flow (backward compat: flat list of item IDs)
    const flatSelectedIds = selectedItemsList.flatMap(item =>
      Array(item.quantity).fill(item.id)
    )
    sessionStorage.setItem('hk_selected_items', JSON.stringify(flatSelectedIds))
    sessionStorage.setItem('hk_estimated_price', String(displayPrice))
    // Store full item details with quantities so summary page can show names + prices + qty
    const itemDetails = selectedItemsList.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }))
    sessionStorage.setItem('hk_item_details', JSON.stringify(itemDetails))
    // Store discount info
    sessionStorage.setItem('hk_discount_percent', String(additionalItemCount > 0 ? MULTI_ITEM_DISCOUNT_PERCENT : 0))
    sessionStorage.setItem('hk_discount_amount', String(discountAmount))
    // Store service type so location page can distinguish HAUL_AWAY vs DONATION_PICKUP
    sessionStorage.setItem('hk_service_type', serviceType === 'donation' ? 'DONATION_PICKUP' : 'HAUL_AWAY')
    // Redirect to the scheduling/location page
    router.push('/quote/haul-away/location')
  }

  const isJunkOrDonation = serviceType === 'junk-removal' || serviceType === 'donation'

  return (
    <>
      <section id="calculator" className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get Your Instant Quote
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select items and get guaranteed pricing in 30 seconds. No hidden fees.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-gray-50 rounded-2xl p-6 md:p-8 shadow-lg">
            {/* Header with price icon */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Get Instant Quote</h3>
                <p className="text-sm text-gray-500">Select your items and get transparent pricing in seconds</p>
              </div>
            </div>

            {/* ZIP Code Check */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your ZIP Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={userZip}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 5)
                setUserZip(val)
                // Auto-switch away from junk-removal if NJ ZIP detected
                if (isNJZip(val)) {
                  if (serviceType === 'junk-removal') {
                    setServiceType('donation')
                  }
                  // Clear any regulated (non-allowed) items for NJ
                  setItemQuantities(prev => {
                    const filtered: Record<string, number> = {}
                    for (const [id, qty] of Object.entries(prev)) {
                      if (NJ_ALLOWED_ITEMS.has(id)) filtered[id] = qty
                    }
                    return filtered
                  })
                }
              }}
              placeholder="Enter your ZIP code"
              className="w-full sm:w-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            />
            {junkRemovalBlocked && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">
                  ⚠️ We do not handle hauling or solid waste removal in New Jersey (NJDEP regulation). For NJ, only Yard Debris and Garage Clearing are available. For other services, choose Moving Labor or Furniture Assembly.
                </p>
              </div>
            )}
          </div>

            {/* Service Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button
                onClick={() => { if (!junkRemovalBlocked) setServiceType('junk-removal') }}
                disabled={junkRemovalBlocked}
                className={`relative p-4 rounded-lg border-2 text-left transition ${
                  junkRemovalBlocked
                    ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                    : serviceType === 'junk-removal'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">PA Only</span>
                <div className="font-semibold text-gray-900">Hauling (Haul Away) <span className="text-xs text-orange-600 font-bold">(PA Only)</span></div>
                <div className="text-sm text-gray-500">Haul away old furniture, appliances, and other items</div>
                {junkRemovalBlocked && <div className="text-xs text-red-500 mt-1 font-medium">Not available for NJ addresses</div>}
              </button>
              <button
                onClick={() => setServiceType('donation')}
                className={`relative p-4 rounded-lg border-2 text-left transition ${
                  serviceType === 'donation'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="absolute top-2 right-2 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>
                <div className="font-semibold text-gray-900">Donation Pickup</div>
                <div className="text-sm text-gray-500">We deliver to local charities. Tax receipt available</div>
              </button>
              <button
                onClick={() => setServiceType('mattress-swap')}
                className={`relative p-4 rounded-lg border-2 text-left transition ${
                  serviceType === 'mattress-swap'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="absolute top-2 right-2 bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Hassle-Free</span>
                <div className="font-semibold text-gray-900">Mattress Swap</div>
                <div className="text-sm text-gray-500">We handle the heavy lifting — remove old, set up new</div>
              </button>
              <button
                onClick={() => setServiceType('labor')}
                className={`relative p-4 rounded-lg border-2 text-left transition ${
                  serviceType === 'labor'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="absolute top-2 right-2 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Hourly</span>
                <div className="font-semibold text-gray-900">Moving Labor</div>
                <div className="text-sm text-gray-500">On-demand muscle for heavy lifting and loading</div>
              </button>
              <button
                onClick={() => setServiceType('furniture-assembly')}
                className={`relative p-4 rounded-lg border-2 text-left transition ${
                  serviceType === 'furniture-assembly'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>
                <div className="font-semibold text-gray-900">Furniture Assembly</div>
                <div className="text-sm text-gray-500">Professional assembly for IKEA, Wayfair &amp; more</div>
              </button>
            </div>
          </div>

          {/* Multi-item discount banner */}
          {isJunkOrDonation && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <span className="text-lg">🏷️</span>
              <p className="text-sm text-green-800 font-medium">
                <strong>Multi-item discount:</strong> Save 5% for each additional item! The more you haul, the more you save.
              </p>
            </div>
          )}

          {/* Items Selection with prices and quantity - only for Junk Removal & Donation */}
          {isJunkOrDonation && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Items
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {PRICED_ITEMS.map((item) => {
                  const qty = itemQuantities[item.id] || 0
                  const isSelected = qty > 0
                  const isBlockedForNJ = isNJ && !NJ_ALLOWED_ITEMS.has(item.id)
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border-2 text-center transition relative ${
                        isBlockedForNJ
                          ? 'border-gray-200 bg-gray-100 opacity-40 cursor-not-allowed'
                          : isSelected
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {isBlockedForNJ && (
                        <span className="absolute top-1 left-1 text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full z-10">NJ blocked</span>
                      )}
                      {isSelected && (
                        <span className="absolute top-1 right-1 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="text-xs font-medium text-gray-700">{item.name}</div>
                      <div className="text-xs font-bold text-teal-600 mt-1">${item.price}</div>

                      {/* Quantity controls */}
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => { if (!isBlockedForNJ) setQuantity(item.id, qty - 1) }}
                          disabled={qty === 0 || isBlockedForNJ}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition ${
                            qty === 0 || isBlockedForNJ
                              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                              : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                          }`}
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-gray-800">{qty}</span>
                        <button
                          type="button"
                          onClick={() => { if (!isBlockedForNJ) setQuantity(item.id, qty + 1) }}
                          disabled={isBlockedForNJ}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition ${
                            isBlockedForNJ
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-teal-500 text-white hover:bg-teal-600'
                          }`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Live Price Display - only for Junk Removal & Donation */}
          {isJunkOrDonation && totalItemCount > 0 && (
            <div className="mb-4 p-4 bg-teal-50 border border-teal-200 rounded-lg text-center">
              {discountAmount > 0 ? (
                <>
                  <p className="text-sm text-gray-500 line-through mb-1">
                    Subtotal: ${subtotal.toFixed(2)}
                  </p>
                  <p className="text-sm font-semibold text-green-600 mb-1">
                    🏷️ 5% off each extra item: -${discountAmount.toFixed(2)}
                  </p>
                  <p className="text-lg font-bold text-teal-800">
                    Total: ${displayPrice.toFixed(2)} <span className="text-sm font-normal text-teal-600">· $99 Minimum Visit</span>
                  </p>
                </>
              ) : (
                <p className="text-lg font-bold text-teal-800">
                  Estimated: ${displayPrice.toFixed(2)} <span className="text-sm font-normal text-teal-600">· $99 Minimum Visit</span>
                </p>
              )}
              <p className="text-xs text-teal-600 mt-1">
                {totalItemCount} item{totalItemCount !== 1 ? 's' : ''} selected — all-in pricing, no hidden fees
                {totalItemCount === 1 && ' · Add more items to save 5% each!'}
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="text-center pt-4 border-t">
            {!isJunkOrDonation || totalItemCount > 0 ? (
              <button
                onClick={handleGetQuote}
                className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition shadow-lg"
              >
                {isJunkOrDonation ? 'Get My Instant Quote →' : 'Continue to Pricing →'}
              </button>
            ) : (
              <p className="text-gray-500 py-4">
                Select items above to see your instant quote
              </p>
            )}
          </div>
        </div>
      </div>
    </section>

    {/* Lead Capture Modal */}
    {showModal && (
      <LeadCaptureModal
        selectedItems={selectedItemsList.flatMap(item => Array(item.quantity).fill(item.id))}
        estimatedPrice={displayPrice}
        serviceType={serviceType === 'donation' ? 'DONATION_PICKUP' : 'HAUL_AWAY'}
        itemDetails={selectedItemsList.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }))}
        discountPercent={additionalItemCount > 0 ? MULTI_ITEM_DISCOUNT_PERCENT : 0}
        discountAmount={discountAmount}
        onClose={() => setShowModal(false)}
        onSuccess={handleLeadSuccess}
      />
    )}
  </>
  )
}
