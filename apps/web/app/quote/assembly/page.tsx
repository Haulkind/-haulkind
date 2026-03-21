'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AssemblyItem {
  id: string
  label: string
  price: number
  desc: string
  tier: number
}

const items: AssemblyItem[] = [
  // Tier 1 — $87
  { id: 'office-chair', label: 'Office Chair', price: 87, desc: 'Ergonomic, gaming, or standard office chairs', tier: 1 },
  { id: 'nightstand', label: 'Nightstand', price: 87, desc: 'Side tables, small bedside cabinets', tier: 1 },
  { id: 'shelving-unit', label: 'Shelving Unit', price: 87, desc: 'Wire shelves, storage racks, cube organizers', tier: 1 },
  { id: 'bookshelf-small', label: 'Bookshelf (Small)', price: 87, desc: 'Under 5 feet tall', tier: 1 },
  { id: 'dining-chairs', label: 'Dining Chairs (set of 4)', price: 87, desc: 'Price for a set of 4 chairs', tier: 1 },
  // Tier 2 — $97
  { id: 'desk-simple', label: 'Desk (Simple)', price: 97, desc: 'Writing desks, small computer desks', tier: 2 },
  { id: 'dresser', label: 'Dresser / Chest', price: 97, desc: 'Dressers with drawers, handles, leveling', tier: 2 },
  { id: 'tv-stand', label: 'TV Stand / Console', price: 97, desc: 'Media centers, entertainment units', tier: 2 },
  { id: 'bed-frame-twin', label: 'Bed Frame (Twin/Full)', price: 97, desc: 'Standard bed frame, platform beds', tier: 2 },
  { id: 'bookshelf-large', label: 'Bookshelf (Large/Wall Unit)', price: 97, desc: 'Over 5 feet tall or wall-mounted units', tier: 2 },
  { id: 'dining-table', label: 'Dining Table', price: 97, desc: 'Table assembly only (chairs separate)', tier: 2 },
  { id: 'outdoor-furniture', label: 'Outdoor Furniture Set', price: 97, desc: 'Patio tables, chairs, outdoor sets', tier: 2 },
  // Tier 3 — $117
  { id: 'desk-l-shaped', label: 'Desk (L-Shaped/Gaming)', price: 117, desc: 'Complex desks, corner desks, desks with hutch', tier: 3 },
  { id: 'bed-frame-queen', label: 'Bed Frame (Queen/King)', price: 117, desc: 'Larger bed frames, storage beds', tier: 3 },
  { id: 'baby-furniture', label: 'Baby Furniture (Crib)', price: 117, desc: 'Cribs, changing tables, baby dressers', tier: 3 },
  { id: 'gym-equipment', label: 'Gym Equipment', price: 117, desc: 'Treadmills, ellipticals, home gym systems', tier: 3 },
  { id: 'wardrobe', label: 'Wardrobe / Armoire', price: 117, desc: 'Freestanding wardrobes, PAX-style closets', tier: 3 },
  // Tier 4 — $147
  { id: 'bed-frame-bunk', label: 'Bed Frame (Bunk/Loft)', price: 147, desc: 'Multi-level beds, loft beds with desk', tier: 4 },
  { id: 'couch-sectional', label: 'Couch / Sectional', price: 147, desc: 'Sectional sofas requiring assembly', tier: 4 },
  { id: 'wall-unit', label: 'Wall Unit / Murphy Bed', price: 147, desc: 'Large wall-mounted or fold-down systems', tier: 4 },
]

const tierLabels: Record<number, string> = {
  1: 'Simple Assembly — $87',
  2: 'Standard Assembly — $97',
  3: 'Complex Assembly — $117',
  4: 'Advanced Assembly — $147',
}

export default function AssemblyPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [customItem, setCustomItem] = useState(false)
  const [customDesc, setCustomDesc] = useState('')

  const toggleItem = (id: string) => {
    setSelected(prev => {
      if (prev[id]) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: 1 }
    })
  }

  const updateQty = (id: string, delta: number) => {
    setSelected(prev => {
      const current = prev[id] || 1
      const next = Math.max(1, Math.min(10, current + delta))
      return { ...prev, [id]: next }
    })
  }

  const itemCount = Object.values(selected).reduce((sum, qty) => sum + qty, 0) + (customItem ? 1 : 0)
  const total = Object.entries(selected).reduce((sum, [id, qty]) => {
    const item = items.find(i => i.id === id)
    return sum + (item ? item.price * qty : 0)
  }, 0)

  const handleContinue = () => {
    if (itemCount === 0) return
    if (customItem && !customDesc.trim()) return

    const selectedItems = Object.entries(selected).map(([id, qty]) => {
      const item = items.find(i => i.id === id)!
      return { id, label: item.label, price: item.price, qty }
    })

    sessionStorage.setItem('assemblyData', JSON.stringify({
      items: selectedItems,
      customItem: customItem ? customDesc : null,
      total,
      itemCount,
    }))
    router.push('/quote/assembly/schedule')
  }

  const tiers = [1, 2, 3, 4]

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-32">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Step 1 of 4</span>
            <span className="font-medium text-orange-600">Select Items</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: '25%' }} />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">What do you need assembled?</h1>
        <p className="text-gray-600 mb-8">Select items and get your instant price. All prices include tools, hardware &amp; cleanup.</p>

        {/* Bundle banner */}
        {itemCount >= 3 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-orange-800 font-medium">
              Assembling 3+ items? You may qualify for a multi-item discount!
            </p>
          </div>
        )}

        {/* Items by tier */}
        {tiers.map(tier => (
          <div key={tier} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{tierLabels[tier]}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {items.filter(i => i.tier === tier).map(item => {
                const isSelected = !!selected[item.id]
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border-2 transition cursor-pointer ${
                      isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div onClick={() => toggleItem(item.id)} className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                      <span className="text-lg font-bold text-orange-600 ml-2">${item.price}</span>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-orange-200">
                        <span className="text-sm text-gray-600">Qty:</span>
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-lg font-bold"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-semibold">{selected[item.id]}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-lg font-bold"
                        >
                          +
                        </button>
                        <span className="ml-auto text-sm font-semibold text-orange-600">
                          ${item.price * (selected[item.id] || 1)}
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
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Custom</h2>
          <div
            className={`p-4 rounded-xl border-2 transition cursor-pointer ${
              customItem ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div onClick={() => setCustomItem(!customItem)} className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Other Item</p>
                <p className="text-xs text-gray-500 mt-0.5">We&apos;ll confirm price — describe the item below</p>
              </div>
              <span className="text-lg font-bold text-orange-600 ml-2">Custom</span>
            </div>
            {customItem && (
              <div className="mt-3 pt-3 border-t border-orange-200">
                <input
                  type="text"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="Describe the item (e.g., IKEA KALLAX 4x4 shelf)"
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>

        {/* Phone fallback */}
        <p className="text-center text-gray-500 text-sm mb-4">
          Prefer to talk? Call <a href="tel:+16094568188" className="text-orange-600 font-semibold">(609) 456-8188</a>
        </p>

        <div className="text-center">
          <Link href="/quote" className="text-gray-500 hover:text-gray-700 transition text-sm">
            {'<- Back to services'}
          </Link>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="container mx-auto px-4 max-w-4xl py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{itemCount} item{itemCount !== 1 ? 's' : ''} selected</p>
            <p className="text-2xl font-bold text-gray-900">{total > 0 ? `$${total}` : 'Custom quote'}</p>
          </div>
          <button
            onClick={handleContinue}
            disabled={itemCount === 0 || (customItem && !customDesc.trim())}
            className="px-8 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
