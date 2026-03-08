'use client'

import Link from 'next/link'

import {
  HeroSection,
  WhyDifferent,
  PriceCalculator,
  ServicesGrid,
  HowItWorks,
  Guarantees,
  Testimonials,
  CTASection,
} from '@/components/landing'

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero with truck background */}
      <HeroSection />

      <div className="py-3 border-b border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[13px] text-gray-500">
            Are you a driver in NYC, Philadelphia or NJ? Earn $25–$45/hr →{' '}
            <Link href="/become-a-driver" className="text-primary-700 hover:underline">
              Join Our Driver Network
            </Link>
          </p>
        </div>
      </div>

      {/* Price Anchor — BLOCO 2B */}
      <div className="py-4 bg-primary-50 border-b border-primary-100">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[15px] font-semibold text-primary-800">
            Half a truck starting at $314 — disposal included, no hidden fees.
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Licensed & insured drivers · GPS tracking · Price guaranteed before you book
          </p>
        </div>
      </div>

      {/* Why HaulKind is Different - 3 feature cards */}
      <WhyDifferent />

      {/* Interactive Price Calculator (UI only - redirects to existing checkout) */}
      <PriceCalculator />

      {/* Services Grid */}
      <ServicesGrid />

      {/* How It Works - 3 steps */}
      <HowItWorks />

      {/* Our Guarantees - 4 cards */}
      <Guarantees />

      {/* Testimonials + Stats */}
      <Testimonials />

      {/* Final CTA */}
      <CTASection />
    </div>
  )
}
