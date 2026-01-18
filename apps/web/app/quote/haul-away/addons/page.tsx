'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuote } from '@/lib/QuoteContext'

const ADDONS = [
  { id: 'SAME_DAY', label: 'Same-Day Service', description: 'Get service today', price: 50 },
  { id: 'HEAVY_ITEM', label: 'Heavy Item', description: 'Items over 100 lbs (per item)', price: 25 },
  { id: 'STAIRS', label: 'Stairs', description: 'Per flight of stairs', price: 20 },
  { id: 'DISASSEMBLY', label: 'Disassembly', description: 'Furniture disassembly', price: 30 },
]

export default function HaulAwayAddonsPage() {
  const router = useRouter()
  const { data, updateData } = useQuote()
  const [selectedAddons, setSelectedAddons] = useState<string[]>(data.addons || [])

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    )
  }

  const handleContinue = () => {
    updateData({ addons: selectedAddons })
    router.push('/quote/haul-away/photos')
  }

  const handleSkip = () => {
    updateData({ addons: [] })
    router.push('/quote/haul-away/photos')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Add-Ons (Optional)</h1>
          <p className="text-gray-600 mb-8">Select any additional services you need</p>

          <div className="space-y-4">
            {ADDONS.map((addon) => (
              <button
                key={addon.id}
                onClick={() => toggleAddon(addon.id)}
                className={`w-full p-6 rounded-lg border-2 transition text-left ${
                  selectedAddons.includes(addon.id)
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mt-1 ${
                      selectedAddons.includes(addon.id)
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedAddons.includes(addon.id) && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">{addon.label}</h3>
                      <p className="text-gray-600">{addon.description}</p>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-primary-600">+${addon.price}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Skip
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
