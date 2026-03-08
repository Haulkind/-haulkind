'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuote } from '@/lib/QuoteContext'

const VOLUME_TIERS = [
  { id: 'EIGHTH', label: '1/8 Truck', description: 'Small load (1-2 items)', price: 99, disposal: 10 },
  { id: 'QUARTER', label: '1/4 Truck', description: 'Medium load (3-5 items)', price: 189, disposal: 20 },
  { id: 'HALF', label: '1/2 Truck', description: 'Large load (6-10 items)', price: 314, disposal: 35 },
  { id: 'THREE_QUARTER', label: '3/4 Truck', description: 'Very large load (11-15 items)', price: 439, disposal: 50 },
  { id: 'FULL', label: 'Full Truck', description: 'Maximum capacity (16+ items)', price: 599, disposal: 70 },
]

export default function HaulAwayVolumePage() {
  const router = useRouter()
  const { data, updateData } = useQuote()
  const [selectedVolume, setSelectedVolume] = useState(data.volumeTier || '')
  const [pickupType, setPickupType] = useState<'IN_HOME' | 'CURBSIDE'>(data.addons?.includes('CURBSIDE') ? 'CURBSIDE' : 'IN_HOME')

  const handleContinue = () => {
    if (!selectedVolume) {
      alert('Please select a volume tier')
      return
    }

    const addons = pickupType === 'CURBSIDE'
      ? [...(data.addons || []).filter(a => a !== 'CURBSIDE'), 'CURBSIDE']
      : (data.addons || []).filter(a => a !== 'CURBSIDE')
    updateData({ volumeTier: selectedVolume, addons })
    router.push('/quote/haul-away/addons')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Select Volume</h1>
          <p className="text-gray-600 mb-8">How much junk do you need removed?</p>

          <div className="space-y-4">
            {VOLUME_TIERS.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedVolume(tier.id)}
                className={`w-full p-6 rounded-lg border-2 transition text-left ${
                  selectedVolume === tier.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{tier.label}</h3>
                    <p className="text-gray-600">{tier.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">${tier.price}</div>
                    <div className="text-sm text-green-600 font-medium">Disposal included</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Curbside vs In-Home toggle */}
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Where are your items?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPickupType('IN_HOME')}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  pickupType === 'IN_HOME'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="font-semibold text-sm">In-Home Pickup</div>
                <p className="text-xs text-gray-500 mt-1">We come inside &amp; carry items out</p>
              </button>
              <button
                onClick={() => setPickupType('CURBSIDE')}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  pickupType === 'CURBSIDE'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="font-semibold text-sm">Curbside Pickup <span className="text-green-600">— Save $5</span></div>
                <p className="text-xs text-gray-500 mt-1">Items already outside at the curb</p>
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-900">
              <strong>All-in pricing.</strong> Disposal fee already included in every price above — paid directly to your driver. No per-mile charges. No surprises.
            </p>
          </div>

          {/* Inline comparison */}
          <p className="mt-3 text-[11px] text-gray-400 italic text-center">
            1-800-GOT-JUNK charges $400-600 for a half truck — and doesn&apos;t show you the price until they arrive.
          </p>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
