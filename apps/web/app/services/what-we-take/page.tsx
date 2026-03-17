import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'What We Take — Items We Remove & Haul Away | HaulKind',
  description: 'Full list of items HaulKind removes: furniture, appliances, electronics, yard waste, construction debris, and more. See what we take and what we cannot accept.',
  alternates: { canonical: 'https://haulkind.com/services/what-we-take' },
  openGraph: {
    title: 'What We Take — Items We Remove & Haul Away | HaulKind',
    description: 'Full list of items HaulKind removes. Furniture, appliances, electronics, yard waste, construction debris, and more.',
    url: 'https://haulkind.com/services/what-we-take',
    siteName: 'HaulKind',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What We Take — Items We Remove | HaulKind',
    description: 'Full list of items HaulKind removes. Furniture, appliances, electronics, yard waste, construction debris, and more.',
  },
}

export default function WhatWeTakePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Junk Removal — What We Take',
    description: 'HaulKind removes furniture, appliances, electronics, yard waste, construction debris, and more from homes and businesses across PA, NJ & NY.',
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
    serviceType: 'Junk Removal',
    url: 'https://haulkind.com/services/what-we-take',
  }

  const checkIcon = (
    <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  )

  const xIcon = (
    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  )

  const categories = [
    {
      title: 'Furniture',
      icon: '🛋️',
      items: ['Couches & sofas', 'Mattresses & box springs', 'Dressers & wardrobes', 'Tables & chairs', 'Desks & office furniture', 'Bookshelves & cabinets', 'Bed frames & headboards', 'Patio furniture', 'Recliners & ottomans', 'Futons & sleeper sofas'],
      link: '/services/furniture',
    },
    {
      title: 'Appliances',
      icon: '🧊',
      items: ['Refrigerators & freezers', 'Washers & dryers', 'Ovens & stoves', 'Dishwashers', 'Microwaves', 'Air conditioners', 'Water heaters', 'Dehumidifiers', 'Exercise equipment', 'Treadmills & ellipticals'],
      link: '/services/appliances',
    },
    {
      title: 'Electronics & E-Waste',
      icon: '💻',
      items: ['TVs (LCD, LED, plasma, CRT)', 'Computers & laptops', 'Monitors & screens', 'Printers & scanners', 'Stereos & speakers', 'Gaming consoles', 'VCRs & DVD players', 'Cables & peripherals', 'Networking equipment', 'Phone systems'],
      link: '/services/electronics',
    },
    {
      title: 'Yard Waste & Outdoor',
      icon: '🌿',
      items: ['Tree branches & limbs', 'Shrub & bush clippings', 'Grass clippings & leaves', 'Soil & dirt', 'Gravel & rocks', 'Fencing & fence posts', 'Swing sets & play equipment', 'Hot tubs & spas', 'Sheds (disassembled)', 'Grills & outdoor kitchens'],
    },
    {
      title: 'Construction Debris',
      icon: '🔨',
      items: ['Drywall & sheetrock', 'Lumber & plywood', 'Flooring (tile, carpet, vinyl)', 'Cabinets & countertops', 'Windows & doors', 'Roofing materials', 'Concrete & brick (small amounts)', 'Insulation', 'Pipes & plumbing fixtures', 'Light fixtures & electrical'],
    },
    {
      title: 'General Household',
      icon: '📦',
      items: ['Boxes & packing materials', 'Clothing & textiles', 'Books, magazines & papers', 'Toys & baby items', 'Luggage & bags', 'Sports equipment', 'Musical instruments', 'Holiday decorations', 'Garage clutter', 'Basement & attic junk'],
    },
    {
      title: 'Commercial & Office',
      icon: '🏢',
      items: ['Office desks & chairs', 'Filing cabinets', 'Cubicle panels & partitions', 'Conference tables', 'Copiers & printers', 'Commercial shelving', 'Display cases', 'Restaurant equipment', 'Warehouse items', 'Storage units'],
      link: '/services/commercial',
    },
    {
      title: 'Specialty Items',
      icon: '🎯',
      items: ['Pianos & organs', 'Pool tables', 'Gun safes & heavy safes', 'Aquariums & fish tanks', 'Workshop equipment', 'Craft supplies & materials', 'Collections & hoarding cleanup', 'Estate cleanout items', 'Foreclosure cleanout items', 'Rental property cleanout'],
      link: '/services/cleanout',
    },
  ]

  const cannotTake = [
    'Hazardous chemicals & solvents',
    'Paint (liquid — dried paint cans are OK)',
    'Asbestos-containing materials',
    'Medical waste & sharps',
    'Biological waste',
    'Radioactive materials',
    'Propane tanks (full)',
    'Items under active lien or legal dispute',
  ]

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bg-primary-50 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            What We Take — Items We Remove &amp; Haul Away
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            From a single mattress to a full estate cleanout, HaulKind removes almost anything. Here is a complete list of what we take — and the few things we cannot.
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

      {/* Quick summary */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <p className="text-lg text-gray-700">
            <strong>Short answer:</strong> If it fits in our truck and it is not hazardous, we take it. Furniture, appliances, electronics, yard waste, construction debris, office equipment — we handle it all. <strong>All prices include labor, loading, hauling, and disposal.</strong>
          </p>
        </div>
      </section>

      {/* Item categories */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Items We Remove</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {categories.map((cat) => (
              <div key={cat.title} className="bg-white rounded-xl shadow-lg border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl" role="img" aria-label={cat.title}>{cat.icon}</span>
                  <h3 className="text-xl font-bold text-gray-900">{cat.title}</h3>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-gray-700 text-sm">
                      {checkIcon}
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {cat.link && (
                  <Link href={cat.link} className="text-primary-600 hover:text-primary-800 text-sm font-semibold transition">
                    Learn more about {cat.title.toLowerCase()} removal &rarr;
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we cannot take */}
      <section className="py-16 md:py-20 bg-red-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Items We Cannot Accept</h2>
          <p className="text-gray-700 text-lg mb-8">
            For safety and regulatory reasons, there are a few items we cannot remove. If you are unsure whether we can take something, just ask — we are happy to help.
          </p>
          <div className="bg-white rounded-xl shadow p-6">
            <ul className="grid md:grid-cols-2 gap-3">
              {cannotTake.map((item) => (
                <li key={item} className="flex items-start gap-2 text-gray-700">
                  {xIcon}
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            For hazardous waste disposal, contact your local waste management authority. In Philadelphia, call 311 or visit <a href="https://www.phila.gov/services/trash-recycling-city-upkeep/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">phila.gov</a>.
          </p>
        </div>
      </section>

      {/* Donation note */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">Items in Good Condition? We Donate Them</h2>
          <p className="text-gray-700 text-lg mb-4">
            If your items are still in usable condition — furniture, clothing, electronics, household goods — HaulKind will donate them to local charities instead of sending them to a landfill. You may even qualify for a tax deduction.
          </p>
          <p className="text-gray-700 text-lg mb-6">
            Our <Link href="/donation-pickup" className="text-primary-600 hover:underline font-semibold">Donation Pickup service</Link> makes it easy to give back while clearing out your space.
          </p>
        </div>
      </section>

      {/* How pricing works */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">How Pricing Works</h2>
          <p className="text-gray-700 text-lg mb-4">
            HaulKind prices by truck volume — how much space your items take up. A few small items cost less than a full truck load. Every quote includes labor, loading, hauling, and disposal. No hidden fees.
          </p>
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { size: 'Minimum Pickup (few items)', price: 'From $89' },
                { size: 'Quarter Truck', price: 'From $179' },
                { size: 'Half Truck', price: 'From $314' },
                { size: 'Full Truck', price: 'From $648' },
              ].map((tier) => (
                <div key={tier.size} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">{tier.size}</span>
                  <span className="text-primary-700 font-bold">{tier.price}</span>
                </div>
              ))}
            </div>
            <p className="text-center mt-4">
              <Link href="/pricing" className="text-primary-600 hover:text-primary-800 font-semibold transition">
                See full pricing details &rarr;
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Explore Our Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/services/furniture" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Furniture Removal</Link>
            <Link href="/services/appliances" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Appliance Removal</Link>
            <Link href="/services/electronics" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Electronics Disposal</Link>
            <Link href="/services/cleanout" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition text-center font-medium text-primary-600">Property Cleanouts</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Clear the Clutter?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get your price in seconds. We remove almost anything — furniture, appliances, electronics, yard waste, construction debris, and more.
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
