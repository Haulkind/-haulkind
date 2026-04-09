'use client'

import { Suspense, useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getQuote, createJob, payJob, createCheckoutSession, lookupServiceArea } from '@/lib/api'
import { getCustomer, isLoggedIn } from '@/lib/auth'

type Step = 'service' | 'address' | 'schedule' | 'details' | 'summary' | 'confirm'

type ServiceType = 'HAUL_AWAY' | 'LABOR_ONLY' | 'DONATION_PICKUP' | 'MATTRESS_SWAP' | 'FURNITURE_ASSEMBLY'

const SERVICE_OPTIONS = [
  { id: 'HAUL_AWAY' as ServiceType, label: 'Junk Removal', emoji: '🚛', desc: 'We haul away your unwanted items', price: 'Starting at $99' },
  { id: 'LABOR_ONLY' as ServiceType, label: 'Moving Labor', emoji: '💪', desc: 'Helpers for moving, loading, or cleanup', price: 'Starting at $79/hr' },
  { id: 'DONATION_PICKUP' as ServiceType, label: 'Donation Pickup', emoji: '❤️', desc: 'We pick up and deliver to a local charity', price: 'Starting at $109' },
  { id: 'MATTRESS_SWAP' as ServiceType, label: 'Mattress Swap', emoji: '🛏️', desc: 'Remove your old mattress & set up the new one', price: 'Starting at $99' },
  { id: 'FURNITURE_ASSEMBLY' as ServiceType, label: 'Furniture Assembly', emoji: '🔧', desc: 'IKEA, Wayfair, Amazon & more', price: 'Starting at $87' },
]

const VOLUME_TIERS = [
  { id: 'EIGHTH', label: '1/8 Truck', desc: 'Small load (1-2 items)', price: 99 },
  { id: 'QUARTER', label: '1/4 Truck', desc: 'Medium load (3-5 items)', price: 189 },
  { id: 'HALF', label: '1/2 Truck', desc: 'Large load (6-10 items)', price: 314 },
  { id: 'THREE_QUARTER', label: '3/4 Truck', desc: 'Very large load (11-15 items)', price: 439 },
  { id: 'FULL', label: 'Full Truck', desc: 'Maximum capacity (16+ items)', price: 599 },
]

const MATTRESS_SERVICES = [
  { id: 'swap-twin-full', label: 'Mattress Swap — Twin/Full', price: 99, desc: 'Remove old + set up new mattress (Twin or Full size)' },
  { id: 'swap-queen', label: 'Mattress Swap — Queen', price: 119, desc: 'Remove old + set up new mattress (Queen size)' },
  { id: 'swap-king', label: 'Mattress Swap — King/Cal King', price: 139, desc: 'Remove old + set up new mattress (King or California King)' },
  { id: 'removal-only', label: 'Old Mattress Removal Only', price: 79, desc: 'We just take the old one away (no new setup)' },
  { id: 'setup-only', label: 'New Mattress Setup Only', price: 69, desc: 'We just set up your new mattress (no removal)' },
]

const MATTRESS_ADDONS = [
  { id: 'box-spring-removal', label: 'Box Spring Removal', price: 30, desc: 'Remove old box spring too' },
  { id: 'box-spring-setup', label: 'Box Spring Setup', price: 20, desc: 'Set up new box spring under mattress' },
  { id: 'bed-frame-disassembly', label: 'Bed Frame Disassembly', price: 40, desc: 'Take apart old bed frame if needed' },
  { id: 'bed-frame-assembly', label: 'Bed Frame Assembly', price: 97, desc: 'Assemble new bed frame before mattress setup' },
  { id: 'extra-stairs', label: 'Extra Flight of Stairs', price: 20, desc: 'Per additional flight above ground floor' },
  { id: 'haul-extra', label: 'Haul Away Extra Items', price: 40, desc: 'Remove 1-2 extra small items while we\'re there' },
]

interface AssemblyItem {
  id: string
  label: string
  price: number
  desc: string
  tier: number
}

