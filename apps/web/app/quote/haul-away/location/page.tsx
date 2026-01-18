'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuote } from '@/lib/QuoteContext'
import { checkServiceArea } from '@/lib/api'
import { format } from 'date-fns'

type TimeWindow = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ALL_DAY'

export default function HaulAwayLocationPage() {
  const router = useRouter()
  const { data, updateData } = useQuote()
  
  const [address, setAddress] = useState(data.pickupAddress || '')
  const [serviceDate, setServiceDate] = useState(
    data.serviceDate || ''
  )
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(data.timeWindow || 'ALL_DAY')
  const [asap, setAsap] = useState(data.asap || false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleContinue = async () => {
    if (!address || !serviceDate) {
      setError('Please enter both address and date')
      return
    }

    setLoading(true)
    setError('')

    try {
      // For demo: use a fixed coordinate (Philadelphia)
      const lat = 39.9526
      const lng = -75.1652

      const result = await checkServiceArea(lat, lng)
      
      if (!result.covered) {
        setError('Sorry, we do not serve this area yet.')
        setLoading(false)
        return
      }

      // Calculate preferredDateTime based on timeWindow
      const timeMap = {
        MORNING: '09:00',
        AFTERNOON: '13:00',
        EVENING: '17:00',
        ALL_DAY: '09:00'
      }
      const preferredDateTime = `${serviceDate}T${timeMap[timeWindow]}:00`

      updateData({
        serviceType: 'HAUL_AWAY',
        pickupAddress: address,
        pickupLat: lat,
        pickupLng: lng,
        serviceAreaId: result.serviceArea?.id || null,
        serviceAreaName: result.serviceArea?.name || '',
        serviceDate,
        timeWindow,
        asap,
        scheduledFor: preferredDateTime,
        preferredDateTime,
      })

      router.push('/quote/haul-away/volume')
    } catch (err) {
      setError('Failed to check service area. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-[760px]">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-2">Junk Removal - Location & Time</h1>
          <p className="text-sm text-gray-600 mb-5">Where and when do you need service?</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Service Address *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, Philadelphia, PA 19103"
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                We will check if we serve your area
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                When would you like your items picked up? *
              </label>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Service Date */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">
                    1. Select your pickup date
                  </label>
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                  />
                </div>

                {/* Time Window */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">
                    2. Select your pickup time
                  </label>
                  <select
                    value={timeWindow}
                    onChange={(e) => setTimeWindow(e.target.value as TimeWindow)}
                    className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent bg-white"
                  >
                    <option value="ALL_DAY">All Day (8AM - 8PM)</option>
                    <option value="MORNING">Morning (8AM - 12PM)</option>
                    <option value="AFTERNOON">Afternoon (12PM - 4PM)</option>
                    <option value="EVENING">Evening (4PM - 8PM)</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                We allow scheduling for next day up to 90 days in advance! Dates that are grey are unavailable.
              </p>
            </div>

            {/* ASAP Checkbox */}
            <div className="flex items-start gap-2.5 max-w-[680px]">
              <input
                type="checkbox"
                id="asap"
                checked={asap}
                onChange={(e) => setAsap(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
              />
              <label htmlFor="asap" className="text-xs text-gray-700 leading-relaxed">
                ⚡ Would you like us to complete your order as soon as possible?
                If we can accommodate an earlier time and/or date, we will contact you to verify the time your booking is placed. If we are unable to come sooner, we will work your order according to your scheduled date/time you've selected.
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-[2] h-11 px-6 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={loading}
                className="flex-[3] h-11 px-6 text-sm font-medium text-white bg-secondary-600 rounded-lg hover:bg-secondary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
