import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Furniture Pickup & Hauling in PA | HaulKind',
  description: 'Fast furniture pickup in Pennsylvania. Couches, mattresses, desks, tables, dressers. We haul it away. From $99. Same-day available.',
  alternates: { canonical: '/services/furniture' },
  openGraph: {
    title: 'Furniture Pickup & Hauling | HaulKind',
    description: 'Old couch, mattress, or desk? We pick up and haul away furniture fast. Affordable, insured. Serving PA.',
    url: 'https://haulkind.com/services/furniture',
  },
}

export default function FurniturePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Furniture Pickup & Hauling',
    description: 'Professional furniture pickup and hauling. Couches, mattresses, desks, tables, dressers, and more.',
    provider: {
      '@type': 'LocalBusiness',
      name: 'HaulKind',
      url: 'https://haulkind.com',
    },
    areaServed: [
      { '@type': 'State', name: 'Pennsylvania' },
    ],
    serviceType: 'Furniture Pickup',
    url: 'https://haulkind.com/services/furniture',
  }

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bg-primary-50 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Furniture Pickup & Hauling in PA
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            That old couch isn't going to move itself. Whether you're replacing a mattress, clearing out a room, or downsizing your home, HaulKind picks up your unwanted furniture and hauls it away — the same day if you need it. Furniture hauling is available in Pennsylvania.
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
          <h2 className="text-3xl font-bold mb-6">Fast, Affordable Furniture Pickup</h2>
          <p className="text-gray-700 text-lg mb-4">
            Getting rid of old furniture is one of those tasks that sounds simple until you actually try to do it. Couches don't fit through doors easily. Mattresses are awkward to carry. Most trash services won't pick up bulky items from the curb. And driving a sofa to the dump yourself? That requires a truck, time, and a willing friend.
          </p>
          <p className="text-gray-700 text-lg mb-4">
            HaulKind eliminates all of that. You tell us what needs to go, we give you an instant price, and our insured team shows up to carry it out — no matter what floor it's on or how tight the hallway is. We handle the heavy lifting, the loading, and the transportation. You just point and we go.
          </p>
          <p className="text-gray-700 text-lg">
            Our pricing starts at $99 for small loads like a single piece of furniture — all-in pricing. Need a full room cleared? We've got truck-load pricing for that too. Everything is transparent — you see the price before you book, and there are no surprise charges at the door. Homeowners, renters, landlords, and offices across Pennsylvania rely on HaulKind for fast, no-hassle furniture pickup.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Describe Your Furniture', desc: 'Tell us what you want removed — couch, mattress, desk, dining set. Upload a photo for a faster, more accurate quote.' },
              { step: '2', title: 'Schedule Pickup', desc: 'Choose a time that works. We offer same-day furniture pickup in most areas. Morning, afternoon, or evening slots available.' },
              { step: '3', title: 'We Haul It Away', desc: 'Our team arrives on time, carries the furniture out carefully, loads it up, and takes it for donation or recycling. Done.' },
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

      {/* What we remove */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Furniture We Pick Up</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ul className="space-y-3 text-gray-700 text-lg">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Couches and sofas</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Mattresses and box springs</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Desks and office furniture</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Dining tables and chairs</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Dressers and wardrobes</span>
              </li>
            </ul>
            <ul className="space-y-3 text-gray-700 text-lg">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Bed frames and headboards</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Bookshelves and entertainment centers</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Recliners and armchairs</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Patio and outdoor furniture</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Cribs, high chairs, and kids furniture</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Why choose HaulKind */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Why Choose HaulKind for Furniture Pickup</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'We Carry It Out', desc: 'No need to drag anything to the curb. We come inside, carry it out, and load it onto our truck — stairs included.' },
              { title: 'Donate When Possible', desc: 'Furniture in good condition? We partner with local charities to donate usable items instead of letting them go to waste.' },
              { title: 'Instant Pricing', desc: 'Get your exact price before you book. Single item or full truckload — no hidden fees, no haggling.' },
              { title: 'Same-Day Pickup', desc: 'Need that couch gone today? We offer same-day furniture pickup in most cities across Pennsylvania.' },
              { title: 'Fully Insured', desc: 'Every job is covered by liability insurance. We protect your home, walls, and doorframes during removal.' },
              { title: 'Track Your Driver', desc: 'Watch your driver approach on a live map. No more wondering when they\'ll show up.' },
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
          <h2 className="text-3xl font-bold mb-6">Furniture Pickup Service Areas</h2>
          <p className="text-gray-700 text-lg mb-6">
            HaulKind picks up unwanted furniture across Pennsylvania. Our local drivers are nearby and ready.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-lg mb-3 text-primary-600">Pennsylvania</h3>
              <ul className="space-y-1 text-gray-700">
                <li>Philadelphia</li><li>Pittsburgh</li><li>Allentown</li><li>Reading</li><li>Scranton</li><li>Harrisburg</li><li>Bethlehem</li><li>Lancaster</li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-6">Furniture pickup services are currently available in Pennsylvania and New York only.</p>
        </div>
      </section>

      {/* Internal links */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Explore Our Other Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/services/cleanout" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Property Clearing</Link>
            <Link href="/services/appliances" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Appliance Pickup</Link>
            <Link href="/services/moving-labor" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Moving Labor</Link>
            <Link href="/services/commercial" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Commercial Services</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Rid of Old Furniture?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get your price in seconds. We pick up from any room, any floor. Fast, affordable furniture pickup across Pennsylvania.
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
