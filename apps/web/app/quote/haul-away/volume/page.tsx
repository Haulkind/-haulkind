'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuote } from '@/lib/QuoteContext'

const VOLUME_TIERS = [
  { id: 'EIGHTH', label: '1/8 Truck', description: 'Small load (1-2 items)', price: 109 },
  { id: 'QUARTER', label: '1/4 Truck', description: 'Medium load (3-5 items)', price: 169 },
  { id: 'HALF', label: '1/2 Truck', description: 'Large load (6-10 items)', price: 279 },
  { id: 'THREE_QUARTER', label: '3/4 Truck', description: 'Very large load (11-15 items)', price: 389 },
  { id: 'FULL', label: 'Full Truck', description: 'Maximum capacity (16+ items)', price: 529 },
]

export default function HaulAwayVolumePage() {
  const router = useRouter()
  const { data, updateData } = useQuote()
  const [selectedVolume, setSelectedVolume] = useState(data.volumeTier || '')

  const handleContinue = () => {
    if (!selectedVolume) {
      alert('Please select a volume tier')
      return
    }

    updateData({ volumeTier: selectedVolume })
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
                    <div className="text-sm text-gray-500">+ disposal</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Prices include up to $50 in disposal fees. If disposal costs exceed $50, you pay the difference (driver provides receipt).
            </p>
          </div>

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
