import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mattress Swap & Removal Service | Same-Day | HaulKind',
  description: 'Professional mattress removal and new mattress setup starting at $99. We remove your old mattress and set up the new one. Same-day available in PA & NY.',
  alternates: { canonical: 'https://haulkind.com/mattress-swap' },
  openGraph: {
    title: 'Mattress Swap Service — Starting at $99 | HaulKind',
    description: 'We remove your old mattress and set up your new one. Same-day service. No hidden fees. Serving Philadelphia, NJ & NY.',
    url: 'https://haulkind.com/mattress-swap',
    type: 'website',
  },
}

const pricingRows = [
  { service: 'Twin/Full Swap', price: '$99' },
  { service: 'Queen Swap', price: '$119' },
  { service: 'King/Cal King Swap', price: '$139' },
  { service: 'Removal Only', price: '$79' },
  { service: 'Setup Only', price: '$69' },
]

const addons = [
  { service: 'Box Spring Removal', price: '+$30' },
  { service: 'Box Spring Setup', price: '+$20' },
  { service: 'Bed Frame Disassembly', price: '+$40' },
  { service: 'Bed Frame Assembly', price: '+$97' },
  { service: 'Extra Flight of Stairs', price: '+$20' },
  { service: 'Haul Away Extra Items', price: '+$40' },
]

const faqs = [
  {
    q: 'How much does a mattress swap cost?',
    a: 'A mattress swap starts at $99 for Twin/Full, $119 for Queen, and $139 for King/Cal King. This includes removing your old mattress and setting up the new one. No hidden fees.',
  },
  {
    q: 'Can you do same-day mattress removal?',
    a: 'Yes! Book before noon and we can usually complete your mattress swap the same day. Call (609) 456-8188 to check availability.',
  },
  {
    q: 'Do I need to have my new mattress delivered first?',
    a: "Ideally yes — we'll remove the old mattress and set up the new one in the same visit. If your new mattress hasn't arrived yet, we can schedule accordingly.",
  },
  {
    q: 'What do you do with the old mattress?',
    a: 'We donate mattresses in good condition to local charities and provide a tax donation receipt. Damaged mattresses go to certified recycling facilities.',
  },
  {
    q: 'Can you also assemble my bed frame?',
    a: 'Absolutely! Add bed frame assembly for $97 (standard) to $147 (bunk/loft). We can do it all in one visit.',
  },
  {
    q: 'Do you charge extra for stairs?',
    a: 'We include the first flight of stairs in our base price. Each additional flight is $20.',
  },
]

export default function MattressSwapLandingPage() {
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Mattress Swap & Removal Service',
    description: 'Professional mattress removal and new mattress setup. We remove your old mattress and set up the new one in place. All sizes. Same-day available.',
    provider: {
      '@type': 'Organization',
      name: 'HaulKind',
      url: 'https://haulkind.com',
      telephone: '(609) 456-8188',
    },
    areaServed: ['Philadelphia, PA', 'Camden, NJ', 'Cherry Hill, NJ', 'Trenton, NJ', 'South Jersey', 'NYC Metro Area'],
    offers: {
      '@type': 'Offer',
      price: '99',
      priceCurrency: 'USD',
      description: 'Starting price for mattress swap (Twin/Full). Includes old mattress removal and new mattress setup.',
    },
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen">
        {/* Hero */}
        <section className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Mattress Swap &amp; Removal Service — Starting at $99</h1>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              We remove your old mattress and set up your new one — so you don&apos;t have to lift a finger. Same-day available. No hidden fees.
            </p>
            <Link
              href="/quote/mattress-swap"
              className="inline-block px-8 py-4 bg-white text-purple-700 rounded-xl font-bold text-lg hover:bg-purple-50 transition shadow-lg"
            >
              Get Your Free Quote &rarr;
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: '1', title: 'Book online or call', desc: 'Choose your mattress size and date' },
                { step: '2', title: 'We arrive on time', desc: 'Track your driver with live GPS' },
                { step: '3', title: 'Old out, new in', desc: 'We handle everything — no heavy lifting for you' },
                { step: '4', title: 'Donate or dispose', desc: 'We donate or dispose responsibly — you get a clean bedroom' },
              ].map(s => (
                <div key={s.step} className="text-center">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-600">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-8">Mattress Swap Pricing</h2>
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Service</th>
                    <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingRows.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-6 py-3 text-gray-900">{row.service}</td>
                      <td className="px-6 py-3 text-right font-semibold text-purple-600">{row.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-center text-sm text-gray-500">All prices include labor, pickup, and responsible handling. No hidden fees.</p>
          </div>
        </section>

        {/* Add-ons */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-8">Add-On Services</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {addons.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{a.service}</span>
                  <span className="font-semibold text-purple-600">{a.price}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose HaulKind */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-8">Why Choose HaulKind for Your Mattress Swap?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Upfront pricing', desc: 'Know your cost before we arrive' },
                { title: 'Same-day service', desc: 'Book before noon, done today' },
                { title: 'We donate usable mattresses', desc: 'To local charities with tax receipt' },
                { title: 'Licensed & insured', desc: 'Background-checked crews' },
                { title: 'Real-time GPS tracking', desc: 'Know exactly when we arrive' },
                { title: 'Satisfaction guaranteed', desc: 'Not happy? We make it right' },
              ].map((item, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What Happens */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-6">What Happens to Your Old Mattress?</h2>
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <p className="text-gray-700 leading-relaxed">
                At HaulKind, we don&apos;t just dump your old mattress. If it&apos;s in good condition, we donate it to local charities and provide you with a tax donation receipt. Damaged or heavily worn mattresses are taken to certified recycling facilities. We recycle materials whenever possible.
              </p>
            </div>
          </div>
        </section>

        {/* Areas We Serve */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-6">Areas We Serve</h2>
            <p className="text-gray-600 mb-4">
              Philadelphia, Camden NJ, Cherry Hill, Mount Laurel, Trenton, Princeton, and the greater NYC metro area.
            </p>
            <Link href="/service-areas" className="text-purple-600 font-semibold hover:text-purple-700 transition">
              See all service areas &rarr;
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-purple-600 text-white">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to swap your mattress?</h2>
            <p className="text-purple-100 text-lg mb-8">Get your free quote in 30 seconds.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/quote/mattress-swap"
                className="inline-block px-8 py-4 bg-white text-purple-700 rounded-xl font-bold text-lg hover:bg-purple-50 transition shadow-lg"
              >
                Get Your Free Quote &rarr;
              </Link>
              <a href="tel:+16094568188" className="text-purple-100 hover:text-white font-semibold transition">
                Or call (609) 456-8188
              </a>
            </div>
            <div className="mt-6">
              <Link href="/quote/assembly" className="text-purple-200 hover:text-white text-sm transition">
                Need furniture assembled? Get an assembly quote &rarr;
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
