'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuote } from '@/lib/QuoteContext'

export default function LaborOnlyHoursPage() {
  const router = useRouter()
  const { data, updateData } = useQuote()
  const [hours, setHours] = useState(data.estimatedHours || 2)
  const [helpers, setHelpers] = useState(data.helperCount || 1)

  const hourlyRate = helpers === 1 ? 79 : 129
  const estimatedTotal = hours * hourlyRate

  const handleContinue = () => {
    if (hours < 2) {
      alert('Minimum 2 hours required')
      return
    }

    updateData({
      estimatedHours: hours,
      helperCount: helpers,
    })
    router.push('/quote/labor-only/details')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Select Hours & Helpers</h1>
          <p className="text-gray-600 mb-8">How many hours and helpers do you need?</p>

          <div className="space-y-8">
            {/* Helper Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Number of Helpers
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setHelpers(1)}
                  className={`p-6 rounded-lg border-2 transition ${
                    helpers === 1
                      ? 'border-secondary-600 bg-secondary-50'
                      : 'border-gray-200 hover:border-secondary-300'
                  }`}
                >
                  <div className="text-2xl font-bold mb-2">1 Helper</div>
                  <div className="text-secondary-600 font-semibold">$79/hour</div>
                </button>
                <button
                  onClick={() => setHelpers(2)}
                  className={`p-6 rounded-lg border-2 transition ${
                    helpers === 2
                      ? 'border-secondary-600 bg-secondary-50'
                      : 'border-gray-200 hover:border-secondary-300'
                  }`}
                >
                  <div className="text-2xl font-bold mb-2">2 Helpers</div>
                  <div className="text-secondary-600 font-semibold">$129/hour</div>
                </button>
              </div>
            </div>

            {/* Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Estimated Hours (2 hour minimum)
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setHours(Math.max(2, hours - 1))}
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 hover:border-secondary-600 transition flex items-center justify-center text-2xl font-bold"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <div className="text-4xl font-bold">{hours}</div>
                  <div className="text-gray-600">hours</div>
                </div>
                <button
                  onClick={() => setHours(hours + 1)}
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 hover:border-secondary-600 transition flex items-center justify-center text-2xl font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Estimate */}
            <div className="bg-secondary-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Estimated Total</span>
                <span className="text-3xl font-bold text-secondary-600">${estimatedTotal}</span>
              </div>
              <p className="text-sm text-gray-600">
                {helpers} helper{helpers > 1 ? 's' : ''} × {hours} hours × ${hourlyRate}/hour
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Note:</strong> Final price may vary if job takes longer or shorter than estimated.
              </p>
            </div>
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
              className="flex-1 px-6 py-3 bg-secondary-600 text-white rounded-lg font-medium hover:bg-secondary-700 transition"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
