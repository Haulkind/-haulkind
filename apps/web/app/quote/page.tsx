'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function QuotePage() {
  const router = useRouter()
  const [selectedService, setSelectedService] = useState<'HAUL_AWAY' | 'LABOR_ONLY' | null>(null)

  const handleServiceSelect = (service: 'HAUL_AWAY' | 'LABOR_ONLY') => {
    setSelectedService(service)
    // Navigate to the appropriate flow
    if (service === 'HAUL_AWAY') {
      router.push('/quote/haul-away/location')
    } else {
      router.push('/quote/labor-only/location')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get a Quote</h1>
          <p className="text-xl text-gray-600">
            Choose your service to get started
          </p>
        </div>

        {/* Service Selection */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Haul Away */}
          <button
            onClick={() => handleServiceSelect('HAUL_AWAY')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition text-left border-2 border-transparent hover:border-primary-600"
          >
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Junk Removal (Haul Away)</h2>
            <p className="text-gray-600 mb-6">
              We haul it away and dispose of it. Perfect for furniture, appliances, yard waste, and general junk.
            </p>
            <div className="text-primary-600 font-semibold">
              Starting at $109 →
            </div>
          </button>

          {/* Labor Only */}
          <button
            onClick={() => handleServiceSelect('LABOR_ONLY')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition text-left border-2 border-transparent hover:border-secondary-600"
          >
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Labor Only (Help Moving)</h2>
            <p className="text-gray-600 mb-6">
              Move items inside your home or load/unload a moving truck. Hourly help when you need muscle, not removal.
            </p>
            <div className="text-secondary-600 font-semibold">
              Starting at $79/hr →
            </div>
          </button>
        </div>

        {/* Back Link */}
        <div className="text-center mt-12">
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
