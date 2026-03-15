'use client'

import Link from 'next/link'

export default function Testimonials() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Rated 5.0 on Google
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {"Don't take our word for it — check our Google reviews"}
          </p>
        </div>

        <div className="flex justify-center">
          <a
            href="https://www.google.com/maps/place/HAULKIND/@40.4568002,-79.7494624,7z/data=!3m1!4b1!4m6!3m5!1s0x8845a863267654c7:0xefde381afa581531!8m2!3d40.4826448!4d-77.1100087!16s%2Fg%2F11n49qgx9f"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white border-2 border-gray-200 hover:border-blue-500 px-8 py-4 rounded-xl text-lg font-semibold text-gray-800 hover:text-blue-600 transition-all shadow-md hover:shadow-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="#4285F4"/>
            </svg>
            Read Our Google Reviews
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </a>
        </div>

        {/* Trust logos */}
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500 mb-4">Trusted & reviewed on</p>
          <div className="flex items-center justify-center gap-8 text-gray-400">
            <span className="text-lg font-semibold">Google</span>
            <span className="text-lg font-semibold">Yelp</span>
            <span className="text-lg font-semibold">Thumbtack</span>
            <span className="text-lg font-semibold hidden sm:inline">Nextdoor</span>
          </div>
        </div>
      </div>
    </section>
  )
}
