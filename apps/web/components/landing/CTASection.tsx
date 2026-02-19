'use client'

import Link from 'next/link'

export default function CTASection() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Book your junk removal service today or join our network of professional drivers
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quote?service=haul-away"
              className="inline-flex flex-col items-center justify-center bg-orange-500 hover:bg-orange-600 text-white px-8 py-5 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              <span className="text-lg font-bold">Get Your Free Quote!</span>
              <span className="text-sm text-orange-100">Instant pricing in 30 seconds</span>
            </Link>

            <Link
              href="/become-a-driver"
              className="inline-flex flex-col items-center justify-center bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 px-8 py-5 rounded-xl transition-all backdrop-blur-sm"
            >
              <span className="text-lg font-bold">Become a Partner Driver</span>
              <span className="text-sm text-gray-300">Earn on your own schedule</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
