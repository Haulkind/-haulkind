'use client'

import { useEffect, useRef, useState } from 'react'

const platforms = [
  {
    name: 'Google',
    color: '#4285F4',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    name: 'Yelp',
    color: '#D32323',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path d="M12.271 9.892c-.185.32-.514.502-.862.502-.11 0-.222-.019-.33-.057L5.91 8.493c-.474-.163-.474-.857 0-1.02l5.169-1.844c.108-.038.22-.057.33-.057.348 0 .677.182.862.502.27.469.096 1.066-.38 1.323l-2.59 1.396 2.59 1.396c.476.257.65.854.38 1.323z" fill="#D32323"/>
        <path d="M10.756 12.516c-.095-.543.266-1.063.81-1.158l5.407-.949c.544-.095 1.063.266 1.158.81.095.543-.266 1.063-.81 1.158l-5.407.949c-.544.095-1.063-.266-1.158-.81z" fill="#D32323"/>
        <path d="M11.274 14.635c.303.456.179 1.07-.277 1.373l-4.466 2.964c-.456.303-1.07.179-1.373-.277-.303-.456-.179-1.07.277-1.373l4.466-2.964c.456-.303 1.07-.179 1.373.277z" fill="#D32323"/>
        <path d="M12.726 14.635c-.303.456-.179 1.07.277 1.373l4.466 2.964c.456.303 1.07.179 1.373-.277.303-.456.179-1.07-.277-1.373l-4.466-2.964c-.456-.303-1.07-.179-1.373.277z" fill="#D32323"/>
        <path d="M13.244 12.516c.095-.543-.266-1.063-.81-1.158l-5.407-.949c-.544-.095-1.063.266-1.158.81-.095.543.266 1.063.81 1.158l5.407.949c.544.095 1.063-.266 1.158-.81z" fill="#D32323"/>
      </svg>
    ),
  },
  {
    name: 'Thumbtack',
    color: '#009FD9',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="#009FD9"/>
      </svg>
    ),
  },
  {
    name: 'Nextdoor',
    color: '#00B246',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path d="M12 2L3 9v12h6v-7h6v7h6V9l-9-7z" fill="#00B246"/>
      </svg>
    ),
  },
  {
    name: 'Trustpilot',
    color: '#00B67A',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" fill="#00B67A"/>
      </svg>
    ),
  },
  {
    name: 'TaskRabbit',
    color: '#1DBF73',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" fill="#1DBF73"/>
      </svg>
    ),
  },
]

export default function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollPos, setScrollPos] = useState(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const interval = setInterval(() => {
      if (!el) return
      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll <= 0) return
      setScrollPos((prev) => {
        const next = prev + 2
        if (next >= maxScroll) {
          el.scrollTo({ left: 0, behavior: 'smooth' })
          return 0
        }
        el.scrollTo({ left: next, behavior: 'smooth' })
        return next
      })
    }, 40)
    return () => clearInterval(interval)
  }, [])

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

        {/* Trusted & reviewed on — carousel on mobile */}
        <div className="mt-12 text-center">
          <p className="text-base font-semibold text-gray-500 mb-5">Trusted & reviewed on</p>
          {/* Desktop: all visible in a row */}
          <div className="hidden sm:flex items-center justify-center gap-10">
            {platforms.map((p) => (
              <div key={p.name} className="flex items-center gap-2 group">
                {p.icon}
                <span className="text-lg font-bold text-gray-700 group-hover:text-gray-900 transition-colors">{p.name}</span>
              </div>
            ))}
          </div>
          {/* Mobile: scrolling carousel */}
          <div className="sm:hidden overflow-hidden" ref={scrollRef}>
            <div className="flex items-center gap-8 w-max px-4">
              {[...platforms, ...platforms].map((p, i) => (
                <div key={`${p.name}-${i}`} className="flex items-center gap-2 flex-shrink-0">
                  {p.icon}
                  <span className="text-lg font-bold text-gray-700 whitespace-nowrap">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
