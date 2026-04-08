import {
  HeroSection,
  WhyDifferent,
  PriceCalculator,
  HowItWorks,
  Guarantees,
  Testimonials,
  CTASection,
  OurStory,
  ComparisonTable,
} from '@/components/landing'

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero with truck background */}
      <HeroSection />

      {/* Price Anchor */}
      <div className="py-6 bg-primary-50 border-b border-primary-100">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg md:text-xl font-bold text-primary-800 mb-3">
            Half a truck starting at $279 — disposal included, no hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <span className="font-semibold text-sm text-gray-700">Licensed & Insured Drivers</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="font-semibold text-sm text-gray-700">GPS Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="font-semibold text-sm text-gray-700">Price Guaranteed Before You Book</span>
            </div>
          </div>
        </div>
      </div>

      {/* Why HaulKind is Different - 4 feature cards */}
      <WhyDifferent />

      {/* Interactive Price Calculator (UI only - redirects to existing checkout) */}
      <PriceCalculator />


      {/* How It Works - 3 steps */}
      <HowItWorks />

      {/* Comparison Table vs Big Chains */}
      <ComparisonTable />

      {/* Our Guarantees - 4 cards */}
      <Guarantees />

      {/* Google Reviews */}
      <Testimonials />

      {/* Our Story - Founder narrative */}
      <OurStory />

      {/* Final CTA */}
      <CTASection />
    </div>
  )
}
