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
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])

  const updateQuantity = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0
      const next = Math.max(0, current + delta)
      if (next === 0) {
        const { [id]: removed, ...rest } = prev
        void removed
        return rest
      }
      return { ...prev, [id]: next }
    })
  }

  const totalMattresses = useMemo(() => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0)
  }, [quantities])

  const hasDiscount = totalMattresses >= 2

  const servicesSubtotal = useMemo(() => {
    return services.reduce((sum, s) => {
      const qty = quantities[s.id] || 0
      return sum + s.price * qty
    }, 0)
  }, [quantities])

  const discountAmount = useMemo(() => {
    if (!hasDiscount) return 0
    return Math.round(servicesSubtotal * 0.10)
  }, [hasDiscount, servicesSubtotal])

  const addonsTotal = useMemo(() => {
    return addons
      .filter(a => selectedAddons.includes(a.id))
      .reduce((sum, a) => sum + Number(a.price), 0)
  }, [selectedAddons])

  const total = servicesSubtotal - discountAmount + addonsTotal

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  const handleContinue = () => {
    if (totalMattresses === 0) return
    const selectedServices = services
      .filter(s => (quantities[s.id] || 0) > 0)
      .map(s => ({ id: s.id, label: s.label, price: s.price, quantity: quantities[s.id] }))
    const selectedAddonsList = addons.filter(a => selectedAddons.includes(a.id))
    sessionStorage.setItem('mattressSwapData', JSON.stringify({
      service: selectedServices[0] ? { id: selectedServices[0].id, label: selectedServices[0].label, price: selectedServices[0].price } : null,
      services: selectedServices,
      addons: selectedAddonsList.map(a => ({ id: a.id, label: a.label, price: a.price })),
      subtotal: servicesSubtotal,
      discount: discountAmount,
      discountPercent: hasDiscount ? 10 : 0,
      totalMattresses,
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
          <p className="text-sm text-gray-500">Need multiple mattresses? Add quantities below — <span className="font-semibold text-green-600">10% off when you book 2 or more!</span></p>
          {services.map(s => {
            const qty = quantities[s.id] || 0
            return (
              <div
                key={s.id}
                className={`w-full text-left p-4 rounded-xl border-2 transition ${
                  qty > 0
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{s.label}</p>
                    <p className="text-sm text-gray-500">{s.desc}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <span className="text-lg font-bold text-purple-600">${s.price}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(s.id, -1)}
                        disabled={qty === 0}
                        className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-purple-500 hover:text-purple-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label={`Decrease ${s.label} quantity`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-8 text-center font-bold text-gray-900">{qty}</span>
                      <button
                        onClick={() => updateQuantity(s.id, 1)}
                        className="w-8 h-8 rounded-full border-2 border-purple-500 bg-purple-500 flex items-center justify-center text-white hover:bg-purple-600 transition"
                        aria-label={`Increase ${s.label} quantity`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Discount banner */}
        {hasDiscount && (
          <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-4 flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="celebration">&#127881;</span>
            <div>
              <p className="font-semibold text-green-800">10% multi-mattress discount applied!</p>
              <p className="text-sm text-green-700">You&apos;re saving ${discountAmount} on {totalMattresses} mattresses.</p>
            </div>
          </div>
        )}

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
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-900">${total}</p>
                {hasDiscount && (
                  <span className="text-sm text-green-600 font-semibold line-through">${servicesSubtotal + addonsTotal}</span>
                )}
              </div>
              {hasDiscount && (
                <p className="text-xs text-green-600 font-medium">10% discount: -${discountAmount}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <a href="tel:+16094568188" className="text-sm text-gray-500 hover:text-gray-700 hidden sm:block">
                Prefer to talk? Call (609) 456-8188
              </a>
              <button
                onClick={handleContinue}
                disabled={totalMattresses === 0}
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
