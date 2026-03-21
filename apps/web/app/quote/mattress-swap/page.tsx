'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const services = [
  { id: 'swap-twin-full', label: 'Mattress Swap — Twin/Full', price: 99, desc: 'Remove old + set up new mattress (Twin or Full size)' },
  { id: 'swap-queen', label: 'Mattress Swap — Queen', price: 119, desc: 'Remove old + set up new mattress (Queen size)' },
  { id: 'swap-king', label: 'Mattress Swap — King/Cal King', price: 139, desc: 'Remove old + set up new mattress (King or California King)' },
  { id: 'removal-only', label: 'Old Mattress Removal Only', price: 79, desc: 'We just take the old one away (no new setup)' },
  { id: 'setup-only', label: 'New Mattress Setup Only', price: 69, desc: 'We just set up your new mattress (no removal)' },
]

const addons = [
  { id: 'box-spring-removal', label: 'Box Spring Removal', price: 30, desc: 'Remove old box spring too' },
  { id: 'box-spring-setup', label: 'Box Spring Setup', price: 20, desc: 'Set up new box spring under mattress' },
  { id: 'bed-frame-disassembly', label: 'Bed Frame Disassembly', price: 40, desc: 'Take apart old bed frame if needed' },
  { id: 'bed-frame-assembly', label: 'Bed Frame Assembly', price: 97, desc: 'Assemble new bed frame before mattress setup' },
  { id: 'extra-stairs', label: 'Extra Flight of Stairs', price: 20, desc: 'Per additional flight above ground floor' },
  { id: 'haul-extra', label: 'Haul Away Extra Items', price: 40, desc: 'Remove 1-2 extra small items while we\'re there' },
]

export default function MattressSwapPage() {
  const router = useRouter()
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])

  const servicePrice = useMemo(() => {
    const found = services.find(s => s.id === selectedService)
    return found ? Number(found.price) : 0
  }, [selectedService])

  const addonsTotal = useMemo(() => {
    return addons
      .filter(a => selectedAddons.includes(a.id))
      .reduce((sum, a) => sum + Number(a.price), 0)
  }, [selectedAddons])

  const total = servicePrice + addonsTotal

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  const handleContinue = () => {
    if (!selectedService) return
    const service = services.find(s => s.id === selectedService)
    const selectedAddonsList = addons.filter(a => selectedAddons.includes(a.id))
    sessionStorage.setItem('mattressSwapData', JSON.stringify({
      service: { id: selectedService, label: service?.label, price: service?.price },
      addons: selectedAddonsList.map(a => ({ id: a.id, label: a.label, price: a.price })),
      total,
    }))
    router.push('/quote/mattress-swap/schedule')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Step 1 of 4</span>
            <span className="font-medium text-purple-600">Select Service</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: '25%' }} />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Mattress Swap — We Handle the Heavy Lifting</h1>
        <p className="text-gray-600 mb-8">We remove your old mattress and set up your new one. All sizes. Same-day available.</p>

        {/* Service Options */}
        <div className="space-y-3 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Choose your service</h2>
          {services.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedService(s.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition ${
                selectedService === s.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedService === s.id ? 'border-purple-500' : 'border-gray-300'
                  }`}>
                    {selectedService === s.id && <div className="w-3 h-3 rounded-full bg-purple-500" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{s.label}</p>
                    <p className="text-sm text-gray-500">{s.desc}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-purple-600">${s.price}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Add-ons */}
        <div className="space-y-3 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Add-on services</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {addons.map(a => (
              <button
                key={a.id}
                onClick={() => toggleAddon(a.id)}
                className={`text-left p-4 rounded-xl border-2 transition ${
                  selectedAddons.includes(a.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedAddons.includes(a.id) ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                  }`}>
                    {selectedAddons.includes(a.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 text-sm">{a.label}</p>
                      <span className="text-sm font-bold text-purple-600">+${a.price}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-green-800">
            <strong>What happens to your old mattress?</strong> We donate mattresses in good condition to local charities. Damaged mattresses are disposed of responsibly. You&apos;ll receive a donation receipt if applicable.
          </p>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-white border-t shadow-lg -mx-4 px-4 py-4 mt-8">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Your estimated total</p>
              <p className="text-2xl font-bold text-gray-900">{'$'}{total}</p>
            </div>
            <div className="flex items-center gap-3">
              <a href="tel:+16094568188" className="text-sm text-gray-500 hover:text-gray-700 hidden sm:block">
                Prefer to talk? Call (609) 456-8188
              </a>
              <button
                onClick={handleContinue}
                disabled={!selectedService}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/quote" className="text-gray-500 hover:text-gray-700 transition text-sm">
            {'<- Back to services'}
          </Link>
        </div>
      </div>
    </div>
  )
}