const ASSEMBLY_ITEMS: AssemblyItem[] = [
  { id: 'office-chair', label: 'Office Chair', price: 87, desc: 'Ergonomic, gaming, or standard office chairs', tier: 1 },
  { id: 'nightstand', label: 'Nightstand', price: 87, desc: 'Side tables, small bedside cabinets', tier: 1 },
  { id: 'shelving-unit', label: 'Shelving Unit', price: 87, desc: 'Wire shelves, storage racks, cube organizers', tier: 1 },
  { id: 'bookshelf-small', label: 'Bookshelf (Small)', price: 87, desc: 'Under 5 feet tall', tier: 1 },
  { id: 'dining-chairs', label: 'Dining Chairs (set of 4)', price: 87, desc: 'Price for a set of 4 chairs', tier: 1 },
  { id: 'desk-simple', label: 'Desk (Simple)', price: 97, desc: 'Writing desks, small computer desks', tier: 2 },
  { id: 'dresser', label: 'Dresser / Chest', price: 97, desc: 'Dressers with drawers, handles, leveling', tier: 2 },
  { id: 'tv-stand', label: 'TV Stand / Console', price: 97, desc: 'Media centers, entertainment units', tier: 2 },
  { id: 'bed-frame-twin', label: 'Bed Frame (Twin/Full)', price: 97, desc: 'Standard bed frame, platform beds', tier: 2 },
  { id: 'bookshelf-large', label: 'Bookshelf (Large/Wall Unit)', price: 97, desc: 'Over 5 feet tall or wall-mounted units', tier: 2 },
  { id: 'dining-table', label: 'Dining Table', price: 97, desc: 'Table assembly only (chairs separate)', tier: 2 },
  { id: 'outdoor-furniture', label: 'Outdoor Furniture Set', price: 97, desc: 'Patio tables, chairs, outdoor sets', tier: 2 },
  { id: 'desk-l-shaped', label: 'Desk (L-Shaped/Gaming)', price: 117, desc: 'Complex desks, corner desks, desks with hutch', tier: 3 },
  { id: 'bed-frame-queen', label: 'Bed Frame (Queen/King)', price: 117, desc: 'Larger bed frames, storage beds', tier: 3 },
  { id: 'baby-furniture', label: 'Baby Furniture (Crib)', price: 117, desc: 'Cribs, changing tables, baby dressers', tier: 3 },
  { id: 'gym-equipment', label: 'Gym Equipment', price: 117, desc: 'Treadmills, ellipticals, home gym systems', tier: 3 },
  { id: 'wardrobe', label: 'Wardrobe / Armoire', price: 117, desc: 'Freestanding wardrobes, PAX-style closets', tier: 3 },
  { id: 'bed-frame-bunk', label: 'Bed Frame (Bunk/Loft)', price: 147, desc: 'Multi-level beds, loft beds with desk', tier: 4 },
  { id: 'couch-sectional', label: 'Couch / Sectional', price: 147, desc: 'Sectional sofas requiring assembly', tier: 4 },
  { id: 'wall-unit', label: 'Wall Unit / Murphy Bed', price: 147, desc: 'Large wall-mounted or fold-down systems', tier: 4 },
]

const ASSEMBLY_TIER_LABELS: Record<number, string> = {
  1: 'Simple Assembly — $87',
  2: 'Standard Assembly — $97',
  3: 'Complex Assembly — $117',
  4: 'Advanced Assembly — $147',
}

const TIME_WINDOWS = [
  { id: 'ALL_DAY', label: 'All Day', time: '8AM - 8PM' },
  { id: 'MORNING', label: 'Morning', time: '8AM - 12PM' },
  { id: 'AFTERNOON', label: 'Afternoon', time: '12PM - 4PM' },
  { id: 'EVENING', label: 'Evening', time: '4PM - 8PM' },
]

