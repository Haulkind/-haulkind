'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [zipCode, setZipCode] = useState('')
  const [service, setService] = useState<'haul-away' | 'labor-only'>('haul-away')

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (zipCode.length >= 5) {
      router.push(`/quote?service=${service}&zip=${zipCode}`)
    }
  }

  return (
    <div className="bg-white">
      {/* Hero Section - Reduced padding */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Fast local junk removal — with transparent pricing.
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8">
              No memberships. Track your driver live. Drivers keep 60%.
            </p>

            {/* Mini Quote Form */}
            <form onSubmit={handleQuoteSubmit} className="bg-white rounded-lg shadow-xl p-6 mb-6">
              <div className="grid md:grid-cols-[1fr,1.5fr,auto] gap-4">
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service
                  </label>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value as 'haul-away' | 'labor-only')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="haul-away">Haul Away</option>
                    <option value="labor-only">Labor Only</option>
                  </select>
                </div>
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="Enter ZIP code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                    maxLength={5}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full md:w-auto bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-700 transition shadow-lg whitespace-nowrap"
                  >
                    Get My Price
                  </button>
                </div>
              </div>
            </form>

            {/* Starting Prices */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-gray-600">
              <div>
                <span className="font-semibold">Haul Away</span> from <span className="text-primary-600 font-bold">$109</span>
              </div>
              <div className="hidden sm:block text-gray-300">|</div>
              <div>
                <span className="font-semibold">Labor</span> from <span className="text-secondary-600 font-bold">$79/hr</span> <span className="text-xs">(2-hour minimum)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bullets - Reduced padding */}
      <section className="py-6 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-6 text-gray-700 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Local drivers</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">No memberships</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Transparent pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Real-time tracking</span>
            </div>
          </div>
        </div>
      </section>

      {/* Service Cards - Reduced padding */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Our Services</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Junk Removal */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Junk Removal (Haul Away)</h3>
              <p className="text-gray-600 mb-6">
                We haul it away and dispose of it. Perfect for furniture, appliances, yard waste, and general junk.
              </p>
              <div className="flex flex-col gap-3">
                <Link 
                  href="/quote?service=haul-away"
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition text-center"
                >
                  Get a Quote
                </Link>
                <Link 
                  href="/pricing#haul-away" 
                  className="text-primary-600 font-medium hover:text-primary-700 transition text-center text-sm"
                >
                  See pricing
                </Link>
              </div>
            </div>

            {/* Labor Only */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
              <div className="w-14 h-14 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Labor Only (Help Moving)</h3>
              <p className="text-gray-600 mb-6">
                Move items inside your home or load/unload a moving truck. Hourly help when you need muscle, not removal.
              </p>
              <div className="flex flex-col gap-3">
                <Link 
                  href="/quote?service=labor-only"
                  className="bg-secondary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary-700 transition text-center"
                >
                  Book Hourly Help
                </Link>
                <Link 
                  href="/pricing#labor-only" 
                  className="text-secondary-600 font-medium hover:text-secondary-700 transition text-center text-sm"
                >
                  See pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Reduced padding and tighter copy */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto">
            {/* For Customers */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-primary-600">For Customers</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Get instant pricing</h4>
                    <p className="text-gray-600 text-sm">Enter ZIP code and service type for transparent pricing in seconds.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Book and pay securely</h4>
                    <p className="text-gray-600 text-sm">Choose your date and time. Pay online with no hidden fees.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Track and relax</h4>
                    <p className="text-gray-600 text-sm">Watch your driver arrive in real-time. Job done, you're all set!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Drivers */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-secondary-600">For Drivers</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-secondary-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Apply and get approved</h4>
                    <p className="text-gray-600 text-sm">Submit vehicle info and insurance. Approved in 24 hours.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-secondary-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Accept jobs on your terms</h4>
                    <p className="text-gray-600 text-sm">Go online when ready. Choose jobs that fit your schedule.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-secondary-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Earn 60% per job</h4>
                    <p className="text-gray-600 text-sm">Complete work and keep 60% of service price. Paid weekly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview - Smaller cards, less padding */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">Transparent Pricing</h2>
          <p className="text-center text-gray-600 mb-10">No hidden fees. See exactly what you'll pay.</p>
          
          <div className="max-w-6xl mx-auto mb-10">
            <h3 className="text-xl font-bold mb-4 text-center">Junk Removal (Haul Away)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { size: '1/8 Truck', price: '$109' },
                { size: '1/4 Truck', price: '$169' },
                { size: '1/2 Truck', price: '$279' },
                { size: '3/4 Truck', price: '$389' },
                { size: 'Full Truck', price: '$529' },
              ].map((tier) => (
                <div key={tier.size} className="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg transition">
                  <div className="text-2xl font-bold text-primary-600 mb-1">{tier.price}</div>
                  <div className="text-sm text-gray-600">{tier.size}</div>
                  <div className="text-xs text-gray-500 mt-1">+ disposal</div>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 text-center mb-8">
            <h3 className="text-xl font-bold mb-3">Labor Only (Help Moving)</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Need muscle, not removal? Book hourly help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-secondary-600 mb-1">$79/hr</div>
                <div className="text-sm text-gray-600">1 Helper</div>
                <div className="text-xs text-gray-500 mt-1">2 hour minimum</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-secondary-600 mb-1">$129/hr</div>
                <div className="text-sm text-gray-600">2 Helpers</div>
                <div className="text-xs text-gray-500 mt-1">2 hour minimum</div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link 
              href="/quote"
              className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-700 transition shadow-lg"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Teaser - Reduced padding */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: 'What areas do you serve?',
                a: 'We currently serve Pennsylvania, New York, and New Jersey. Enter your ZIP code above to check availability.'
              },
              {
                q: 'How quickly can you come?',
                a: 'Most jobs can be scheduled within 24-48 hours. Same-day service may be available depending on driver availability.'
              },
              {
                q: 'What items can you haul away?',
                a: 'Furniture, appliances, electronics, yard waste, construction debris, and general junk. We cannot accept hazardous materials.'
              },
              {
                q: 'How does pricing work?',
                a: 'Haul Away pricing is based on truck volume. Labor Only is hourly with a 2-hour minimum. All prices include labor and transportation.'
              },
              {
                q: 'Do drivers keep 60% on every job?',
                a: 'Yes! We believe in fair pay. Drivers earn 60% of the service price, plus disposal reimbursements for haul-away jobs.'
              }
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/faq" className="text-primary-600 font-semibold text-lg hover:text-primary-700 transition">
              View All FAQs →
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA - Reduced height */}
      <section className="bg-primary-600 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Get transparent pricing in seconds. No memberships, no hidden fees.
          </p>
          <Link 
            href="/quote"
            className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition shadow-lg"
          >
            Get My Price
          </Link>
        </div>
      </section>
    </div>
  )
}
