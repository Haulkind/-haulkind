'use client'

import Link from 'next/link'

export default function CTASection() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Rid of Your Junk?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Get a free, no-obligation quote in 30 seconds. Same-day pickup available.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quote"
              onClick={() => { if (typeof window !== 'undefined' && (window as any).gtag) (window as any).gtag('event', 'ads_conversion_Solicitar_cota_o_1', {}); }}
              className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-5 rounded-xl transition-all shadow-lg hover:shadow-xl text-lg font-bold"
            >
              Get Your Free Quote Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>

            <a
              href="tel:+16094568188"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 px-8 py-5 rounded-xl transition-all backdrop-blur-sm text-lg font-bold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Call (609) 456-8188
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            No payment required. No obligation. Just honest pricing.
          </p>
        </div>
      </div>
    </section>
  )
}