export default function SchedulePage() {
  return (
    <Suspense fallback={<div className="bg-gray-50 min-h-screen flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <SchedulePageInner />
    </Suspense>
  )
}

function SchedulePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customer = isLoggedIn() ? getCustomer() : null

  const [step, setStep] = useState<Step>('service')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Handle Stripe Checkout return
  useEffect(() => {
    const payment = searchParams.get('payment')
    const orderId = searchParams.get('orderId')
    if (payment === 'success' && orderId) {
      setJobId(orderId)
      setStep('confirm')
    } else if (payment === 'cancelled' && orderId) {
      setJobId(orderId)
      setError('Payment was cancelled. You can try again or track your order.')
      setStep('confirm')
    }
  }, [searchParams])

  // Form data
  const [serviceType, setServiceType] = useState<ServiceType>('HAUL_AWAY')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [lat, setLat] = useState(0)
  const [lng, setLng] = useState(0)
  const [serviceAreaId, setServiceAreaId] = useState(0)
  const [date, setDate] = useState('')
  const [timeWindow, setTimeWindow] = useState('ALL_DAY')
  const [volumeTier, setVolumeTier] = useState('QUARTER')
  const [helperCount, setHelperCount] = useState(1)
  const [estimatedHours, setEstimatedHours] = useState(2)
  const [mattressQty, setMattressQty] = useState(1)
  const [assemblyItems, setAssemblyItems] = useState(1)
  const [pickupType, setPickupType] = useState<'IN_HOME' | 'CURBSIDE'>('IN_HOME')
  // Mattress Swap state
  const [mattressQuantities, setMattressQuantities] = useState<Record<string, number>>({})
  const [selectedMattressAddons, setSelectedMattressAddons] = useState<string[]>([])
  // Assembly state
  const [selectedAssemblyItems, setSelectedAssemblyItems] = useState<Record<string, number>>({})
  const [customAssemblyItem, setCustomAssemblyItem] = useState(false)
  const [customAssemblyDesc, setCustomAssemblyDesc] = useState('')
  const [notes, setNotes] = useState('')
  const [customerName, setCustomerName] = useState(customer?.name || '')
  const [customerEmail, setCustomerEmail] = useState(customer?.email || '')
  const [customerPhone, setCustomerPhone] = useState(customer?.phone || '')

  // Photos
  const [photos, setPhotos] = useState<string[]>([])
  const photoInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be under 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        setPhotos(prev => [...prev, result])
      }
      reader.readAsDataURL(file)
    })
    // Reset input so the same file can be selected again
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  // Quote result
  const [quoteTotal, setQuoteTotal] = useState(0)
  const [jobId, setJobId] = useState('')
  const [trackingToken, setTrackingToken] = useState('')

  // Mattress Swap computed values
  const updateMattressQty = (id: string, delta: number) => {
    setMattressQuantities(prev => {
      const current = prev[id] || 0
      const next = Math.max(0, current + delta)
      if (next === 0) {
        const { [id]: _removed, ...rest } = prev
        void _removed
        return rest
      }
      return { ...prev, [id]: next }
    })
  }
  const totalMattresses = useMemo(() => Object.values(mattressQuantities).reduce((sum, qty) => sum + qty, 0), [mattressQuantities])
  const mattressHasDiscount = totalMattresses >= 2
  const mattressServicesSubtotal = useMemo(() => MATTRESS_SERVICES.reduce((sum, s) => sum + s.price * (mattressQuantities[s.id] || 0), 0), [mattressQuantities])
  const mattressDiscountAmount = useMemo(() => mattressHasDiscount ? Math.round(mattressServicesSubtotal * 0.10) : 0, [mattressHasDiscount, mattressServicesSubtotal])
  const mattressAddonsTotal = useMemo(() => MATTRESS_ADDONS.filter(a => selectedMattressAddons.includes(a.id)).reduce((sum, a) => sum + a.price, 0), [selectedMattressAddons])
  const mattressTotal = mattressServicesSubtotal - mattressDiscountAmount + mattressAddonsTotal
  const toggleMattressAddon = (id: string) => setSelectedMattressAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])

  // Assembly computed values
  const toggleAssemblyItem = (id: string) => {
    setSelectedAssemblyItems(prev => {
      if (prev[id]) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: 1 }
    })
  }
  const updateAssemblyQty = (id: string, delta: number) => {
    setSelectedAssemblyItems(prev => {
      const current = prev[id] || 1
      const next = Math.max(1, Math.min(10, current + delta))
      return { ...prev, [id]: next }
    })
  }
  const assemblyItemCount = Object.values(selectedAssemblyItems).reduce((sum, qty) => sum + qty, 0) + (customAssemblyItem ? 1 : 0)
  const assemblyTotal = Object.entries(selectedAssemblyItems).reduce((sum, [id, qty]) => {
    const item = ASSEMBLY_ITEMS.find(i => i.id === id)
    return sum + (item ? item.price * qty : 0)
  }, 0)

  // Build full address string from parts
  const fullAddress = [street, city, state, zipCode].filter(Boolean).join(', ')

  const handleAddressLookup = async () => {
    if (!street.trim()) { setError('Please enter a street address'); return }
    if (!city.trim()) { setError('Please enter a city'); return }
    if (!state.trim()) { setError('Please enter a state'); return }
    if (!zipCode.trim()) { setError('Please enter a zip code'); return }
    setLoading(true)
    setError('')
    try {
      // Use browser geocoding via Nominatim
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'Haulkind/1.0' } }
      )
      const results = await resp.json()
      if (!results || results.length === 0) {
        setError('Address not found. Please check street, city, state, and zip code.')
        return
      }
      const loc = results[0]
      const foundLat = parseFloat(loc.lat)
      const foundLng = parseFloat(loc.lon)
      setLat(foundLat)
      setLng(foundLng)

      // Check service area
      const areaData = await lookupServiceArea(foundLat, foundLng)
      if (!areaData.covered) {
        setError('Sorry, this address is not in our service area yet.')
        return
      }
      setServiceAreaId(areaData.serviceArea?.id || 1)
      setStep('schedule')
    } catch {
      setError('Failed to look up address. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGetQuote = async () => {
    setLoading(true)
    setError('')
    try {
      // Calculate local totals for mattress swap and assembly
      if (serviceType === 'MATTRESS_SWAP') {
        setMattressQty(totalMattresses)
        setQuoteTotal(mattressTotal)
        setStep('summary')
        return
      }
      if (serviceType === 'FURNITURE_ASSEMBLY') {
        setAssemblyItems(assemblyItemCount)
        setQuoteTotal(assemblyTotal)
        setStep('summary')
        return
      }
      const data = await getQuote({
        serviceType,
        volumeTier: (serviceType === 'HAUL_AWAY' || serviceType === 'DONATION_PICKUP') ? volumeTier : undefined,
        helperCount: serviceType === 'LABOR_ONLY' ? helperCount : undefined,
        estimatedHours: serviceType === 'LABOR_ONLY' ? estimatedHours : undefined,
        mattressQty: serviceType === 'MATTRESS_SWAP' ? totalMattresses : undefined,
        assemblyItems: serviceType === 'FURNITURE_ASSEMBLY' ? assemblyItemCount : undefined,
      })
      if (data.error) { setError(data.error); return }
      setQuoteTotal(data.total || 0)
      setStep('summary')
    } catch {
      setError('Failed to get quote. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateJob = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      setError('Name and email are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const scheduledFor = date ? new Date(date + 'T12:00:00').toISOString() : new Date().toISOString()
      const data = await createJob({
        serviceType,
        serviceAreaId,
        pickupLat: lat,
        pickupLng: lng,
        pickupAddress: fullAddress,
        scheduledFor,
        volumeTier: (serviceType === 'HAUL_AWAY' || serviceType === 'DONATION_PICKUP') ? volumeTier : undefined,
        helperCount: serviceType === 'LABOR_ONLY' ? helperCount : undefined,
        estimatedHours: serviceType === 'LABOR_ONLY' ? estimatedHours : undefined,
        mattressQty: serviceType === 'MATTRESS_SWAP' ? totalMattresses : undefined,
        assemblyItems: serviceType === 'FURNITURE_ASSEMBLY' ? assemblyItemCount : undefined,
        customerNotes: notes,
        customerName,
        customerPhone,
        customerEmail,
        timeWindow,
        total: quoteTotal,
        photoUrls: photos.length > 0 ? photos : undefined,
      })
      if (data.error) { setError(data.error); return }
      setJobId(data.id)
      setTrackingToken(data.trackingToken || '')

      // Try Stripe Checkout — use embedded checkout if publishable key is available
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.haulkind.com'
        const hasStripeKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

        if (hasStripeKey) {
          // Redirect to our embedded checkout page (full-screen mobile-friendly)
          window.location.href = `${origin}/checkout?jobId=${data.id}&return=/schedule`
          return
        }

        // Fall back to Stripe hosted checkout
        const checkout = await createCheckoutSession(
          data.id,
          `${origin}/schedule?payment=success&orderId=${data.id}`,
          `${origin}/schedule?payment=cancelled&orderId=${data.id}`
        )
        if (checkout?.url) {
          window.location.href = checkout.url
          return
        }
      } catch {
        // Stripe not configured — fall back to mock payment
      }

      // Fallback: mark as paid via mock endpoint
      try { await payJob(data.id) } catch { /* non-fatal */ }

      setStep('confirm')
    } catch {
      setError('Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-primary-600 px-4 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">Book a Service</h1>
        <p className="text-primary-200 mt-1">
          {step === 'service' && 'Choose your service type'}
          {step === 'details' && 'Select your options'}
          {step === 'address' && 'Enter your pickup address'}
          {step === 'schedule' && 'Select date and time'}
          {step === 'summary' && 'Review your order'}
          {step === 'confirm' && 'Order confirmed!'}
        </p>
      </div>

      {/* Progress */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="flex gap-1">
          {['service', 'details', 'address', 'schedule', 'summary', 'confirm'].map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${
                ['service', 'details', 'address', 'schedule', 'summary', 'confirm'].indexOf(step) >= i
                  ? 'bg-primary-600'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-4 py-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        {/* Step: Service Type */}
        {step === 'service' && (
          <div className="space-y-3">
            {SERVICE_OPTIONS.map(svc => (
              <button
                key={svc.id}
                onClick={() => { setServiceType(svc.id); setStep('details') }}
                className="w-full bg-white rounded-xl p-5 shadow-sm text-left hover:shadow-md transition border-2 border-transparent hover:border-primary-300"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">{svc.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{svc.label}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{svc.desc}</p>
                    <p className="text-sm font-semibold text-primary-600 mt-1">{svc.price}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step: Address */}
        {step === 'address' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                value={street}
                onChange={e => setStreet(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="123 Main St"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Philadelphia"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="PA"
                  maxLength={2}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={e => setZipCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="19103"
                  maxLength={5}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('details')} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium">
                Back
              </button>
              <button
                onClick={handleAddressLookup}
                disabled={loading}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Schedule */}
        {step === 'schedule' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={today}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Window</label>
              <div className="grid grid-cols-2 gap-2">
                {TIME_WINDOWS.map(tw => (
                  <button
                    key={tw.id}
                    onClick={() => setTimeWindow(tw.id)}
                    className={`p-3 rounded-lg border-2 text-left transition ${
                      timeWindow === tw.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{tw.label}</div>
                    <div className="text-xs text-gray-500">{tw.time}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('address')} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium">
                Back
              </button>
              <button
                onClick={handleGetQuote}
                disabled={loading}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Getting quote...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <div className="space-y-4">
            {/* ─── JUNK REMOVAL / DONATION PICKUP ─── */}
            {(serviceType === 'HAUL_AWAY' || serviceType === 'DONATION_PICKUP') && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Select Volume</h2>
                <p className="text-sm text-gray-500">How much junk do you need removed?</p>
                <div className="space-y-2">
                  {VOLUME_TIERS.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setVolumeTier(v.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition ${
                        volumeTier === v.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold">{v.label}</div>
                          <div className="text-sm text-gray-500">{v.desc}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary-600">${v.price}</div>
                          <div className="text-xs text-green-600 font-medium">Disposal included</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* In-Home vs Curbside */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Where are your items?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPickupType('IN_HOME')}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        pickupType === 'IN_HOME'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-sm">In-Home Pickup</div>
                      <p className="text-xs text-gray-500 mt-0.5">We come inside & carry items out</p>
                    </button>
                    <button
                      onClick={() => setPickupType('CURBSIDE')}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        pickupType === 'CURBSIDE'
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="font-semibold text-sm">Curbside Pickup <span className="text-green-600">— Save $5</span></div>
                      <p className="text-xs text-gray-500 mt-0.5">Items already outside at the curb</p>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-900">
                    <strong>All-in pricing.</strong> Disposal fee included in every price above — paid directly to your driver. No per-mile charges. No surprises.
                  </p>
                </div>
              </div>
            )}

            {/* ─── MOVING LABOR ─── */}
            {serviceType === 'LABOR_ONLY' && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-gray-900">Select Hours & Helpers</h2>
                <p className="text-sm text-gray-500">How many hours and helpers do you need?</p>

                {/* Helper Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Helpers</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setHelperCount(1)}
                      className={`p-4 rounded-xl border-2 transition ${
                        helperCount === 1
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xl font-bold">1 Helper</div>
                      <div className="text-primary-600 font-semibold">$79/hour</div>
                    </button>
                    <button
                      onClick={() => setHelperCount(2)}
                      className={`p-4 rounded-xl border-2 transition ${
                        helperCount === 2
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xl font-bold">2 Helpers</div>
                      <div className="text-primary-600 font-semibold">$129/hour</div>
                    </button>
                  </div>
                </div>

                {/* Hours with +/- */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Hours (2 hour minimum)</label>
                  <div className="flex items-center gap-4 justify-center">
                    <button
                      onClick={() => setEstimatedHours(Math.max(2, estimatedHours - 1))}
                      className="w-12 h-12 rounded-xl border-2 border-gray-300 hover:border-primary-600 transition flex items-center justify-center text-2xl font-bold"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <div className="text-4xl font-bold">{estimatedHours}</div>
                      <div className="text-gray-500 text-sm">hours</div>
                    </div>
                    <button
                      onClick={() => setEstimatedHours(estimatedHours + 1)}
                      className="w-12 h-12 rounded-xl border-2 border-gray-300 hover:border-primary-600 transition flex items-center justify-center text-2xl font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Estimate */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-700">Estimated Total</span>
                    <span className="text-2xl font-bold text-primary-600">
                      ${estimatedHours * (helperCount === 1 ? 79 : 129)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {helperCount} helper{helperCount > 1 ? 's' : ''} x {estimatedHours} hours x ${helperCount === 1 ? 79 : 129}/hour
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>Note:</strong> Final price may vary if job takes longer or shorter than estimated.
                  </p>
                </div>
              </div>
            )}

            {/* ─── MATTRESS SWAP ─── */}
            {serviceType === 'MATTRESS_SWAP' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Mattress Swap — We Handle the Heavy Lifting</h2>
                <p className="text-sm text-gray-500">We remove your old mattress and set up your new one. All sizes. Same-day available.</p>

                {/* Service Options with quantities */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Choose your service</h3>
                  <p className="text-xs text-gray-500 mb-3">Need multiple mattresses? Add quantities below — <span className="font-semibold text-green-600">10% off when you book 2 or more!</span></p>
                  <div className="space-y-2">
                    {MATTRESS_SERVICES.map(s => {
                      const qty = mattressQuantities[s.id] || 0
                      return (
                        <div
                          key={s.id}
                          className={`w-full text-left p-3 rounded-xl border-2 transition ${
                            qty > 0
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm">{s.label}</p>
                              <p className="text-xs text-gray-500">{s.desc}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                              <span className="text-base font-bold text-purple-600">${s.price}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateMattressQty(s.id, -1)}
                                  disabled={qty === 0}
                                  className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-purple-500 transition disabled:opacity-30"
                                >
                                  -
                                </button>
                                <span className="w-6 text-center font-bold text-sm">{qty}</span>
                                <button
                                  onClick={() => updateMattressQty(s.id, 1)}
                                  className="w-7 h-7 rounded-full border-2 border-purple-500 bg-purple-500 flex items-center justify-center text-white hover:bg-purple-600 transition"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Discount banner */}
                {mattressHasDiscount && (
                  <div className="bg-green-50 border border-green-300 rounded-xl p-3 flex items-center gap-2">
                    <span className="text-xl">&#127881;</span>
                    <div>
                      <p className="font-semibold text-green-800 text-sm">10% multi-mattress discount applied!</p>
                      <p className="text-xs text-green-700">You&apos;re saving ${mattressDiscountAmount} on {totalMattresses} mattresses.</p>
                    </div>
                  </div>
                )}

                {/* Add-ons */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Add-on services</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {MATTRESS_ADDONS.map(a => (
                      <button
                        key={a.id}
                        onClick={() => toggleMattressAddon(a.id)}
                        className={`text-left p-3 rounded-xl border-2 transition ${
                          selectedMattressAddons.includes(a.id)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedMattressAddons.includes(a.id) ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                          }`}>
                            {selectedMattressAddons.includes(a.id) && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-gray-900 text-xs">{a.label}</p>
                              <span className="text-xs font-bold text-purple-600">+${a.price}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">{a.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs text-green-800">
                    <strong>What happens to your old mattress?</strong> We donate mattresses in good condition to local charities. Damaged mattresses are disposed of responsibly.
                  </p>
                </div>

                {/* Total bar */}
                <div className="bg-white rounded-xl p-3 border shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Your estimated total</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-xl font-bold text-gray-900">${mattressTotal}</p>
                        {mattressHasDiscount && (
                          <span className="text-sm text-green-600 font-semibold line-through">${mattressServicesSubtotal + mattressAddonsTotal}</span>
                        )}
                      </div>
                    </div>
                    <a href="tel:+16094568188" className="text-xs text-gray-500 hover:text-gray-700">
                      Call (609) 456-8188
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* ─── FURNITURE ASSEMBLY ─── */}
            {serviceType === 'FURNITURE_ASSEMBLY' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">What do you need assembled?</h2>
                <p className="text-sm text-gray-500">Select items and get your instant price. All prices include tools, hardware & cleanup.</p>

                {assemblyItemCount >= 3 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                    <p className="text-xs text-orange-800 font-medium">
                      Assembling 3+ items? You may qualify for a multi-item discount!
                    </p>
                  </div>
                )}

                {/* Items by tier */}
                {[1, 2, 3, 4].map(tier => (
                  <div key={tier}>
                    <h3 className="font-semibold text-gray-900 text-sm mb-2">{ASSEMBLY_TIER_LABELS[tier]}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {ASSEMBLY_ITEMS.filter(i => i.tier === tier).map(item => {
                        const isSelected = !!selectedAssemblyItems[item.id]
                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-xl border-2 transition cursor-pointer ${
                              isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div onClick={() => toggleAssemblyItem(item.id)}>
                              <div className="flex items-start justify-between">
                                <p className="font-semibold text-gray-900 text-xs">{item.label}</p>
                                <span className="text-sm font-bold text-orange-600 ml-1">${item.price}</span>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                            </div>
                            {isSelected && (
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-orange-200">
                                <span className="text-xs text-gray-600">Qty:</span>
                                <button
                                  onClick={() => updateAssemblyQty(item.id, -1)}
                                  className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-xs font-bold"
                                >
                                  -
                                </button>
                                <span className="w-5 text-center font-semibold text-xs">{selectedAssemblyItems[item.id]}</span>
                                <button
                                  onClick={() => updateAssemblyQty(item.id, 1)}
                                  className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-xs font-bold"
                                >
                                  +
                                </button>
                                <span className="ml-auto text-xs font-semibold text-orange-600">
                                  ${item.price * (selectedAssemblyItems[item.id] || 1)}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* Custom item */}
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-2">Custom</h3>
                  <div
                    className={`p-3 rounded-xl border-2 transition cursor-pointer ${
                      customAssemblyItem ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div onClick={() => setCustomAssemblyItem(!customAssemblyItem)} className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-xs">Other Item</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">We&apos;ll confirm price — describe the item below</p>
                      </div>
                      <span className="text-sm font-bold text-orange-600 ml-1">Custom</span>
                    </div>
                    {customAssemblyItem && (
                      <div className="mt-2 pt-2 border-t border-orange-200">
                        <input
                          type="text"
                          value={customAssemblyDesc}
                          onChange={(e) => setCustomAssemblyDesc(e.target.value)}
                          placeholder="Describe the item (e.g., IKEA KALLAX 4x4 shelf)"
                          className="w-full h-9 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Total bar */}
                <div className="bg-white rounded-xl p-3 border shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">{assemblyItemCount} item{assemblyItemCount !== 1 ? 's' : ''} selected</p>
                      <p className="text-xl font-bold text-gray-900">{assemblyTotal > 0 ? `$${assemblyTotal}` : 'Custom quote'}</p>
                    </div>
                    <a href="tel:+16094568188" className="text-xs text-gray-500 hover:text-gray-700">
                      Call (609) 456-8188
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* ─── COMMON: Notes + Photos ─── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                placeholder="Any special instructions..."
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Photos (optional)</label>
              <p className="text-xs text-gray-500 mb-3">Take a photo or upload from your gallery to help us understand the job.</p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (photoInputRef.current) {
                      photoInputRef.current.removeAttribute('capture')
                      photoInputRef.current.click()
                    }
                  }}
                  className="flex-1 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary-400 hover:text-primary-600 transition flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Upload Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (photoInputRef.current) {
                      photoInputRef.current.setAttribute('capture', 'environment')
                      photoInputRef.current.click()
                    }
                  }}
                  className="flex-1 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary-400 hover:text-primary-600 transition flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Take Photo
                </button>
              </div>
              {photos.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">{photos.length} photo{photos.length > 1 ? 's' : ''} added</p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('service')} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium">
                Back
              </button>
              <button
                onClick={() => setStep('address')}
                disabled={(serviceType === 'MATTRESS_SWAP' && totalMattresses === 0) || (serviceType === 'FURNITURE_ASSEMBLY' && assemblyItemCount === 0)}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step: Summary */}
        {step === 'summary' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-lg mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service</span>
                  <span className="font-medium">{SERVICE_OPTIONS.find(s => s.id === serviceType)?.label || serviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Address</span>
                  <span className="font-medium text-right max-w-48 truncate">{fullAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">{date ? new Date(date + 'T12:00:00').toLocaleDateString() : 'ASAP'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time Window</span>
                  <span className="font-medium">{TIME_WINDOWS.find(t => t.id === timeWindow)?.label} ({TIME_WINDOWS.find(t => t.id === timeWindow)?.time})</span>
                </div>
                {(serviceType === 'HAUL_AWAY' || serviceType === 'DONATION_PICKUP') && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Volume</span>
                      <span className="font-medium">{VOLUME_TIERS.find(v => v.id === volumeTier)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pickup Type</span>
                      <span className="font-medium">{pickupType === 'CURBSIDE' ? 'Curbside (-$5)' : 'In-Home'}</span>
                    </div>
                  </>
                )}
                {serviceType === 'LABOR_ONLY' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Helpers</span>
                      <span className="font-medium">{helperCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hours</span>
                      <span className="font-medium">{estimatedHours}h</span>
                    </div>
                  </>
                )}
                {serviceType === 'MATTRESS_SWAP' && (
                  <>
                    {MATTRESS_SERVICES.filter(s => (mattressQuantities[s.id] || 0) > 0).map(s => (
                      <div key={s.id} className="flex justify-between">
                        <span className="text-gray-500">{s.label} x{mattressQuantities[s.id]}</span>
                        <span className="font-medium">${s.price * mattressQuantities[s.id]}</span>
                      </div>
                    ))}
                    {selectedMattressAddons.length > 0 && MATTRESS_ADDONS.filter(a => selectedMattressAddons.includes(a.id)).map(a => (
                      <div key={a.id} className="flex justify-between">
                        <span className="text-gray-500">{a.label}</span>
                        <span className="font-medium">+${a.price}</span>
                      </div>
                    ))}
                    {mattressHasDiscount && (
                      <div className="flex justify-between text-green-600">
                        <span>10% multi-mattress discount</span>
                        <span className="font-medium">-${mattressDiscountAmount}</span>
                      </div>
                    )}
                  </>
                )}
                {serviceType === 'FURNITURE_ASSEMBLY' && (
                  <>
                    {Object.entries(selectedAssemblyItems).map(([id, qty]) => {
                      const item = ASSEMBLY_ITEMS.find(i => i.id === id)
                      if (!item) return null
                      return (
                        <div key={id} className="flex justify-between">
                          <span className="text-gray-500">{item.label} x{qty}</span>
                          <span className="font-medium">${item.price * qty}</span>
                        </div>
                      )
                    })}
                    {customAssemblyItem && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Custom: {customAssemblyDesc || 'Other item'}</span>
                        <span className="font-medium">TBD</span>
                      </div>
                    )}
                  </>
                )}
                {photos.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Photos</span>
                    <span className="font-medium">{photos.length} attached</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-2xl text-primary-600">${quoteTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              {photos.length > 0 && (
                <div className="mt-3">
                  <div className="flex gap-2 overflow-x-auto">
                    {photos.map((photo, idx) => (
                      <img key={idx} src={photo} alt={`Photo ${idx + 1}`} className="w-16 h-16 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold mb-3">Your Information</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Full Name *"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="Email *"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('schedule')} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium">
                Back
              </button>
              <button
                onClick={handleCreateJob}
                disabled={loading}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-bold text-lg disabled:opacity-50"
              >
                {loading ? 'Placing order...' : `Pay $${quoteTotal.toFixed(2)}`}
              </button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Order Placed!</h2>
            <p className="text-gray-500 mb-6">We are finding a driver for your order.</p>

            <div className="bg-white rounded-xl p-4 shadow-sm mb-6 text-left">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Order ID</span>
                <span className="font-mono text-xs">{jobId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-primary-600">${quoteTotal.toFixed(2)}</span>
              </div>
            </div>

            {trackingToken && (
              <div className="bg-primary-50 rounded-xl p-4 mb-6 text-left border border-primary-200">
                <h3 className="font-bold text-primary-700 text-sm mb-1">Your Tracking Code</h3>
                <p className="font-mono text-xs break-all text-primary-600">{trackingToken}</p>
                <p className="text-xs text-primary-500 mt-2">
                  Save this code to track your order anytime, even without an account.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => router.push(`/track?orderId=${jobId}`)}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium"
              >
                Track My Order
              </button>
              {isLoggedIn() && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-3 bg-gray-100 text-gray-600 rounded-lg font-medium"
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
