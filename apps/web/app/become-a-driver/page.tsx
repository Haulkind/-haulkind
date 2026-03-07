import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Become a Driver - Earn 60% on Every Junk Removal Job',
  description: 'Drive with HaulKind and keep 60% of every job. Earn $65-$317 per haul or $47-$77/hr for labor. Work your own schedule. Weekly pay via direct deposit. Apply now.',
  alternates: { canonical: '/become-a-driver' },
  openGraph: {
    title: 'Become a HaulKind Driver - Earn 60% Per Job',
    description: 'Keep 60% of every job. Work your own schedule. Weekly direct deposit. Apply in 5 minutes.',
    url: 'https://haulkind.com/become-a-driver',
  },
}

export default function BecomeADriver() {
  return (
    <div className="bg-white">
      {/* Hero — B1 */}
      <section className="bg-gradient-to-br from-secondary-700 to-secondary-900 text-white py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Your Truck. Your Schedule. Real Money.
          </h1>
          <p className="text-xl md:text-2xl text-secondary-100 mb-8 max-w-3xl mx-auto">
            HaulKind drivers earn $25–$45/hr picking up junk and helping people move. No boss. No warehouse. Just open the app, accept jobs, and get paid weekly.
          </p>
          <Link 
            href="/become-a-driver/apply"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 rounded-lg text-xl font-bold transition shadow-lg hover:shadow-xl"
          >
            Apply in 2 Minutes
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
          <p className="mt-4 text-sm text-secondary-200">
            Actively onboarding drivers in NYC, Long Island, Philadelphia &amp; NJ — limited spots per area
          </p>
        </div>
      </section>

      {/* Why Drive With HaulKind — B2 */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Drive With HaulKind</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">$25–$45/hr Average</h3>
              <p className="text-gray-600 text-sm">
                Keep the majority of every job. Haul-away and labor gigs pay well — and tips are all yours.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">100% Flexible</h3>
              <p className="text-gray-600 text-sm">
                Go online when you want. No shifts, no minimums, no penalties for declining a job.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Weekly Direct Deposit</h3>
              <p className="text-gray-600 text-sm">
                Earnings tracked in real-time. Paid every week straight to your bank account.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Insured &amp; Supported</h3>
              <p className="text-gray-600 text-sm">
                You are covered on every job. Our team is one text away if you need help.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* We're Hiring In These Areas — B3 */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">We&apos;re Hiring In These Areas</h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
            We are actively onboarding drivers in these metro areas. Spots are limited — apply now to secure your area.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { area: 'New York City (All 5 Boroughs)', badge: 'urgent' as const },
              { area: 'Long Island (Nassau & Suffolk)', badge: 'urgent' as const },
              { area: 'Philadelphia, PA', badge: 'urgent' as const },
              { area: 'South Jersey (Camden, Cherry Hill, Voorhees)', badge: 'urgent' as const },
              { area: 'Central NJ (Trenton, Princeton)', badge: 'growing' as const },
              { area: 'Jersey City / Hoboken / Newark', badge: 'growing' as const },
              { area: 'Westchester County, NY', badge: 'growing' as const },
              { area: 'Bucks County, PA', badge: 'growing' as const },
              { area: 'Delaware County, PA', badge: 'growing' as const },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <span className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full ${
                  item.badge === 'urgent'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {item.badge === 'urgent' ? 'HIRING NOW' : 'GROWING'}
                </span>
                <span className="text-gray-800 text-sm font-medium">{item.area}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Requirements</h2>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-secondary-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-bold text-lg mb-2">Vehicle</h3>
                  <p className="text-gray-600">Pickup truck or cargo van. Must be in good working condition.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-secondary-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-bold text-lg mb-2">Driver's License</h3>
                  <p className="text-gray-600">Valid driver's license in PA, NY, or NJ.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-secondary-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-bold text-lg mb-2">Insurance</h3>
                  <p className="text-gray-600">Commercial auto insurance or personal policy that covers business use.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-secondary-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-bold text-lg mb-2">Background Check</h3>
                  <p className="text-gray-600">Pass a basic background check (we handle this after you apply).</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-secondary-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-bold text-lg mb-2">Smartphone</h3>
                  <p className="text-gray-600">iPhone or Android to run the driver app.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-secondary-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-bold text-lg mb-2">Physical Ability</h3>
                  <p className="text-gray-600">Able to lift 50+ lbs and perform physical labor.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works for Drivers */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How It Works</h2>
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 bg-secondary-600 text-white rounded-full flex items-center justify-center font-bold text-2xl">
                1
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Apply Online</h3>
                <p className="text-gray-600 text-lg">
                  Fill out the application (5 minutes). Upload photos of your vehicle and insurance. We review within 24 hours.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 bg-secondary-600 text-white rounded-full flex items-center justify-center font-bold text-2xl">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Get Approved</h3>
                <p className="text-gray-600 text-lg">
                  Once approved, download the driver app and complete a quick orientation video. You're ready to start!
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 bg-secondary-600 text-white rounded-full flex items-center justify-center font-bold text-2xl">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Go Online & Accept Jobs</h3>
                <p className="text-gray-600 text-lg">
                  Open the app and go online. You'll receive job offers nearby. See the payout before you accept. Navigate to the customer and complete the job.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 bg-secondary-600 text-white rounded-full flex items-center justify-center font-bold text-2xl">
                4
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Get Paid</h3>
                <p className="text-gray-600 text-lg">
                  Mark the job complete in the app. Your earnings are tracked in real-time. Get paid every week via direct deposit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="py-16 md:py-24 bg-secondary-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Potential Earnings</h2>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold mb-4 text-secondary-600">Junk Removal (Haul Away)</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex justify-between">
                    <span>1/8 Truck ($109)</span>
                    <span className="font-bold">$65</span>
                  </li>
                  <li className="flex justify-between">
                    <span>1/4 Truck ($169)</span>
                    <span className="font-bold">$101</span>
                  </li>
                  <li className="flex justify-between">
                    <span>1/2 Truck ($279)</span>
                    <span className="font-bold">$167</span>
                  </li>
                  <li className="flex justify-between">
                    <span>3/4 Truck ($389)</span>
                    <span className="font-bold">$233</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Full Truck ($529)</span>
                    <span className="font-bold">$317</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 text-secondary-600">Labor Only (Help Moving)</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex justify-between">
                    <span>1 Helper ($79/hr)</span>
                    <span className="font-bold">$47/hr</span>
                  </li>
                  <li className="flex justify-between">
                    <span>2 Helpers ($129/hr)</span>
                    <span className="font-bold">$77/hr</span>
                  </li>
                </ul>
                <p className="text-sm text-gray-600 mt-4">
                  * 2 hour minimum, billed in 30-min increments
                </p>
              </div>
            </div>

            <div className="bg-secondary-50 rounded-lg p-6">
              <h4 className="font-bold mb-3">Example Weekly Earnings</h4>
              <p className="text-gray-700 mb-4">
                Complete 10 haul-away jobs per week (mix of sizes): <strong>$1,500-$2,000/week</strong>
              </p>
              <p className="text-gray-700">
                Work 20 hours of labor-only jobs per week: <strong>$940-$1,540/week</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ for Drivers */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Driver FAQs</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Do I need commercial insurance?',
                a: 'You need auto insurance that covers business use. Many personal policies include this. Check with your insurance provider.',
              },
              {
                q: 'What if I don\'t have a truck?',
                a: 'You can rent a truck and still make good money. Many drivers start by renting and buy their own truck later.',
              },
              {
                q: 'How do I get reimbursed for disposal fees?',
                a: 'Upload a photo of your disposal receipt in the app. We reimburse fees above $50 within 48 hours.',
              },
              {
                q: 'Can I work in multiple states?',
                a: 'Yes! If you have coverage in multiple service areas, you can accept jobs across state lines.',
              },
              {
                q: 'What if a customer adds more items?',
                a: 'You can request a volume adjustment in the app. The customer pays the difference and your payout increases.',
              },
            ].map((faq, idx) => (
              <details key={idx} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <summary className="font-bold text-lg cursor-pointer">{faq.q}</summary>
                <p className="mt-4 text-gray-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-secondary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to start earning?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Apply now and get approved in 24 hours. Start accepting jobs this week.
          </p>
          <Link 
            href="/become-a-driver/apply"
            className="inline-flex items-center gap-2 bg-white text-secondary-600 px-10 py-5 rounded-lg text-xl font-bold hover:bg-gray-100 transition shadow-lg"
          >
            Apply in 2 Minutes
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      </section>
    </div>
  )
}
