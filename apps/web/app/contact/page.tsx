import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact HaulKind - Get in Touch | PA, NY & NJ',
  description: 'Contact HaulKind for hauling and moving help in Pennsylvania, New York & New Jersey. Email, phone, or get a free quote online. We respond fast.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact HaulKind | PA, NY & NJ',
    description: 'Questions about hauling or moving help? Contact HaulKind. Fast response, transparent pricing. Serving PA, NY & NJ.',
    url: 'https://haulkind.com/contact',
  },
}

export default function ContactPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'HaulKind',
    description: 'Fast local hauling and moving help with transparent pricing.',
    url: 'https://haulkind.com',
    email: 'support@haulkind.com',
    telephone: '+1-800-555-1234',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'PA',
      addressCountry: 'US',
    },
    areaServed: [
      { '@type': 'State', name: 'Pennsylvania' },
      { '@type': 'State', name: 'New York' },
      { '@type': 'State', name: 'New Jersey' },
    ],
    openingHours: 'Mo-Su 07:00-19:00',
  }

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bg-primary-50 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Contact HaulKind
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Have a question about our services, need help with an existing order, or want to partner with us? We're here to help and we respond fast.
          </p>
        </div>
      </section>

      {/* Contact methods */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Get a Quote */}
            <div className="bg-primary-50 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <h2 className="text-xl font-bold mb-3">Get a Free Quote</h2>
              <p className="text-gray-600 mb-4">
                The fastest way to get started. See your exact price in seconds — no phone call needed.
              </p>
              <Link
                href="/quote"
                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
              >
                Get a Quote
              </Link>
            </div>

            {/* Email */}
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gray-700 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h2 className="text-xl font-bold mb-3">Email Us</h2>
              <p className="text-gray-600 mb-4">
                For questions, support, or business inquiries. We typically respond within a few hours.
              </p>
              <a
                href="mailto:support@haulkind.com"
                className="inline-block text-primary-600 font-semibold text-lg hover:underline"
              >
                support@haulkind.com
              </a>
            </div>

            {/* Business hours */}
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gray-700 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-xl font-bold mb-3">Business Hours</h2>
              <p className="text-gray-600 mb-2">
                <strong>Pickups:</strong> Monday - Sunday
              </p>
              <p className="text-gray-600 mb-2">7:00 AM - 7:00 PM</p>
              <p className="text-gray-600 text-sm">
                Online quotes available 24/7
              </p>
            </div>
          </div>

          {/* FAQ-style content */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Common Questions</h2>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-2">How quickly can you come?</h3>
                <p className="text-gray-700">
                  In most areas, we offer same-day service. Book online and select an available time slot. If you need urgent pickup, mention it in your quote request and we'll do our best to accommodate.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-2">Do I need to be there during pickup?</h3>
                <p className="text-gray-700">
                  It depends on the job. For curbside pickups, you can leave the items out and we'll handle the rest. For items inside your home or business, someone needs to be present to grant access and point to what needs to go.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-2">What areas do you serve?</h3>
                <p className="text-gray-700">
                  HaulKind serves Pennsylvania, New York, and New Jersey. Major cities include Philadelphia, New York City, Newark, Jersey City, Pittsburgh, Allentown, and more. <Link href="/service-areas" className="text-primary-600 font-semibold hover:underline">See all service areas</Link>.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-2">How is pricing determined?</h3>
                <p className="text-gray-700">
                  Pricing is based on volume — how much space your items take up in our truck. You see the exact price before you book. No hidden fees, no surprise charges. <Link href="/pricing" className="text-primary-600 font-semibold hover:underline">View our pricing</Link>.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-2">I want to become a HaulKind driver</h3>
                <p className="text-gray-700">
                  We're always looking for reliable drivers with trucks. You keep 70% of every job and set your own schedule. <Link href="/become-a-driver" className="text-primary-600 font-semibold hover:underline">Apply to become a driver</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service areas */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">Where We Operate</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold text-lg mb-3 text-primary-600">Pennsylvania</h3>
              <ul className="space-y-1 text-gray-700">
                <li>Philadelphia</li><li>Pittsburgh</li><li>Allentown</li><li>Reading</li><li>Scranton</li><li>Harrisburg</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3 text-primary-600">New York</h3>
              <ul className="space-y-1 text-gray-700">
                <li>New York City</li><li>Buffalo</li><li>Rochester</li><li>Syracuse</li><li>Albany</li><li>Yonkers</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3 text-primary-600">New Jersey</h3>
              <ul className="space-y-1 text-gray-700">
                <li>Newark</li><li>Jersey City</li><li>Paterson</li><li>Elizabeth</li><li>Trenton</li><li>Edison</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            The fastest way to get started is to get a quote. See your exact price in seconds — no phone call, no waiting.
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
