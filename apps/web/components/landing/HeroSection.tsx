'use client'

import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center">
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/haulkind-hero-poster.jpg"
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover object-center"
      >
        <source src="/haulkind-hero.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent z-[1]" />

      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            {"Fast, Fair Hauling & Moving Help — PA & NY"}
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Same-day pickup. Upfront pricing. Real-time tracking. We show up on time — guaranteed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Link
              href="/quote"
              onClick={() => { if (typeof window !== 'undefined' && (window as any).gtag) (window as any).gtag('event', 'ads_conversion_Solicitar_cota_o_1', {}); }}
              className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all shadow-lg hover:shadow-xl"
            >
              Get Your Free Quote Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a
              href="tel:+16094568188"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border-2 border-white/40 px-8 py-4 rounded-lg text-lg font-bold transition-all backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Call (609) 456-8188
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/90 text-sm">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              <span>Licensed & Insured</span>
            </div>
            <span className="text-white/40">|</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <span>5.0 on Google</span>
            </div>
            <span className="text-white/40 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Same-Day Available</span>
            </div>
            <span className="text-white/40 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>No Hidden Fees</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
