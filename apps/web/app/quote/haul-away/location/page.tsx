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
    // Get current values from inputs directly (not from state)
    const addressInput = document.querySelector('input[type="text"]') as HTMLInputElement
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    
    const addressValue = addressInput?.value?.trim() || ''
    const dateValue = dateInput?.value?.trim() || ''
    
    // Validate: need (ZIP OR Address) + Date
    if (!addressValue || addressValue.length < 3) {
      setError('Please enter a valid address or ZIP code')
      return
    }
    
    if (!dateValue) {
      setError('Please select a service date')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Geocode the address/ZIP to get coordinates
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressValue)}&countrycodes=us&limit=1`,
        { headers: { 'User-Agent': 'Haulkind/1.0' } }
      )
      
      if (!geocodeResponse.ok) {
        throw new Error('Geocoding failed')
      }
      
      const geocodeData = await geocodeResponse.json()
      
      if (!geocodeData || geocodeData.length === 0) {
        setError('Address not found. Please enter a valid US address or ZIP code.')
        setLoading(false)
        return
      }
      
      const lat = parseFloat(geocodeData[0].lat)
      const lng = parseFloat(geocodeData[0].lon)

      const result = await checkServiceArea(lat, lng)
      
      if (!result.covered) {
        setError('Sorry, we do not serve this area yet.')
        setLoading(false)
        return
      }

      // Use the full address from geocoding result
      const finalAddress = geocodeData[0].display_name || addressValue
      
      // Calculate preferredDateTime based on timeWindow
      const timeMap = {
        MORNING: '09:00',
        AFTERNOON: '13:00',
        EVENING: '17:00',
        ALL_DAY: '09:00'
      }
      const preferredDateTime = `${dateValue}T${timeMap[timeWindow]}:00`

      updateData({
        serviceType: 'HAUL_AWAY',
        pickupAddress: finalAddress,
        pickupLat: lat,
        pickupLng: lng,
        serviceAreaId: result.serviceArea?.id || null,
        serviceAreaName: result.serviceArea?.name || '',
        serviceDate: dateValue,
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
