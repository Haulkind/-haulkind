import Link from 'next/link'

export default function BecomeADriver() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary-50 to-secondary-100 py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Earn 60% on Every Job
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Work on your schedule. Keep more of what you earn. Get paid weekly.
          </p>
          <Link 
            href="https://driver.haulkind.com/signup"
            className="inline-block bg-secondary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-secondary-700 transition shadow-lg"
          >
            Apply Now
          </Link>
        </div>
      </section>

      {/* Why Drive with Haulkind */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Drive with Haulkind</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">60% Payout</h3>
              <p className="text-gray-600">
                Keep 60% of the service price. That's $63-$317 per haul, or $47-$77 per labor hour. Plus disposal reimbursement.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Your Schedule</h3>
              <p className="text-gray-600">
                Go online when you want. Accept the jobs you want. No penalties for declining. Work full-time or part-time.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Weekly Pay</h3>
              <p className="text-gray-600">
                Get paid every week via direct deposit. Track your earnings in real-time in the driver app.
              </p>
            </div>
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
            href="https://driver.haulkind.com/signup"
            className="inline-block bg-white text-secondary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
          >
            Apply Now
          </Link>
        </div>
      </section>
    </div>
  )
}
