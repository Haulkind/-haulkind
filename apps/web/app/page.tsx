import {
  HeroSection,
  WhyDifferent,
  PriceCalculator,
  ServicesGrid,
  HowItWorks,
  Guarantees,
  Testimonials,
  CTASection,
  OurStory,
  ComparisonTable,
  LatestBlog,
} from '@/components/landing'

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero with truck background */}
      <HeroSection />

      {/* Price Anchor */}
      <div className="py-4 bg-primary-50 border-b border-primary-100">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[15px] font-semibold text-primary-800">
            Half a truck starting at $279 — disposal included, no hidden fees.
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Licensed & insured drivers · GPS tracking · Price guaranteed before you book
          </p>
        </div>
      </div>

      {/* Why HaulKind is Different - 4 feature cards */}
      <WhyDifferent />

      {/* Interactive Price Calculator (UI only - redirects to existing checkout) */}
      <PriceCalculator />

      {/* Services Grid - 6 cards including Donation Pickup & Assembly */}
      <ServicesGrid />

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

      {/* Latest from the Blog */}
      <LatestBlog />

      {/* Final CTA */}
      <CTASection />
    </div>
  )
}
