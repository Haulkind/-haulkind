'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import LeadCaptureModal from './LeadCaptureModal'

// Pricing table for Junk Removal & Donation Pickup
const PRICED_ITEMS = [
  { id: 'sofa', name: 'Sofa / Couch', icon: '🛋️', price: 89 },
  { id: 'mattress', name: 'Mattress', icon: '🛏️', price: 75 },
  { id: 'table', name: 'Table', icon: '🪑', price: 45 },
  { id: 'chair', name: 'Chair', icon: '💺', price: 25 },
  { id: 'dresser', name: 'Dresser / Cabinet', icon: '🗄️', price: 65 },
  { id: 'refrigerator', name: 'Refrigerator', icon: '🧊', price: 129 },
  { id: 'washer', name: 'Washer / Dryer', icon: '🧺', price: 99 },
  { id: 'stove', name: 'Stove / Oven', icon: '🍳', price: 89 },
  { id: 'tv', name: 'TV', icon: '📺', price: 45 },
  { id: 'computer', name: 'Computer / Monitor', icon: '🖥️', price: 35 },
  { id: 'garage_small', name: 'Garage Cleanout (Small)', icon: '🏠', price: 399 },
  { id: 'garage_medium', name: 'Garage Cleanout (Medium)', icon: '🏡', price: 499 },
  { id: 'garage_large', name: 'Garage Cleanout (Large)', icon: '🏘️', price: 699 },
  { id: 'yard_partial', name: 'Yard Debris (Partial)', icon: '🌿', price: 299 },
  { id: 'yard_full', name: 'Yard Debris (Full Truck)', icon: '🌳', price: 899 },
]

const MINIMUM_VISIT_FEE = 99

export default function PriceCalculator() {
  const router = useRouter()
  const [serviceType, setServiceType] = useState<'junk-removal' | 'furniture-assembly' | 'mattress-swap' | 'labor' | 'donation'>('junk-removal')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)

  const toggleItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const next = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
      // GA4 event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'item_selected', {
          item_id: itemId,
          item_name: PRICED_ITEMS.find(i => i.id === itemId)?.name || itemId,
          selected: !prev.includes(itemId),
        })
      }
      return next
    })
  }, [])

  // Calculate total price with $99 minimum
  const rawTotal = selectedItems.reduce((sum, id) => {
    const item = PRICED_ITEMS.find(i => i.id === id)
    return sum + (item?.price || 0)
  }, 0)
  const displayPrice = Math.max(rawTotal, selectedItems.length > 0 ? MINIMUM_VISIT_FEE : 0)

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
          items_count: selectedItems.length,
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
        items_count: selectedItems.length,
        estimated_price: displayPrice,
      })
    }
    // Store selections for the scheduling flow
    sessionStorage.setItem('hk_selected_items', JSON.stringify(selectedItems))
    sessionStorage.setItem('hk_estimated_price', String(displayPrice))
    // Store full item details so summary page can show names + prices
    const itemDetails = selectedItems.map(id => {
      const item = PRICED_ITEMS.find(i => i.id === id)
      return { id, name: item?.name || id, price: item?.price || 0 }
    })
    sessionStorage.setItem('hk_item_details', JSON.stringify(itemDetails))
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

            {/* Service Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button
                onClick={() => setServiceType('junk-removal')}
                className={`relative p-4 rounded-lg border-2 text-left transition ${
                  serviceType === 'junk-removal'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Most Popular</span>
                <div className="font-semibold text-gray-900">Junk Removal</div>
                <div className="text-sm text-gray-500">Remove old furniture, appliances, and unwanted items</div>
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

          {/* Items Selection with prices - only for Junk Removal & Donation */}
          {isJunkOrDonation && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Items to Remove
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {PRICED_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`p-3 rounded-lg border-2 text-center transition relative ${
                      selectedItems.includes(item.id)
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {selectedItems.includes(item.id) && (
                      <span className="absolute top-1 right-1 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <div className="text-xs font-medium text-gray-700">{item.name}</div>
                    <div className="text-xs font-bold text-teal-600 mt-1">${item.price}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Price Display - only for Junk Removal & Donation */}
          {isJunkOrDonation && selectedItems.length > 0 && (
            <div className="mb-4 p-4 bg-teal-50 border border-teal-200 rounded-lg text-center">
              <p className="text-lg font-bold text-teal-800">
                Estimated: ${displayPrice} <span className="text-sm font-normal text-teal-600">· $99 Minimum Visit</span>
              </p>
              <p className="text-xs text-teal-600 mt-1">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected — disposal included, no hidden fees
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="text-center pt-4 border-t">
            {!isJunkOrDonation || selectedItems.length > 0 ? (
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
        selectedItems={selectedItems}
        estimatedPrice={displayPrice}
        serviceType={serviceType === 'donation' ? 'DONATION_PICKUP' : 'HAUL_AWAY'}
        itemDetails={selectedItems.map(id => {
          const item = PRICED_ITEMS.find(i => i.id === id)
          return { id, name: item?.name || id, price: item?.price || 0 }
        })}
        onClose={() => setShowModal(false)}
        onSuccess={handleLeadSuccess}
      />
    )}
  </>
  )
}
