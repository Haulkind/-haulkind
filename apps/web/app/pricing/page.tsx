import Link from 'next/link'

export default function Pricing() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-primary-50 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Transparent Pricing
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            No hidden fees. No surprises. See exactly what you'll pay before you book.
          </p>
        </div>
      </section>

      {/* Junk Removal Pricing */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Junk Removal (Haul Away)
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Pricing based on volume. We haul it away and dispose of it for you.
          </p>

          <div className="grid md:grid-cols-5 gap-6 mb-12">
            {[
              { size: '1/8 Truck', price: '$109', desc: 'Single item or small load' },
              { size: '1/4 Truck', price: '$169', desc: 'Couch, mattress, or 5-8 items' },
              { size: '1/2 Truck', price: '$279', desc: 'Room cleanout, 10-15 items' },
              { size: '3/4 Truck', price: '$389', desc: 'Large furniture set, 15-20 items' },
              { size: 'Full Truck', price: '$529', desc: 'Full house cleanout, 20+ items' },
            ].map((tier) => (
              <div key={tier.size} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="text-4xl font-bold text-primary-600 mb-2">{tier.price}</div>
                <div className="font-bold text-lg mb-2">{tier.size}</div>
                <div className="text-sm text-gray-600">{tier.desc}</div>
                <div className="text-xs text-gray-500 mt-4">+ disposal fees</div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-8 mb-8">
            <h3 className="text-2xl font-bold mb-6">What's Included</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>Labor:</strong> Driver loads and hauls away your items</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>Transportation:</strong> We take it to the proper disposal facility</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>Disposal:</strong> Up to $50 in disposal fees included per load</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>Cleanup:</strong> We sweep up after loading</span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-yellow-900">Additional Fees</h3>
            <ul className="space-y-2 text-gray-700">
              <li><strong>Heavy items:</strong> $25 per item (appliances, pianos, safes)</li>
              <li><strong>Stairs:</strong> $15 per flight (beyond first floor)</li>
              <li><strong>Extra distance:</strong> $1 per mile beyond 5 miles from driver</li>
              <li><strong>Disposal fees:</strong> Actual cost above $50 cap (receipt provided)</li>
              <li><strong>Same-day service:</strong> $50 surcharge (subject to availability)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Labor Only Pricing */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Labor Only (Help Moving)
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Need muscle, not removal? Hire hourly help to move items.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition">
              <div className="text-5xl font-bold text-secondary-600 mb-4">$79/hr</div>
              <div className="text-2xl font-bold mb-4">1 Helper</div>
              <p className="text-gray-600 mb-6">
                Perfect for moving furniture within your home, loading/unloading a small truck, or organizing a garage.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-secondary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>2 hour minimum</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-secondary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Billed in 30-min increments</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition border-2 border-secondary-600">
              <div className="text-5xl font-bold text-secondary-600 mb-4">$129/hr</div>
              <div className="text-2xl font-bold mb-4">2 Helpers</div>
              <p className="text-gray-600 mb-6">
                Ideal for moving heavy furniture, loading/unloading a moving truck, or tackling bigger projects faster.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-secondary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>2 hour minimum</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-secondary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Billed in 30-min increments</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 mb-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-6">What's Included</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-secondary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>Muscle:</strong> Experienced helpers to lift and move items</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-secondary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>Basic tools:</strong> Dollies, straps, and moving blankets</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-secondary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>Flexibility:</strong> Work at your pace, direct the helpers</span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-yellow-900">What's NOT Included</h3>
            <ul className="space-y-2 text-gray-700">
              <li><strong>Transportation:</strong> You provide the truck/van (we just load/unload)</li>
              <li><strong>Disposal:</strong> We don't haul items away (use Haul Away service for that)</li>
              <li><strong>Packing:</strong> We move items, but don't pack boxes</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to get a quote?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            See your exact price in seconds. No account required.
          </p>
          <Link 
            href="/quote"
            className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
          >
            Get a Quote Now
          </Link>
        </div>
      </section>
    </div>
  )
}
