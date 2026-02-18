'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuote } from '@/lib/QuoteContext'
import { checkServiceArea } from '@/lib/api'
import AddressAutocomplete from '@/components/AddressAutocomplete'

type TimeWindow = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ALL_DAY'

export default function HaulAwayLocationPage() {
  const router = useRouter()
  const { data, updateData } = useQuote()
  
  // TASK 4: Customer Info fields (required)
  const [fullName, setFullName] = useState(data.customerName || '')
  const [phone, setPhone] = useState(data.customerPhone || '')
  const [email, setEmail] = useState(data.customerEmail || '')
  
  // TASK 5: Structured address fields (required)
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  
  // Address autocomplete state
  const [addressSelected, setAddressSelected] = useState(false)
  const [fieldsLocked, setFieldsLocked] = useState(false)
  const [selectedLat, setSelectedLat] = useState<number | null>(null)
  const [selectedLng, setSelectedLng] = useState<number | null>(null)
  
  const [serviceDate, setServiceDate] = useState(data.serviceDate || '')
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(data.timeWindow || 'ALL_DAY')
  const [asap, setAsap] = useState(data.asap || false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // TASK 3: Track if user has attempted to continue (for error display)
  const [hasAttemptedContinue, setHasAttemptedContinue] = useState(false)
  const [formIsValid, setFormIsValid] = useState(false)

  // Force re-validation whenever form fields change
  useEffect(() => {
    const valid = (
      fullName.trim().length > 0 &&
      phone.trim().length >= 10 &&
      email.trim().length > 0 &&
      email.includes('@') &&
      street.trim().length > 0 &&
      city.trim().length > 0 &&
      state.trim().length === 2 &&
      zip.trim().length === 5 &&
      (asap || serviceDate.trim().length > 0)
    )
    console.log('[useEffect validation]', { fullName, phone, email, street, city, state, zip, serviceDate, valid })
    setFormIsValid(valid)
  }, [fullName, phone, email, street, city, state, zip, serviceDate])

  // TASK 2: Pre-fill ZIP from sessionStorage on mount
  useEffect(() => {
    const storedZip = sessionStorage.getItem('hk_zip')
    if (storedZip && !zip) {
      setZip(storedZip)
    }
  }, [])

  // Handle address selection from autocomplete
  const handleAddressSelect = (components: any) => {
    console.log('[ADDRESS SELECT]', components)
    setStreet(components.street)
    setCity(components.city)
    setState(components.state)
    setZip(components.zip)
    setSelectedLat(components.lat)
    setSelectedLng(components.lng)
    setAddressSelected(true)
    setFieldsLocked(true)
    setError('') // Clear any previous errors
  }

  // Handle manual street address change (resets selection)
  const handleStreetChange = (value: string) => {
    setStreet(value)
    setError('') // Clear error when user edits address
    if (addressSelected) {
      setAddressSelected(false)
      setFieldsLocked(false)
      setSelectedLat(null)
      setSelectedLng(null)
    }
  }

  // Clear error when any address field changes
  const handleCityChange = (value: string) => {
    setCity(value)
    setError('') // Clear error when user edits address
  }

  const handleStateChange = (value: string) => {
    setState(value.toUpperCase().slice(0, 2))
    setError('') // Clear error when user edits address
  }

  const handleZipChange = (value: string) => {
    setZip(value.replace(/\D/g, '').slice(0, 5))
    setError('') // Clear error when user edits address
  }

  // Unlock fields for editing
  const handleUnlockFields = () => {
    setFieldsLocked(false)
  }

  // TASK 6: Check if all required fields are filled
  const isFormValid = () => {
    const valid = (
      fullName.trim().length > 0 &&
      phone.trim().length >= 10 &&
      email.trim().length > 0 &&
      email.includes('@') &&
      street.trim().length > 0 &&
      city.trim().length > 0 &&
      state.trim().length === 2 &&
      zip.trim().length === 5 &&
      (asap || serviceDate.trim().length > 0)
    )
    console.log('[isFormValid]', { fullName, phone, email, street, city, state, zip, serviceDate, valid })
    return valid
  }

  const handleContinue = async () => {
    console.log('[handleContinue] CALLED!')
    setHasAttemptedContinue(true)
    
    // Validate all required fields
    if (!fullName.trim()) {
      setError('Please enter your full name')
      return
    }
    
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number')
      return
    }
    
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    
    if (!street.trim()) {
      setError('Please enter your street address')
      return
    }
    
    if (!city.trim()) {
      setError('Please enter your city')
      return
    }
    
    if (!state.trim() || state.length !== 2) {
      setError('Please enter a valid 2-letter state code')
      return
    }
    
    if (!zip.trim() || zip.length !== 5) {
      setError('Please enter a valid 5-digit ZIP code')
      return
    }
    
    if (!asap && !serviceDate.trim()) {
      setError('Please select a service date or check ASAP')
      return
    }

    setLoading(true)
    setError('')

    try {
      // TASK 5: Build serviceAddress string from structured fields (backend expects single string)
      const serviceAddress = `${street.trim()}, ${city.trim()}, ${state.trim().toUpperCase()} ${zip.trim()}`
      
      // Geocode the address to get coordinates
      console.log('[GEOCODING] Starting for:', serviceAddress)
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(serviceAddress)}&countrycodes=us&limit=1`
      const geocodeResponse = await fetch(geocodeUrl, {
        headers: { 'User-Agent': 'Haulkind/1.0' }
      })
      
      console.log('[GEOCODING] Response status:', geocodeResponse.status)
      
      if (!geocodeResponse.ok) {
        const errorText = await geocodeResponse.text()
        console.error('[GEOCODING] HTTP Error:', geocodeResponse.status, errorText)
        setError(`Unable to verify address. Please check your address and try again.`)
        setLoading(false)
        return
      }
      
      const geocodeData = await geocodeResponse.json()
      console.log('[GEOCODING] Results:', geocodeData.length, 'items')
      
      if (!geocodeData || geocodeData.length === 0) {
        console.error('[GEOCODING] No results for:', serviceAddress)
        setError('Address not found. Please check your address and try again.')
        setLoading(false)
        return
      }
      
      const lat = parseFloat(geocodeData[0].lat)
      const lng = parseFloat(geocodeData[0].lon)
      console.log('[GEOCODING] Coordinates:', { lat, lng })

      console.log('[SERVICE_AREA] Checking coverage for:', { lat, lng, state })
      const result = await checkServiceArea(lat, lng, state)
      console.log('[SERVICE_AREA] Result:', result)
      
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
        // Customer info
        customerName: fullName.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim(),
        // Address (send as single string to backend)
        pickupAddress: serviceAddress,
        pickupLat: lat,
        pickupLng: lng,
        serviceAreaId: result.serviceArea?.id || null,
        serviceAreaName: result.serviceArea?.name || '',
        // Date/time
        serviceDate,
        timeWindow,
        asap,
        scheduledFor: preferredDateTime,
        preferredDateTime,
      })

      router.push('/quote/haul-away/volume')
    } catch (err: any) {
      console.error('[ERROR] Full error:', err)
      setError(`We couldn't verify the service area right now. Please try again in a minute.`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-[760px]">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-2">Junk Removal - Location & Time</h1>
          <p className="text-sm text-gray-600 mb-5">Where and when do you need service?</p>

          {/* TASK 3: Only show error after user has attempted to continue */}
          {hasAttemptedContinue && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* TASK 4: Customer Info Section - COMPACTED */}
            <div className="border-b pb-4">
              <h2 className="text-base font-semibold mb-3">Customer Information</h2>
              
              <div className="space-y-2.5">
                {/* Row 1: Full Name (60%) + Phone (40%) */}
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full h-9 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(215) 555-0123"
                      className="w-full h-9 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Row 2: Email (100%) */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full h-9 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* TASK 5: Structured Address Section - COMPACTED */}
            <div className="border-b pb-4">
              <h2 className="text-base font-semibold mb-3">Service Address</h2>
              
              <div className="space-y-2.5">
                {/* Row 1: Street Address (100%) with Autocomplete */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Street Address * {addressSelected && <span className="text-green-600 text-[10px]">(✓ Verified)</span>}
                  </label>
                  <AddressAutocomplete
                    value={street}
                    onChange={handleStreetChange}
                    onSelect={handleAddressSelect}
                    placeholder="Start typing your address..."
                    className="w-full h-9 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Start typing and select your address from the suggestions</p>
                </div>

                {/* Row 2: City (50%) + State (20%) + ZIP (30%) */}
                <div className="grid grid-cols-10 gap-3">
                  <div className="col-span-5">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      City * {fieldsLocked && <button type="button" onClick={handleUnlockFields} className="text-[10px] text-blue-600 hover:underline">(Edit)</button>}
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => handleCityChange(e.target.value)}
                      placeholder="Philadelphia"
                      disabled={fieldsLocked}
                      className="w-full h-9 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      placeholder="PA"
                      maxLength={2}
                      disabled={fieldsLocked}
                      className="w-full h-9 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent uppercase disabled:bg-gray-50 disabled:text-gray-600"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={zip}
                      onChange={(e) => handleZipChange(e.target.value)}
                      placeholder="19103"
                      disabled={fieldsLocked}
                      maxLength={5}
                      className="w-full h-9 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-gray-400">
                  We will check if we serve your area
                </p>
              </div>
            </div>

            {/* Date & Time Section - COMPACTED */}
            <div>
              <h2 className="text-base font-semibold mb-3">When would you like your items picked up?</h2>
              
              {/* Row: Pickup Date (50%) + Pickup Time (50%) */}
              <div className="grid grid-cols-2 gap-3 mb-2.5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Pickup Date *
                  </label>
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full h-9 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Pickup Time
                  </label>
                  <select
                    value={timeWindow}
                    onChange={(e) => setTimeWindow(e.target.value as TimeWindow)}
                    className="w-full h-9 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-600 focus:border-transparent bg-white"
                  >
                    <option value="ALL_DAY">All Day (8AM - 8PM)</option>
                    <option value="MORNING">Morning (8AM - 12PM)</option>
                    <option value="AFTERNOON">Afternoon (12PM - 4PM)</option>
                    <option value="EVENING">Evening (4PM - 8PM)</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 mb-2.5">
                Schedule next day up to 90 days in advance.
              </p>

              {/* ASAP Checkbox - More compact */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="asap"
                  checked={asap}
                  onChange={(e) => setAsap(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                />
                <label htmlFor="asap" className="text-[11px] text-gray-600 leading-snug">
                  ⚡ Complete order ASAP if possible (we'll contact you to confirm earlier time)
                </label>
              </div>
            </div>

            {/* TASK 6: Continue button gated by form validation */}
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
                className="flex-[3] h-11 px-6 text-sm font-medium text-white bg-secondary-600 rounded-lg hover:bg-secondary-700 transition"
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
