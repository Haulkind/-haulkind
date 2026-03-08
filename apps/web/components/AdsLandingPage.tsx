'use client'

import Link from 'next/link'

interface AdsLandingPageProps {
  city: string
  state: string
  h1: string
  subtitle: string
  neighborhoods?: string[]
}

export default function AdsLandingPage({ city, state, h1, subtitle, neighborhoods }: AdsLandingPageProps) {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            {h1}
          </h1>
          <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            {subtitle}
          </p>
          <Link
            href="/quote?service=haul-away"
            onClick={() => { if (typeof window !== 'undefined' && (window as any).gtag) (window as any).gtag('event', 'ads_conversion_Solicitar_cota_o_1', {}); }}
            className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 rounded-lg text-xl font-bold transition shadow-lg hover:shadow-xl"
          >
            Get Instant Quote
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="mt-3 text-[13px] text-white/70">
            or <a href="sms:+18573229269" className="underline hover:text-white">text us directly</a>
          </p>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-10 border-b">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600">Same-Day</div>
              <p className="text-sm text-gray-500">Pickup Available</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">$99</div>
              <p className="text-sm text-gray-500">All-In Price</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">Live GPS</div>
              <p className="text-sm text-gray-500">Driver Tracking</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">No Hidden</div>
              <p className="text-sm text-gray-500">Fees — Guaranteed</p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Remove */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            What We Remove in {city}, {state}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Old Furniture (sofas, mattresses, tables)',
              'Appliances (fridges, washers, dryers)',
              'Yard Waste & Debris',
              'Garage & Basement Cleanouts',
              'Construction Debris',
              'Electronics & E-Waste',
              'Hot Tubs & Play Sets',
              'Office Furniture & Equipment',
              'General Household Junk',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                <span className="text-primary-600 font-bold">&#10003;</span>
                <span className="text-gray-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 text-xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Get a Quote</h3>
              <p className="text-gray-600 text-sm">Enter your {city} address and tell us what needs to go. Instant pricing in seconds.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 text-xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Pick a Time</h3>
              <p className="text-gray-600 text-sm">Same-day and next-day slots available. Pay online — no cash needed.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 text-xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-bold mb-2">We Handle It</h3>
              <p className="text-gray-600 text-sm">Track your driver live. We do the heavy lifting and leave your space clean.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhoods (if provided) */}
      {neighborhoods && neighborhoods.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">
              Serving All of {city}, {state}
            </h2>
            <div className="flex flex-wrap gap-2">
              {neighborhoods.map((n, i) => (
                <span key={i} className="bg-gray-100 px-3 py-1.5 rounded-full text-sm text-gray-700">
                  {n}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Clear the Clutter?
          </h2>
          <p className="text-gray-300 mb-8">
            Book your {city} junk removal in under 60 seconds.
          </p>
          <Link
            href="/quote?service=haul-away"
            onClick={() => { if (typeof window !== 'undefined' && (window as any).gtag) (window as any).gtag('event', 'ads_conversion_Solicitar_cota_o_1', {}); }}
            className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 rounded-lg text-xl font-bold transition shadow-lg"
          >
            Get Your Free Quote Now
          </Link>
          <p className="mt-3 text-[12px] text-gray-400">
            or <a href="sms:+18573229269" className="underline hover:text-gray-300">text us directly</a>
          </p>
        </div>
      </section>
    </div>
  )
}
