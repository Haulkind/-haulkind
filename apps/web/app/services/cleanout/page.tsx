import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Property Clearing Services in PA, NY & NJ | HaulKind',
  description: 'Full property clearing services in Pennsylvania, New York & New Jersey. Homes, apartments, garages, basements. Same-day available. Insured & affordable. Get a free quote.',
  alternates: { canonical: '/services/cleanout' },
  openGraph: {
    title: 'Property Clearing Services | HaulKind',
    description: 'Full property clearing — homes, apartments, garages, basements. Fast, affordable, insured. Serving PA, NY & NJ.',
    url: 'https://haulkind.com/services/cleanout',
  },
}

export default function CleanoutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Property Clearing Services',
    description: 'Full property clearing services for homes, apartments, garages, basements, and estates. Professional, insured, and affordable.',
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
    serviceType: 'Property Clearing',
    url: 'https://haulkind.com/services/cleanout',
  }

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bg-primary-50 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Property Clearing Services in PA, NY & NJ
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Whether you're dealing with an estate, moving out of an apartment, or clearing out years of accumulated stuff from a garage or basement, HaulKind handles the heavy lifting so you don't have to.
          </p>
          <Link
            href="/quote"
            className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition shadow-lg"
          >
            Get a Fast Quote
          </Link>
        </div>
      </section>

      {/* What is a cleanout */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">What Is a Property Clearing?</h2>
          <p className="text-gray-700 text-lg mb-4">
            A property clearing means removing everything you don't want from a space — furniture, appliances, trash, personal items, yard debris, and more. It's the fastest way to reclaim a cluttered room, prepare a property for sale, or hand back a rental in clean condition.
          </p>
          <p className="text-gray-700 text-lg mb-4">
            At HaulKind, we handle clearing jobs of all sizes. From a single-room apartment in Newark to a 4-bedroom house in Philadelphia, our insured professionals arrive on time, remove everything you point to, and leave the space clean. We sort items for donation and recycling so you don't have to worry about where it all goes.
          </p>
          <p className="text-gray-700 text-lg">
            Landlords, property managers, real estate agents, homeowners, and families dealing with estates all rely on HaulKind for fast, affordable property clearing across Pennsylvania, New York, and New Jersey.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Get Your Quote', desc: 'Tell us what needs to go. Upload photos or describe the job. You get a transparent price in seconds — no haggling, no hidden fees.' },
              { step: '2', title: 'Schedule Your Pickup', desc: 'Pick a date and time that works for you. Same-day service is available in most areas. We work around your schedule, not the other way around.' },
              { step: '3', title: 'We Handle Everything', desc: 'Our insured team arrives on time, removes every item you want gone, and sweeps up before leaving. Track your driver live on the map.' },
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

      {/* What we clean out */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">What We Clear Out</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ul className="space-y-3 text-gray-700 text-lg">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Entire homes and apartments</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Garages and sheds</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Basements and attics</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Estate clearing</span>
              </li>
            </ul>
            <ul className="space-y-3 text-gray-700 text-lg">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Rental property turnovers</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Foreclosure cleanups</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Hoarding situations</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Yard and outdoor debris</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Why choose HaulKind */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Why Choose HaulKind for Your Property Clearing</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Transparent Pricing', desc: 'You see the exact price before you book. No surprises, no upsells at the door.' },
              { title: 'Same-Day Service', desc: 'Need it done today? We offer same-day cleanouts in most of our service areas.' },
              { title: 'Insured & Professional', desc: 'Every job is covered by insurance. Our team is background-checked and trained.' },
              { title: 'Live Driver Tracking', desc: 'Know exactly when your team arrives. Track your driver on a live map in real time.' },
              { title: 'Eco-Friendly Handling', desc: 'We donate usable items and recycle what we can. Responsible processing is our priority.' },
              { title: 'Local & Reliable', desc: 'We serve Philadelphia, NYC, Newark, and dozens of cities across PA, NY & NJ.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-bold mb-2 text-primary-700">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service areas */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">Property Clearing Service Areas</h2>
          <p className="text-gray-700 text-lg mb-6">
            HaulKind offers property clearing services across the tri-state area. Our drivers are local, which means faster response times and lower costs for you.
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
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Explore Our Other Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/services/furniture" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Furniture Removal</Link>
            <Link href="/services/appliances" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Appliance Removal</Link>
            <Link href="/services/moving-labor" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Moving Labor</Link>
            <Link href="/services/commercial" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Commercial Services</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Clear Out Your Property?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get your exact price in seconds. No account needed, no obligation. Fast, affordable property clearing across PA, NY & NJ.
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
