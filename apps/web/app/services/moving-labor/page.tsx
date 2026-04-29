import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Moving Labor & Loading Help in PA & NY | HaulKind',
  description: 'Affordable moving labor in Pennsylvania and New York. Experienced helpers to load, unload, and move heavy items. From $79/hr. Same-day available.',
  alternates: { canonical: '/services/moving-labor' },
  openGraph: {
    title: 'Moving Labor & Loading Help | HaulKind',
    description: 'Hourly moving help from $79/hr. Load, unload, rearrange furniture. Insured helpers in PA & NY.',
    url: 'https://haulkind.com/services/moving-labor',
  },
}

export default function MovingLaborPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Moving Labor & Loading Help',
    description: 'Hourly moving labor services. Experienced helpers to load, unload, and move heavy furniture and boxes.',
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
    serviceType: 'Moving Labor',
    url: 'https://haulkind.com/services/moving-labor',
  }

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bg-secondary-50 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Moving Labor & Loading Help in PA & NY
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Need strong hands to load a truck, move furniture between rooms, or unload a storage unit? HaulKind sends experienced helpers to your door — no truck needed, just muscle.
          </p>
          <Link
            href="/quote"
            className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition shadow-lg"
          >
            Get a Fast Quote
          </Link>
        </div>
      </section>

      {/* What is moving labor */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">What Is Moving Labor?</h2>
          <p className="text-gray-700 text-lg mb-4">
            Moving labor is simple: you get experienced, insured helpers who show up and do the heavy lifting. Whether you rented your own truck and need someone to load it, you're rearranging furniture in your living room, or you need help unloading a delivery, our team handles it.
          </p>
          <p className="text-gray-700 text-lg mb-4">
            Unlike full-service movers, you only pay for the labor. There's no truck rental fee, no mileage charge, and no minimum distance requirement. You direct the work, and our helpers follow your lead. It's the most flexible and affordable way to get things moved.
          </p>
          <p className="text-gray-700 text-lg">
            HaulKind's moving labor starts at just $79 per hour for one helper or $129 per hour for two. We bring dollies, straps, and moving blankets. Most jobs take 2-4 hours, saving you hundreds compared to traditional moving companies.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-5xl font-bold text-primary-600 mb-4">$79/hr</div>
              <h3 className="text-2xl font-bold mb-4">1 Helper</h3>
              <p className="text-gray-600 mb-4">Perfect for rearranging furniture, loading a small truck, or organizing a garage.</p>
              <p className="text-sm text-gray-500">2-hour minimum. Billed in 30-min increments.</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-primary-600">
              <div className="text-5xl font-bold text-primary-600 mb-4">$129/hr</div>
              <h3 className="text-2xl font-bold mb-4">2 Helpers</h3>
              <p className="text-gray-600 mb-4">Ideal for loading/unloading a moving truck, heavy furniture, or bigger projects.</p>
              <p className="text-sm text-gray-500">2-hour minimum. Billed in 30-min increments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Tell Us What You Need', desc: 'Describe the job — loading a truck, moving furniture, unloading a pod. Get your price instantly with no obligation.' },
              { step: '2', title: 'Pick Your Time', desc: 'Choose a date and time slot. Need help today? Same-day labor is available in most service areas across PA & NY.' },
              { step: '3', title: 'We Show Up Ready', desc: 'Our helpers arrive with dollies, straps, and blankets. You direct the work. Pay only for the hours used.' },
            ].map((item) => (
              <div key={item.step} className="bg-gray-50 rounded-xl p-8 text-center">
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

      {/* What we help with */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">What Our Moving Helpers Do</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ul className="space-y-3 text-gray-700 text-lg">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Load and unload moving trucks</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Move furniture between rooms or floors</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Unload storage pods and containers</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Carry heavy items up or down stairs</span>
              </li>
            </ul>
            <ul className="space-y-3 text-gray-700 text-lg">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Rearrange office or home layouts</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Assemble or disassemble furniture</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Stage homes for real estate showings</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Help with deliveries and large purchases</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Why choose HaulKind */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Why Choose HaulKind for Moving Labor</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Pay by the Hour', desc: 'No flat rate surprises. You pay only for the time our helpers work. Simple and fair.' },
              { title: 'Experienced Helpers', desc: 'Our team knows how to handle heavy furniture, tight doorways, and narrow staircases safely.' },
              { title: 'Equipment Included', desc: 'We bring dollies, furniture straps, and moving blankets at no extra cost.' },
              { title: 'Insured for Your Peace of Mind', desc: 'Every job is covered. If something gets damaged, we handle it.' },
              { title: 'Same-Day Availability', desc: 'Last-minute move? We can often get a helper to you the same day you book.' },
              { title: 'Track Your Helper Live', desc: 'See exactly when your helper will arrive with real-time GPS tracking on your phone.' },
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
          <h2 className="text-3xl font-bold mb-6">Moving Labor Service Areas</h2>
          <p className="text-gray-700 text-lg mb-6">
            HaulKind moving helpers are available across the tri-state area. Whether you're in downtown Philadelphia, a Brooklyn walk-up, or a suburban home in New Jersey, we've got you covered.
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
            <Link href="/services/cleanout" className="bg-gray-50 rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Property Clearing</Link>
            <Link href="/services/furniture" className="bg-gray-50 rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Furniture Removal</Link>
            <Link href="/services/appliances" className="bg-gray-50 rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Appliance Removal</Link>
            <Link href="/services/commercial" className="bg-gray-50 rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Commercial Services</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Need Moving Help Today?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get your price in seconds. Experienced, insured helpers ready when you are. Serving PA & NY.
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
