import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Electronics Disposal & E-Waste Recycling in PA, NJ & NY | HaulKind',
  description: 'Safe electronics disposal and e-waste recycling in Pennsylvania, New Jersey & New York. TVs, computers, monitors, printers removed responsibly. From $89.',
  alternates: { canonical: 'https://haulkind.com/services/electronics' },
  openGraph: {
    title: 'Electronics Disposal & E-Waste Recycling | HaulKind',
    description: 'Old TV, computer, or printer? We remove and recycle electronics responsibly. Fast, affordable, insured. PA, NJ & NY.',
    url: 'https://haulkind.com/services/electronics',
    siteName: 'HaulKind',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Electronics Disposal & E-Waste Recycling | HaulKind',
    description: 'Old TV, computer, or printer? We remove and recycle electronics responsibly. Fast, affordable, insured.',
  },
}

export default function ElectronicsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Electronics Disposal & E-Waste Recycling',
    description: 'Professional electronics disposal and e-waste recycling. TVs, computers, monitors, printers, and more. Responsible recycling guaranteed.',
    provider: {
      '@type': 'LocalBusiness',
      name: 'HaulKind',
      url: 'https://haulkind.com',
      telephone: '+16094568188',
    },
    areaServed: [
      { '@type': 'State', name: 'Pennsylvania' },
      { '@type': 'State', name: 'New Jersey' },
      { '@type': 'State', name: 'New York' },
    ],
    serviceType: 'Electronics Disposal',
    url: 'https://haulkind.com/services/electronics',
  }

  const checkIcon = (
    <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  )

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bg-primary-50 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Electronics Disposal &amp; E-Waste Recycling in PA, NJ &amp; NY
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Old TVs, broken computers, outdated monitors — electronics pile up fast. HaulKind picks up your e-waste and ensures it is recycled responsibly, not dumped in a landfill.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/quote"
              className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition shadow-lg"
            >
              Get a Fast Quote
            </Link>
            <a
              href="tel:+16094568188"
              className="inline-flex items-center gap-2 text-primary-700 font-semibold text-lg hover:text-primary-800 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              (609) 456-8188
            </a>
          </div>
        </div>
      </section>

      {/* About the service */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">Why Proper Electronics Disposal Matters</h2>
          <p className="text-gray-700 text-lg mb-4">
            Electronics contain hazardous materials like lead, mercury, and cadmium that can contaminate soil and groundwater when sent to landfills. Many states — including Pennsylvania, New Jersey, and New York — have regulations requiring responsible e-waste disposal.
          </p>
          <p className="text-gray-700 text-lg mb-4">
            HaulKind takes the hassle out of electronics disposal. We pick up your old TVs, computers, monitors, printers, and other e-waste from wherever they sit in your home or office. Every item we collect is taken to a certified recycling facility where components are separated and processed responsibly.
          </p>
          <p className="text-gray-700 text-lg">
            Whether you are upgrading your home office, clearing out a storage room, or handling a business technology refresh, HaulKind makes electronics disposal simple, fast, and affordable.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">How Electronics Disposal Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Get Your Quote', desc: 'Tell us what electronics you need removed. Upload a photo or describe the items. You get an instant, transparent price — no hidden fees.' },
              { step: '2', title: 'Book Your Pickup', desc: 'Pick a date and time that works for you. Same-day e-waste pickup is available in most areas across PA, NJ & NY.' },
              { step: '3', title: 'We Collect & Recycle', desc: 'Our insured team arrives, carefully removes your electronics, and takes them to a certified recycling facility. You get peace of mind.' },
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
          <h2 className="text-3xl font-bold mb-8">Electronics We Remove &amp; Recycle</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ul className="space-y-3 text-gray-700 text-lg">
              <li className="flex items-start gap-3">{checkIcon}<span>Televisions (LCD, LED, plasma, CRT)</span></li>
              <li className="flex items-start gap-3">{checkIcon}<span>Desktop computers and towers</span></li>
              <li className="flex items-start gap-3">{checkIcon}<span>Laptops and tablets</span></li>
              <li className="flex items-start gap-3">{checkIcon}<span>Computer monitors</span></li>
              <li className="flex items-start gap-3">{checkIcon}<span>Printers, scanners, and copiers</span></li>
              <li className="flex items-start gap-3">{checkIcon}<span>Servers and networking equipment</span></li>
            </ul>
            <ul className="space-y-3 text-gray-700 text-lg">
              <li className="flex items-start gap-3">{checkIcon}<span>Stereos and audio equipment</span></li>
              <li className="flex items-start gap-3">{checkIcon}<span>Gaming consoles</span></li>
              <li className="flex items-start gap-3">{checkIcon}<span>VCRs, DVD/Blu-ray players</span></li>
              <li className="flex items-start gap-3">{checkIcon}<span>Cables, keyboards, and peripherals</span></li>
              <li className="flex items-start gap-3">{checkIcon}<span>Small electronics (routers, modems)</span></li>
              <li className="flex items-start gap-3">{checkIcon}<span>Office electronics and phone systems</span></li>
            </ul>
          </div>
          <p className="text-gray-500 text-sm mt-6">
            Note: We cannot accept hazardous materials such as batteries with visible damage or leaking chemicals. <Link href="/services/what-we-take" className="text-primary-600 hover:underline">See our full list of accepted items</Link>.
          </p>
        </div>
      </section>

      {/* Why choose HaulKind */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Why Choose HaulKind for Electronics Disposal</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Certified E-Waste Recycling', desc: 'Every item we collect goes to a certified recycling facility. Metals, plastics, and components are separated and processed properly.' },
              { title: 'Data Security', desc: 'Worried about personal data? We recommend wiping drives before pickup. For business clients, we can coordinate with certified data destruction partners.' },
              { title: 'No Minimum Quantity', desc: 'Whether it is a single old monitor or an entire office full of outdated equipment, we handle jobs of every size.' },
              { title: 'Transparent, All-In Pricing', desc: 'See your exact price before booking. No surprise fees. Disposal and recycling are included in the quote.' },
              { title: 'Same-Day Pickup Available', desc: 'Need electronics gone today? We offer same-day service in most areas across PA, NJ & NY.' },
              { title: 'Insured & Professional', desc: 'Our drivers are background-checked and fully insured. Your home or office is protected during removal.' },
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
          <h2 className="text-3xl font-bold mb-6">Electronics Disposal Service Areas</h2>
          <p className="text-gray-700 text-lg mb-6">
            HaulKind picks up and recycles electronics across Pennsylvania, New Jersey, and New York. Local drivers mean faster pickups and lower costs.
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

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { q: 'How much does electronics disposal cost?', a: 'Electronics disposal with HaulKind starts at $89 for a few items. Larger pickups (full office cleanouts, multiple TVs) are priced by volume. Get your exact price instantly with our online quote tool.' },
              { q: 'Do you recycle all electronics?', a: 'Yes. Every item we collect goes to a certified e-waste recycling facility. We do not send electronics to landfills. Components like metals, plastics, and glass are separated and processed responsibly.' },
              { q: 'Can you pick up a single TV or monitor?', a: 'Absolutely. No job is too small. We handle single-item pickups as well as full office cleanouts.' },
              { q: 'What about data on old computers and hard drives?', a: 'We recommend wiping or removing hard drives before pickup. For business clients, we can coordinate with certified data destruction partners for secure disposal.' },
              { q: 'Do you offer same-day electronics pickup?', a: 'Yes, same-day service is available in most areas across PA, NJ & NY, subject to availability. Book online or call (609) 456-8188.' },
            ].map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Explore Our Other Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/services/appliances" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Appliance Removal</Link>
            <Link href="/services/furniture" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Furniture Removal</Link>
            <Link href="/services/cleanout" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Property Cleanouts</Link>
            <Link href="/services/what-we-take" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">What We Take</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Rid of Old Electronics?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get your price in seconds. We handle the pickup, hauling, and certified recycling. Serving PA, NJ &amp; NY.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/quote"
              className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              Get a Fast Quote
            </Link>
            <a href="tel:+16094568188" className="text-white/90 hover:text-white font-semibold text-lg transition">
              Or Call (609) 456-8188
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
