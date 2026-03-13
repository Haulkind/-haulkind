import Link from 'next/link'

export default function OurStory() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Story
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built by someone who knows what good service looks like — from the inside
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 md:p-10">
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="text-lg leading-relaxed mb-4">
                {"HaulKind was founded by Daniel, a former junk removal driver who spent years working for the big national chains. He saw firsthand how they operate: inflated quotes, hidden fees, and crews that were overworked and underpaid."}
              </p>
              <p className="text-lg leading-relaxed mb-4">
                {"He knew there was a better way. So he built HaulKind — a local service that treats customers AND crews right. Fair, upfront pricing. Real-time GPS tracking so you're never left waiting. And drivers who earn what they deserve."}
              </p>
              <p className="text-lg leading-relaxed mb-6">
                {"Today, HaulKind serves the greater Philadelphia area, New Jersey, and New York with the same values Daniel started with: show up on time, charge a fair price, and treat every home like your own."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Link
                href="/quote"
                className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Get a Free Estimate
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <a
                href="tel:+16094568188"
                className="inline-flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-gray-400 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                Call (609) 456-8188
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
