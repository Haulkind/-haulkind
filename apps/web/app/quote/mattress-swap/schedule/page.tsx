'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PA_NJ_NY_ZIPS = /^(0[89]|1[0-4]|169|176|177|178|179|18[0-9]|19[0-5]|100|101|102|103|104|105|106|107|108|109|110|111|112|113|114|115|116|117|118|119|120|121|122|123|124|125|126|127|128|129|130|131|132|133|134|135|136|137|138|139|140|141|142|143|144|145|146|147|148|149)/

export default function MattressSwapSchedulePage() {
  const router = useRouter()
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [usState, setUsState] = useState('')
  const [zip, setZip] = useState('')
  const [zipError, setZipError] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [floor, setFloor] = useState('')
  const [mattressStatus, setMattressStatus] = useState('')
  const [arrivalDate, setArrivalDate] = useState('')
  const [instructions, setInstructions] = useState('')
  const [error, setError] = useState('')

  // Check if step 1 data exists
  useEffect(() => {
    const data = sessionStorage.getItem('mattressSwapData')
    if (!data) {
      router.push('/quote/mattress-swap')
    }
  }, [router])

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const validateZip = (value: string) => {
    setZip(value)
    if (value.length === 5) {
      if (!PA_NJ_NY_ZIPS.test(value)) {
        setZipError('We don\'t serve this area yet. Call (609) 456-8188 to check availability.')
      } else {
        setZipError('')
      }
    } else {
      setZipError('')
    }
  }

  const handleContinue = () => {
    if (!street.trim() || !city.trim() || !usState.trim() || !zip || !date || !time || !floor || !mattressStatus) {
      setError('Please fill in all required fields.')
      return
    }
    if (usState.length !== 2) {
      setError('Please enter a valid 2-letter state code (e.g. PA, NJ, NY).')
      return
    }
    if (zip.length !== 5 || zipError) {
      setError('Please enter a valid ZIP code in our service area.')
      return
    }
    if (mattressStatus === 'arriving' && !arrivalDate) {
      setError('Please enter the expected arrival date for your new mattress.')
      return
    }

    setError('')
    const existing = JSON.parse(sessionStorage.getItem('mattressSwapData') || '{}')
    sessionStorage.setItem('mattressSwapData', JSON.stringify({
      ...existing,
      schedule: { street: street.trim(), city: city.trim(), state: usState.trim().toUpperCase(), zip, date, time, floor, mattressStatus, arrivalDate, instructions },
    }))
    router.push('/quote/mattress-swap/contact')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Step 2 of 4</span>
            <span className="font-medium text-purple-600">Date & Location</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: '50%' }} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">When and where?</h1>
        <p className="text-gray-600 mb-8">Tell us when and where you need the mattress swap.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
          {/* Street Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address *</label>
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="123 Main St, Apt 4B"
              className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* City, State, ZIP */}
          <div className="grid grid-cols-10 gap-3">
            <div className="col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Philadelphia"
                className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
              <input
                type="text"
                value={usState}
                onChange={(e) => setUsState(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="PA"
                maxLength={2}
                className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ZIP *</label>
              <input
                type="text"
                value={zip}
                onChange={(e) => validateZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="19103"
                maxLength={5}
                className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {zipError && <p className="text-sm text-red-600 mt-1">{zipError}</p>}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={minDate}
              max={maxDate}
              className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Same-day mattress swap may be available! We&apos;ll confirm by phone.</p>
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Time *</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              <option value="">Select time window</option>
              <option value="morning">Morning (8 AM - 12 PM)</option>
              <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
              <option value="evening">Evening (4 PM - 7 PM)</option>
              <option value="flexible">Flexible (any time)</option>
            </select>
          </div>

          {/* Floor level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Floor Level *</label>
            <select
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="w-full h-11 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              <option value="">Select floor</option>
              <option value="ground">Ground floor / 1st floor</option>
              <option value="2nd">2nd floor</option>
              <option value="3rd+">3rd floor or higher</option>
              <option value="elevator">Elevator available</option>
            </select>
          </div>

          {/* Mattress status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Is the new mattress already at your home? *</label>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${mattressStatus === 'delivered' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="mattressStatus" value="delivered" checked={mattressStatus === 'delivered'} onChange={(e) => setMattressStatus(e.target.value)} className="text-purple-600" />
                <span className="text-sm">Yes, it&apos;s been delivered</span>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${mattressStatus === 'arriving' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="mattressStatus" value="arriving" checked={mattressStatus === 'arriving'} onChange={(e) => setMattressStatus(e.target.value)} className="text-purple-600" />
                <span className="text-sm">No, it&apos;s arriving on a specific date</span>
              </label>
              {mattressStatus === 'arriving' && (
                <div className="ml-8">
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    min={minDate}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>
              )}
              <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${mattressStatus === 'store-pickup' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="radio" name="mattressStatus" value="store-pickup" checked={mattressStatus === 'store-pickup'} onChange={(e) => setMattressStatus(e.target.value)} className="text-purple-600" />
                <span className="text-sm">I need help picking it up from the store</span>
              </label>
              {mattressStatus === 'store-pickup' && (
                <p className="ml-8 text-sm text-purple-700 bg-purple-50 p-3 rounded-lg">
                  We can pick up from most local stores. Call <a href="tel:+16094568188" className="font-semibold underline">(609) 456-8188</a> to arrange.
                </p>
              )}
            </div>
          </div>

          {/* Special instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Instructions (optional)</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value.slice(0, 500))}
              rows={3}
              maxLength={500}
              placeholder="Parking info, gate codes, narrow hallways, anything we should know..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-400 text-right">{instructions.length}/500</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <Link
            href="/quote/mattress-swap"
            className="w-2/5 h-12 flex items-center justify-center border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Back
          </Link>
          <button
            onClick={handleContinue}
            className="w-3/5 h-12 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
