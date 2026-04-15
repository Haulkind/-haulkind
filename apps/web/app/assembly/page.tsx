import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Furniture Assembly Service | HaulKind - We Build It For You',
  description: 'Professional furniture assembly in Philadelphia. IKEA, Wayfair, Amazon - we assemble it all. Starting at $89. Same-day available. Licensed & insured.',
  openGraph: {
    title: 'Furniture Assembly Service | HaulKind',
    description: 'Professional furniture assembly. IKEA, Wayfair, Amazon - we assemble it all. Starting at $89.',
    url: 'https://haulkind.com/assembly',
  },
}

const assemblyItems = [
  { name: 'Bed Frames', price: 'From $89', icon: '🛏️', desc: 'Platform beds, bunk beds, daybeds' },
  { name: 'Desks & Tables', price: 'From $69', icon: '🪑', desc: 'Office desks, dining tables, standing desks' },
  { name: 'Bookshelves', price: 'From $59', icon: '📚', desc: 'Shelving units, bookcases, wall units' },
  { name: 'Dressers', price: 'From $79', icon: '🗄️', desc: 'Dressers, wardrobes, closet systems' },
  { name: 'Exercise Equipment', price: 'From $99', icon: '🏋️', desc: 'Treadmills, bikes, weight benches' },
  { name: 'Outdoor Furniture', price: 'From $79', icon: '🪴', desc: 'Patio sets, grills, playsets' },
]

const brands = ['IKEA', 'Wayfair', 'Amazon', 'Target', 'Walmart', 'West Elm', 'CB2', 'Ashley']

const faqs = [
  { q: 'How long does assembly take?', a: 'Most single items take 1-2 hours. Complex pieces like bunk beds or large wardrobes may take 2-3 hours.' },
  { q: 'Do I need to have the furniture delivered first?', a: 'Yes, we assemble furniture that has already been delivered to your home. We do not pick up furniture from stores.' },
  { q: 'Can you also remove old furniture?', a: 'Yes! Our Assembly + Removal combo is our most popular option. We assemble the new piece and haul away the old one.' },
  { q: 'What tools do you bring?', a: 'Our team comes fully equipped with all necessary tools. You do not need to provide anything.' },
  { q: 'What if parts are missing?', a: 'We will identify any missing parts and let you know. We can return to complete assembly once you have the replacement parts at no extra charge.' },
]

export default function AssemblyPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-700 text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <span className="inline-block bg-white/20 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            New Service
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Furniture Assembly Service
          </h1>
          <p className="text-xl md:text-2xl text-orange-100 max-w-3xl mx-auto mb-8">
            Skip the frustration. Our pros assemble your furniture quickly and correctly. IKEA, Wayfair, Amazon — we build it all.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quote?service=assembly"
              className="inline-flex items-center justify-center gap-2 bg-white text-orange-700 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition shadow-lg"
            >
              Book Assembly Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <a
              href="tel:+16094568188"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-white/10 transition"
            >
              Call (609) 456-8188
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Tell Us What You Need', desc: 'Select the furniture type, brand, and number of items. Get an instant price estimate.' },
              { step: '2', title: 'We Come to You', desc: 'Our assembly pro arrives with all the tools needed. You relax while we work.' },
              { step: '3', title: 'Done — Enjoy Your Furniture', desc: 'Fully assembled, sturdy, and ready to use. We clean up all packaging too.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  {s.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Assemble */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            What We Assemble
          </h2>
          <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-12">
            From simple shelves to complex bed frames — we handle it all
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {assemblyItems.map((item) => (
              <div key={item.name} className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-md transition">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                <p className="text-sm text-orange-600 font-semibold mb-1">{item.price}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Assembly + Removal Combo */}
      <section className="py-16 bg-orange-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
            <span className="inline-block bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
              Most Popular
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Assembly + Removal Combo
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              New furniture in, old furniture out — all in one visit. We assemble your new piece and haul away the old one. Save time and money.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
              <div className="bg-gray-50 rounded-xl p-6 flex-1 max-w-xs">
                <p className="text-sm text-gray-500 mb-1">Assembly Only</p>
                <p className="text-2xl font-bold text-gray-900">From $89</p>
              </div>
              <div className="text-2xl font-bold text-orange-500">+</div>
              <div className="bg-gray-50 rounded-xl p-6 flex-1 max-w-xs">
                <p className="text-sm text-gray-500 mb-1">Old Item Removal</p>
                <p className="text-2xl font-bold text-gray-900">From $59</p>
              </div>
              <div className="text-2xl font-bold text-orange-500">=</div>
              <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6 flex-1 max-w-xs">
                <p className="text-sm text-orange-600 mb-1">Combo Price</p>
                <p className="text-2xl font-bold text-orange-600">From $129</p>
                <p className="text-xs text-gray-500">Save $19+</p>
              </div>
            </div>
            <Link
              href="/quote?service=assembly"
              className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-orange-600 transition shadow-lg"
            >
              Get Combo Quote
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Brands We Work With */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Brands We Work With</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            We have experience assembling furniture from all major brands
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {brands.map((brand) => (
              <span key={brand} className="text-xl font-semibold text-gray-400 hover:text-gray-600 transition">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose HaulKind for Assembly
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { title: 'Experienced Pros', desc: 'Our team has assembled thousands of pieces. Fast, efficient, and done right.', icon: '🔧' },
              { title: 'All Tools Included', desc: 'We come fully equipped. You do not need to provide anything.', icon: '🧰' },
              { title: 'Same-Day Available', desc: 'Book before noon for same-day assembly service.', icon: '⚡' },
              { title: 'Cleanup Included', desc: 'We take all packaging and trash with us when we leave.', icon: '✨' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-selling */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-xl font-bold text-center text-gray-900 mb-6">Also Available</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/quote?service=haul-away" className="bg-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition text-sm font-medium text-gray-700 hover:text-teal-600">{'Hauling \u2192'}</Link>
            <Link href="/donation-pickup" className="bg-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition text-sm font-medium text-gray-700 hover:text-teal-600">{'Donation Pickup \u2192'}</Link>
            <Link href="/quote?service=labor-only" className="bg-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition text-sm font-medium text-gray-700 hover:text-teal-600">{'Moving Labor \u2192'}</Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-br from-orange-500 to-orange-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Need Furniture Assembled?</h2>
          <p className="text-lg text-orange-100 mb-8 max-w-2xl mx-auto">
            Skip the stress. Book a pro and have your furniture ready in hours, not days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quote?service=assembly"
              className="inline-flex items-center justify-center gap-2 bg-white text-orange-700 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition shadow-lg"
            >
              Book Assembly Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <a
              href="tel:+16094568188"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-white/10 transition"
            >
              Call (609) 456-8188
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
