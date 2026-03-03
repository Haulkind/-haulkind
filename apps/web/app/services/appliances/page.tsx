import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Appliance Removal & Disposal in PA, NY & NJ | HaulKind',
  description: 'Fast appliance removal in Pennsylvania, New York & New Jersey. Fridges, washers, dryers, ovens, dishwashers. We haul and dispose responsibly. From $109.',
  alternates: { canonical: '/services/appliances' },
  openGraph: {
    title: 'Appliance Removal & Disposal | HaulKind',
    description: 'Old fridge, washer, or dryer? We remove and dispose of appliances responsibly. Fast, affordable, insured. PA, NY & NJ.',
    url: 'https://haulkind.com/services/appliances',
  },
}

export default function AppliancesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Appliance Removal & Disposal',
    description: 'Professional appliance removal and responsible disposal. Refrigerators, washers, dryers, ovens, and more.',
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
    serviceType: 'Appliance Removal',
    url: 'https://haulkind.com/services/appliances',
  }

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bg-primary-50 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Appliance Removal & Disposal in PA, NY & NJ
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Old refrigerator taking up space? Broken washer sitting in the basement? HaulKind removes and disposes of appliances the right way — fast, affordable, and hassle-free.
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
          <h2 className="text-3xl font-bold mb-6">Why Appliance Removal Matters</h2>
          <p className="text-gray-700 text-lg mb-4">
            Appliances are some of the hardest items to get rid of on your own. They're heavy, bulky, and most curbside trash services won't take them. Refrigerators and air conditioners contain refrigerants that require proper handling. Washers and dryers are too heavy for one person to move safely.
          </p>
          <p className="text-gray-700 text-lg mb-4">
            HaulKind takes care of the entire process. We disconnect the appliance (if accessible), carry it out of your home regardless of where it's located — basement, second floor, tight hallway — load it onto our truck, and take it to the proper recycling or disposal facility. You don't lift a finger.
          </p>
          <p className="text-gray-700 text-lg">
            Whether you're upgrading your kitchen, clearing out a rental property, or just finally getting rid of that old dryer in the garage, we make it simple. Homeowners, landlords, property managers, and businesses across Pennsylvania, New York, and New Jersey trust HaulKind to handle their appliance removal quickly and professionally.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Get Your Quote', desc: 'Tell us what appliances need to go. Upload a photo or describe the items. You get an instant, transparent price — no hidden fees.' },
              { step: '2', title: 'Book Your Pickup', desc: 'Pick a date and time that works. Same-day appliance removal is available in most areas across PA, NY & NJ.' },
              { step: '3', title: 'We Remove & Dispose', desc: 'Our insured team arrives, carefully removes the appliance from wherever it sits, and takes it for proper recycling or disposal.' },
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
          <h2 className="text-3xl font-bold mb-8">Appliances We Remove</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ul className="space-y-3 text-gray-700 text-lg">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Refrigerators and freezers</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Washing machines</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Dryers</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Ovens and stoves</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Dishwashers</span>
              </li>
            </ul>
            <ul className="space-y-3 text-gray-700 text-lg">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Microwaves</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Air conditioners and window units</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Water heaters</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Dehumidifiers and space heaters</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Exercise equipment and treadmills</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Why choose HaulKind */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Why Choose HaulKind for Appliance Removal</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'No Heavy Lifting for You', desc: 'Our team handles everything — even if the appliance is in a tight basement or up three flights of stairs.' },
              { title: 'Responsible Disposal', desc: 'We recycle metals and components whenever possible. Refrigerants are handled according to EPA regulations.' },
              { title: 'Transparent Pricing', desc: 'See your exact price before booking. No surprise fees at the door. What you see is what you pay.' },
              { title: 'Same-Day Pickup', desc: 'New appliance arriving today? We can often remove the old one the same day you book.' },
              { title: 'Insured & Professional', desc: 'Our drivers are background-checked and insured. Your home is protected during the removal.' },
              { title: 'Live Tracking', desc: 'Track your driver on a live map. Know exactly when they\'ll arrive — no waiting around all day.' },
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
          <h2 className="text-3xl font-bold mb-6">Appliance Removal Service Areas</h2>
          <p className="text-gray-700 text-lg mb-6">
            HaulKind removes appliances across Pennsylvania, New York, and New Jersey. Our local drivers mean faster pickups and lower costs.
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
            <Link href="/services/cleanout" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Property Cleanouts</Link>
            <Link href="/services/furniture" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Furniture Removal</Link>
            <Link href="/services/moving-labor" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Moving Labor</Link>
            <Link href="/services/commercial" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Commercial Services</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Remove That Old Appliance?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get your price in seconds. We handle the heavy lifting, disconnection, and disposal. Serving PA, NY & NJ.
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
