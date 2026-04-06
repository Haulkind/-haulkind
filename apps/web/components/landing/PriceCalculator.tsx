'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Visual items for selection - NO PRICING LOGIC HERE
// Actual pricing comes from backend via existing checkout flow
const items = [
  { id: 'sofa', name: 'Sofa/Couch', icon: '🛋️' },
  { id: 'mattress', name: 'Mattress', icon: '🛏️' },
  { id: 'table', name: 'Table', icon: '🪑' },
  { id: 'chair', name: 'Chair', icon: '💺' },
  { id: 'dresser', name: 'Dresser/Cabinet', icon: '🗄️' },
  { id: 'refrigerator', name: 'Refrigerator', icon: '🧊' },
  { id: 'washer', name: 'Washer/Dryer', icon: '🧺' },
  { id: 'stove', name: 'Stove/Oven', icon: '🍳' },
  { id: 'tv', name: 'TV (any size)', icon: '📺' },
  { id: 'computer', name: 'Computer/Monitor', icon: '🖥️' },
]

const loadSizes = [
  { id: 'quarter', name: '1/4 Truck', description: '1-3 items' },
  { id: 'half', name: '1/2 Truck', description: '4-8 items' },
  { id: 'full', name: 'Full Truck', description: '9+ items' },
]

export default function PriceCalculator() {
  const router = useRouter()
  const [zipCode, setZipCode] = useState('')
  const [zipValid, setZipValid] = useState<boolean | null>(null)
  const [serviceType, setServiceType] = useState<'junk-removal' | 'furniture-assembly' | 'mattress-swap' | 'labor' | 'donation' | 'property-cleanout' | 'electronics-disposal'>('junk-removal')
  const [loadSize, setLoadSize] = useState<string>('quarter')
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const handleZipCheck = () => {
    // Simple validation - actual service area check happens in checkout
    if (zipCode.length === 5) {
      setZipValid(true)
      sessionStorage.setItem('hk_zip', zipCode)
    } else {
      setZipValid(false)
    }
  }

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleGetQuote = () => {
    // Fire Google Ads conversion event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'ads_conversion_Solicitar_cota_o_1', {});
    }
    // Store selections in sessionStorage for the checkout flow
    sessionStorage.setItem('hk_zip', zipCode)
    sessionStorage.setItem('hk_selected_items', JSON.stringify(selectedItems))
    sessionStorage.setItem('hk_load_size', loadSize)
    
    // Redirect to existing checkout flow - backend handles all pricing
    if (serviceType === 'junk-removal' || serviceType === 'property-cleanout' || serviceType === 'electronics-disposal') {
      router.push('/quote?service=haul-away')
    } else if (serviceType === 'donation') {
      router.push('/quote?service=donation')
    } else if (serviceType === 'mattress-swap') {
      router.push('/quote/mattress-swap')
    } else if (serviceType === 'furniture-assembly') {
      router.push('/quote/assembly')
    } else {
      router.push('/quote/labor-only/hours')
    }
  }

  return (
    <section className="py-16 md:py-20 bg-white">
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

          {/* ZIP Code */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Location
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={zipCode}
                onChange={(e) => {
                  setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))
                  setZipValid(null)
                }}
                placeholder="Enter ZIP code (e.g., 10001)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                maxLength={5}
              />
              <button
                onClick={handleZipCheck}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition"
              >
                Check
              </button>
            </div>
            {zipValid === true && (
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                ZIP code saved
              </p>
            )}
            {zipValid === false && (
              <p className="text-red-600 text-sm mt-1">Please enter a valid 5-digit ZIP code</p>
            )}
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
              <button
                onClick={() => setServiceType('property-cleanout')}
                className={`relative p-4 rounded-lg border-2 text-left transition ${
                  serviceType === 'property-cleanout'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Full Service</span>
                <div className="font-semibold text-gray-900">Property Cleanout</div>
                <div className="text-sm text-gray-500">Complete clearing for homes, estates &amp; offices</div>
              </button>
              <button
                onClick={() => setServiceType('electronics-disposal')}
                className={`relative p-4 rounded-lg border-2 text-left transition ${
                  serviceType === 'electronics-disposal'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="absolute top-2 right-2 bg-cyan-100 text-cyan-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Eco-Friendly</span>
                <div className="font-semibold text-gray-900">Electronics Disposal</div>
                <div className="text-sm text-gray-500">Certified e-waste recycling with secure data destruction</div>
              </button>
            </div>
          </div>

          {/* Load Size - only for Junk Removal */}
          {(serviceType === 'junk-removal' || serviceType === 'donation' || serviceType === 'property-cleanout' || serviceType === 'electronics-disposal') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Load Size
              </label>
              <div className="grid grid-cols-3 gap-3">
                {loadSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setLoadSize(size.id)}
                    className={`p-4 rounded-lg border-2 text-center transition ${
                      loadSize === size.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{size.name}</div>
                    <div className="text-sm text-gray-500">{size.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Items Selection - only for Junk Removal */}
          {(serviceType === 'junk-removal' || serviceType === 'donation' || serviceType === 'property-cleanout' || serviceType === 'electronics-disposal') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Items to Remove
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`p-3 rounded-lg border-2 text-center transition ${
                      selectedItems.includes(item.id)
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <div className="text-xs font-medium text-gray-700">{item.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center pt-4 border-t">
            {!['junk-removal', 'donation', 'property-cleanout', 'electronics-disposal'].includes(serviceType) || selectedItems.length > 0 ? (
              <button
                onClick={handleGetQuote}
                className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition shadow-lg"
              >
                {['junk-removal', 'donation', 'property-cleanout', 'electronics-disposal'].includes(serviceType) ? 'Get My Instant Quote →' : 'Continue to Pricing →'}
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
  )
}
