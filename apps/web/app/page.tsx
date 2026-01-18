import Link from 'next/link'

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Fast local junk removal — with transparent pricing.
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            No memberships. Track your driver live. Drivers keep 60%.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/quote"
              className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition shadow-lg"
            >
              Get a Quote
            </Link>
            <Link 
              href="/become-a-driver"
              className="bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition border-2 border-primary-600"
            >
              Become a Driver
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bullets */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-700">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Local drivers</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">No memberships</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Transparent pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Real-time tracking</span>
            </div>
          </div>
        </div>
      </section>

      {/* Service Cards */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Junk Removal */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Junk Removal (Haul Away)</h3>
              <p className="text-gray-600 mb-6">
                We haul it away and dispose of it. Perfect for furniture, appliances, yard waste, and general junk.
              </p>
              <Link href="/pricing" className="text-primary-600 font-semibold hover:text-primary-700 transition">
                View Pricing →
              </Link>
            </div>

            {/* Labor Only */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Labor Only (Help Moving)</h3>
              <p className="text-gray-600 mb-6">
                Move items inside your home or load/unload a moving truck. Hourly help when you need muscle, not removal.
              </p>
              <Link href="/pricing" className="text-primary-600 font-semibold hover:text-primary-700 transition">
                View Pricing →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* For Customers */}
            <div>
              <h3 className="text-2xl font-bold mb-8 text-primary-600">For Customers</h3>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Get a Quote</h4>
                    <p className="text-gray-600">Enter your address and select your service. Get instant transparent pricing.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Book & Pay</h4>
                    <p className="text-gray-600">Choose your date and time. Pay securely online. No hidden fees.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Track & Done</h4>
                    <p className="text-gray-600">Track your driver in real-time. They arrive, do the work, and you're done!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Drivers */}
            <div>
              <h3 className="text-2xl font-bold mb-8 text-secondary-600">For Drivers</h3>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-secondary-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Sign Up</h4>
                    <p className="text-gray-600">Apply online with your vehicle info and insurance. Get approved in 24 hours.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-secondary-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Accept Jobs</h4>
                    <p className="text-gray-600">Go online when you're ready. Accept jobs that fit your schedule and location.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-secondary-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Earn 60%</h4>
                    <p className="text-gray-600">Complete the job and keep 60% of the service price. Get paid weekly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Transparent Pricing</h2>
          <p className="text-center text-gray-600 mb-12 text-lg">No hidden fees. See exactly what you'll pay.</p>
          
          <div className="max-w-6xl mx-auto mb-12">
            <h3 className="text-2xl font-bold mb-6 text-center">Junk Removal (Haul Away)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { size: '1/8 Truck', price: '$109' },
                { size: '1/4 Truck', price: '$169' },
                { size: '1/2 Truck', price: '$279' },
                { size: '3/4 Truck', price: '$389' },
                { size: 'Full Truck', price: '$529' },
              ].map((tier) => (
                <div key={tier.size} className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg transition">
                  <div className="text-3xl font-bold text-primary-600 mb-2">{tier.price}</div>
                  <div className="text-sm text-gray-600">{tier.size}</div>
                  <div className="text-xs text-gray-500 mt-2">+ disposal</div>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Labor Only (Help Moving)</h3>
            <p className="text-gray-600 mb-6">
              Need muscle, not removal? Book hourly help.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-3xl font-bold text-secondary-600 mb-2">$79/hr</div>
                <div className="text-sm text-gray-600">1 Helper</div>
                <div className="text-xs text-gray-500 mt-2">2 hour minimum</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-3xl font-bold text-secondary-600 mb-2">$129/hr</div>
                <div className="text-sm text-gray-600">2 Helpers</div>
                <div className="text-xs text-gray-500 mt-2">2 hour minimum</div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing" className="text-primary-600 font-semibold text-lg hover:text-primary-700 transition">
              View Full Pricing Details →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'What areas do you serve?',
                a: 'We serve Pennsylvania, New York, and New Jersey. Check our service areas page for specific coverage.',
              },
              {
                q: 'How quickly can you come?',
                a: 'We offer same-day service in most areas (additional fee applies). Standard bookings are available within 2-3 days.',
              },
              {
                q: 'What can you haul away?',
                a: 'Furniture, appliances, yard waste, construction debris, and general junk. We cannot haul hazardous materials.',
              },
              {
                q: 'Do I need to be present?',
                a: 'Yes, someone must be present to point out items and provide access.',
              },
              {
                q: 'How do drivers earn 60%?',
                a: 'Drivers keep 60% of the service price. We handle payment processing, customer support, and platform costs with our 40%.',
              },
            ].map((faq, idx) => (
              <details key={idx} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <summary className="font-bold text-lg cursor-pointer">{faq.q}</summary>
                <p className="mt-4 text-gray-600">{faq.a}</p>
              </details>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/faq" className="text-primary-600 font-semibold text-lg hover:text-primary-700 transition">
              View All FAQs →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get a free quote in seconds. No account required.
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
