'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AssemblyData {
  items?: { label: string; price: number; qty: number }[]
  customItem?: string | null
  total?: number
  itemCount?: number
  schedule?: { zip: string; date: string; time: string; floor: string; store?: string; boxStatus?: string }
  contact?: { fullName: string; phone: string; email: string }
}

const timeLabels: Record<string, string> = {
  morning: 'Morning (8 AM - 12 PM)',
  afternoon: 'Afternoon (12 PM - 4 PM)',
  evening: 'Evening (4 PM - 7 PM)',
  flexible: 'Flexible (any time)',
}

const floorLabels: Record<string, string> = {
  ground: 'Ground floor / 1st floor',
  '2nd': '2nd floor',
  '3rd+': '3rd floor or higher',
  elevator: 'Elevator available',
}

export default function AssemblyConfirmationPage() {
  const [data, setData] = useState<AssemblyData | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('assemblyData')
    if (stored) {
      setData(JSON.parse(stored))
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Step 4 of 4</span>
            <span className="font-medium text-green-600">Confirmed!</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Success icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your assembly quote is confirmed!</h1>
          <p className="text-gray-600">We&apos;ll call or text you within 30 minutes to confirm your appointment.</p>
        </div>

        {/* Order Summary */}
        {data && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

            {data.items && data.items.map((item, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700">
                  {item.label} {item.qty > 1 && <span className="text-gray-400">x{item.qty}</span>}
                </span>
                <span className="font-semibold">${item.price * item.qty}</span>
              </div>
            ))}

            {data.customItem && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700">Custom: {data.customItem}</span>
                <span className="text-sm text-gray-500">TBD</span>
              </div>
            )}

            <div className="flex justify-between py-3 mt-2 border-t-2 border-gray-200">
              <span className="text-lg font-bold text-gray-900">Estimated Total</span>
              <span className="text-lg font-bold text-orange-600">
                {data.total ? `$${data.total}` : 'Custom quote'}
                {data.customItem && data.total ? '+' : ''}
              </span>
            </div>

            {data.schedule && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-900">{data.schedule.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span className="text-gray-900">{timeLabels[data.schedule.time] || data.schedule.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Floor</span>
                  <span className="text-gray-900">{floorLabels[data.schedule.floor] || data.schedule.floor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ZIP Code</span>
                  <span className="text-gray-900">{data.schedule.zip}</span>
                </div>
                {data.schedule.store && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Store</span>
                    <span className="text-gray-900 capitalize">{data.schedule.store}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contact info */}
        <p className="text-center text-gray-600 mb-6">
          If you need us sooner, call <a href="tel:+16094568188" className="font-semibold text-orange-600">(609) 456-8188</a>.
        </p>

        {/* Guarantees */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-green-800">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              No payment until the job is done
            </div>
            <div className="flex items-center gap-2 text-sm text-green-800">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              All tools &amp; hardware included
            </div>
            <div className="flex items-center gap-2 text-sm text-green-800">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Licensed &amp; insured crew
            </div>
            <div className="flex items-center gap-2 text-sm text-green-800">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Satisfaction guaranteed
            </div>
          </div>
        </div>

        {/* Cross-sell */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 text-center">
          <p className="text-teal-800 font-medium mb-2">Need your old furniture removed?</p>
          <Link href="/quote" className="inline-block px-6 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition">
            Get Junk Removal Quote &rarr;
          </Link>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-gray-500 hover:text-gray-700 transition text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
