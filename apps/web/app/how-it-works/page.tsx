import Link from 'next/link'

export default function HowItWorks() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-primary-50 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How It Works
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Simple, transparent, and fast. Get junk removed or hire help in three easy steps.
          </p>
        </div>
      </section>

      {/* For Customers */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-primary-600">
            For Customers
          </h2>
          <div className="space-y-16">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-shrink-0 w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-3xl">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4">Get a Quote</h3>
                <p className="text-gray-600 text-lg mb-4">
                  Enter your address and we'll check if we serve your area. Select your service type: Junk Removal (Haul Away) or Labor Only (Help Moving).
                </p>
                <p className="text-gray-600 text-lg mb-4">
                  For Junk Removal, choose your volume (1/8 truck to full truck) and add any extras like heavy items or stairs. For Labor Only, select how many helpers you need and for how long.
                </p>
                <p className="text-gray-600 text-lg">
                  You'll see your total price instantly—no hidden fees, no surprises.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-shrink-0 w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-3xl">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4">Book & Pay</h3>
                <p className="text-gray-600 text-lg mb-4">
                  Choose your preferred date and time. We offer flexible scheduling, including same-day service in most areas (additional fee applies).
                </p>
                <p className="text-gray-600 text-lg mb-4">
                  Pay securely online with your credit card. Your payment is held until the job is complete.
                </p>
                <p className="text-gray-600 text-lg">
                  You'll receive a confirmation email with your booking details and a link to track your driver.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-shrink-0 w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-3xl">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4">Track & Done</h3>
                <p className="text-gray-600 text-lg mb-4">
                  On the day of your booking, track your driver in real-time. You'll see when they're on the way and when they arrive.
                </p>
                <p className="text-gray-600 text-lg mb-4">
                  Point out the items to be removed or the work to be done. Our drivers are professional, courteous, and efficient.
                </p>
                <p className="text-gray-600 text-lg">
                  Once the job is complete, you'll receive a receipt and can rate your experience. That's it!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Drivers */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-secondary-600">
            For Drivers
          </h2>
          <div className="space-y-16">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-shrink-0 w-20 h-20 bg-secondary-600 text-white rounded-full flex items-center justify-center font-bold text-3xl">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4">Sign Up</h3>
                <p className="text-gray-600 text-lg mb-4">
                  Apply online in minutes. You'll need a pickup truck or cargo van, valid driver's license, and proof of insurance.
                </p>
                <p className="text-gray-600 text-lg mb-4">
                  Upload photos of your vehicle and insurance documents. Our team reviews applications within 24 hours.
                </p>
                <p className="text-gray-600 text-lg">
                  Once approved, you'll get access to the driver app and can start accepting jobs immediately.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-shrink-0 w-20 h-20 bg-secondary-600 text-white rounded-full flex items-center justify-center font-bold text-3xl">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4">Accept Jobs</h3>
                <p className="text-gray-600 text-lg mb-4">
                  Go online in the driver app when you're ready to work. You'll receive job offers based on your location and availability.
                </p>
                <p className="text-gray-600 text-lg mb-4">
                  Each offer shows the service type, location, estimated duration, and your payout (60% of the service price).
                </p>
                <p className="text-gray-600 text-lg">
                  Accept the jobs you want. No penalties for declining. Work on your own schedule.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-shrink-0 w-20 h-20 bg-secondary-600 text-white rounded-full flex items-center justify-center font-bold text-3xl">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4">Earn 60%</h3>
                <p className="text-gray-600 text-lg mb-4">
                  Navigate to the customer's location. Complete the job professionally. Mark it complete in the app.
                </p>
                <p className="text-gray-600 text-lg mb-4">
                  You keep 60% of the service price. For disposal jobs, we reimburse your disposal fees above the included amount.
                </p>
                <p className="text-gray-600 text-lg">
                  Get paid weekly via direct deposit. Track your earnings in real-time in the driver app.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to get started?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/quote"
              className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              Get a Quote
            </Link>
            <Link 
              href="/become-a-driver"
              className="inline-block bg-transparent text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition border-2 border-white"
            >
              Become a Driver
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
