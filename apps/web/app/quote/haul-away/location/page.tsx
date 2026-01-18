'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuote } from '@/lib/QuoteContext'
import { checkServiceArea } from '@/lib/api'

export default function HaulAwayLocationPage() {
  const router = useRouter()
  const { data, updateData } = useQuote()
  
  const [address, setAddress] = useState(data.pickupAddress || '')
  const [date, setDate] = useState(data.scheduledFor || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleContinue = async () => {
    if (!address || !date) {
      setError('Please enter both address and date')
      return
    }

    setLoading(true)
    setError('')

    try {
      // For demo: use a fixed coordinate (Philadelphia)
      // In production, use Google Maps Geocoding API
      const lat = 39.9526
      const lng = -75.1652

      const result = await checkServiceArea(lat, lng)
      
      if (!result.covered) {
        setError('Sorry, we do not serve this area yet.')
        setLoading(false)
        return
      }

      updateData({
        serviceType: 'HAUL_AWAY',
        pickupAddress: address,
        pickupLat: lat,
        pickupLng: lng,
        serviceAreaId: result.serviceArea?.id || null,
        serviceAreaName: result.serviceArea?.name || '',
        scheduledFor: date,
      })

      router.push('/quote/haul-away/volume')
    } catch (err) {
      setError('Failed to check service area. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Junk Removal - Location & Time</h1>
          <p className="text-gray-600 mb-8">Where and when do you need service?</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Address *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, Philadelphia, PA 19103"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                We will check if we serve your area
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Date & Time *
              </label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Same-day service available ($50 surcharge)
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
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
