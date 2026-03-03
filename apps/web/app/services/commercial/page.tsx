import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Commercial Junk Removal & Office Cleanouts | HaulKind',
  description: 'Commercial junk removal for offices, warehouses, retail stores, and construction sites in PA, NY & NJ. Fast, insured, affordable. Get a free quote today.',
  alternates: { canonical: '/services/commercial' },
  openGraph: {
    title: 'Commercial Junk Removal & Office Cleanouts | HaulKind',
    description: 'Office furniture, warehouse cleanouts, construction debris. Professional commercial removal in PA, NY & NJ.',
    url: 'https://haulkind.com/services/commercial',
  },
}

export default function CommercialPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Commercial Junk Removal & Office Cleanouts',
    description: 'Professional commercial junk removal for offices, warehouses, retail stores, and construction sites.',
    provider: {
      '@type': 'LocalBusiness',
      name: 'HaulKind',
      url: 'https://haulkind.com',
    },
    areaServed: [
      { '@type': 'State', name: 'Pennsylvania' },
      { '@type': 'State', name: 'New York' },
      { '@type': 'State', name: 'New Jersey' },
    ],
    serviceType: 'Commercial Junk Removal',
    url: 'https://haulkind.com/services/commercial',
  }

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bg-primary-50 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Commercial Junk Removal & Office Cleanouts
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Clearing out an office, renovating a retail space, or cleaning up a job site? HaulKind handles commercial junk removal quickly and professionally so your business stays on schedule.
          </p>
          <Link
            href="/quote"
            className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition shadow-lg"
          >
            Get a Fast Quote
          </Link>
        </div>
      </section>

      {/* About the service */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">Commercial Removal That Works Around Your Schedule</h2>
          <p className="text-gray-700 text-lg mb-4">
            Businesses generate a lot of waste that regular trash pickup can't handle. Old office furniture piling up after a renovation. Warehouse pallets and packaging taking up valuable floor space. Construction debris that needs to go before the next phase of the project can start. These are the kinds of jobs HaulKind was built for.
          </p>
          <p className="text-gray-700 text-lg mb-4">
            We work with property managers, office administrators, general contractors, retail store owners, and warehouse operators across Pennsylvania, New York, and New Jersey. Our team arrives when you need us — before business hours, after closing, or on weekends — so your operations aren't disrupted.
          </p>
          <p className="text-gray-700 text-lg">
            Every commercial job comes with the same transparent pricing you'd get for a residential pickup. No haggling with salespeople, no inflated corporate rates. You describe the job, we give you a price, and we show up ready to work. For recurring needs, we can set up weekly or monthly pickups to keep your space clean without you having to think about it.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Describe the Job', desc: 'Tell us what needs to go and how much. Photos help. We give you a transparent quote instantly — no site visit required for most jobs.' },
              { step: '2', title: 'Schedule Around Your Business', desc: 'Pick a time that minimizes disruption. Early morning, late evening, weekends — we work around your hours.' },
              { step: '3', title: 'We Clear It Out', desc: 'Our insured crew arrives on time, removes everything, and leaves the space clean. We handle disposal, recycling, and donation.' },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-14 h-14 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we handle */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">What We Handle for Businesses</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ul className="space-y-3 text-gray-700 text-lg">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Office furniture and cubicles</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Electronics and old equipment</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Construction and renovation debris</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Warehouse pallets and packaging</span>
              </li>
            </ul>
            <ul className="space-y-3 text-gray-700 text-lg">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Retail store fixtures and displays</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Restaurant equipment</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Bulk trash and general waste</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Yard waste and landscaping debris</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Industries we serve */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Industries We Serve</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Property Management', desc: 'Tenant turnovers, eviction cleanouts, and building maintenance across your portfolio.' },
              { title: 'Construction & Renovation', desc: 'Debris removal between project phases. We keep your job site clean and OSHA-compliant.' },
              { title: 'Offices & Coworking', desc: 'Furniture recycling after downsizing, equipment disposal, and full office cleanouts.' },
              { title: 'Retail & Restaurants', desc: 'Store fixture removal, old equipment disposal, and seasonal inventory cleanups.' },
              { title: 'Warehouses & Storage', desc: 'Pallet disposal, bulk packaging removal, and storage unit cleanouts.' },
              { title: 'Real Estate', desc: 'Pre-listing cleanouts to make properties show-ready. Fast turnaround for closings.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-bold mb-2 text-primary-700">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose HaulKind */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Why Businesses Choose HaulKind</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Flexible Scheduling', desc: 'Before hours, after hours, weekends. We work when it is least disruptive to your business.' },
              { title: 'Volume Discounts', desc: 'Large or recurring jobs get better rates. The more you need removed, the more you save per load.' },
              { title: 'Fully Insured', desc: 'Commercial liability coverage on every job. Your property and our team are both protected.' },
              { title: 'Fast Turnaround', desc: 'Most commercial jobs are completed within 24-48 hours of booking. Same-day available for urgent needs.' },
              { title: 'Responsible Disposal', desc: 'We recycle, donate, and dispose responsibly. Get documentation for your records if needed.' },
              { title: 'No Contracts Required', desc: 'Use us once or set up a recurring schedule. No long-term commitment, no cancellation fees.' },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-2 text-primary-700">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service areas */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">Commercial Service Areas</h2>
          <p className="text-gray-700 text-lg mb-6">
            HaulKind serves businesses across the tri-state area. From Center City Philadelphia to Midtown Manhattan to the industrial corridors of New Jersey, we're nearby and ready.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold text-lg mb-3 text-primary-600">Pennsylvania</h3>
              <ul className="space-y-1 text-gray-700">
                <li>Philadelphia</li><li>Pittsburgh</li><li>Allentown</li><li>Reading</li><li>Scranton</li><li>Harrisburg</li><li>Bethlehem</li><li>Lancaster</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3 text-primary-600">New York</h3>
              <ul className="space-y-1 text-gray-700">
                <li>New York City</li><li>Buffalo</li><li>Rochester</li><li>Syracuse</li><li>Albany</li><li>Yonkers</li><li>White Plains</li><li>Long Island</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3 text-primary-600">New Jersey</h3>
              <ul className="space-y-1 text-gray-700">
                <li>Newark</li><li>Jersey City</li><li>Paterson</li><li>Elizabeth</li><li>Trenton</li><li>Edison</li><li>Woodbridge</li><li>Cherry Hill</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Explore Our Other Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/services/cleanout" className="bg-gray-50 rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Property Cleanouts</Link>
            <Link href="/services/furniture" className="bg-gray-50 rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Furniture Removal</Link>
            <Link href="/services/appliances" className="bg-gray-50 rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Appliance Removal</Link>
            <Link href="/services/moving-labor" className="bg-gray-50 rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Moving Labor</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Need Commercial Junk Removal?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get a transparent quote for your business. Fast, insured, flexible scheduling. Serving PA, NY & NJ.
          </p>
          <Link
            href="/quote"
            className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
          >
            Get a Fast Quote
          </Link>
        </div>
      </section>
    </div>
  )
}
