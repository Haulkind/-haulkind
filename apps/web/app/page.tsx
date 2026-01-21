'use client'

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
