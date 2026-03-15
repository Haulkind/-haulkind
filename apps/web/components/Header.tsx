'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [junkOpen, setJunkOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm tracking-tighter">HK</span>
          </div>
          <span className="hidden md:inline text-xl font-extrabold tracking-tight">
            <span className="text-gray-900">Haul</span>
            <span className="text-teal-600">Kind</span>
          </span>
          <span className="inline md:hidden text-lg font-extrabold tracking-tight">
            <span className="text-gray-900">Haul</span>
            <span className="text-teal-600">Kind</span>
          </span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-6">
          {/* Junk Removal dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setJunkOpen(true)}
            onMouseLeave={() => setJunkOpen(false)}
          >
            <button aria-label="Junk Removal menu" aria-expanded={junkOpen} className="text-gray-700 hover:text-primary-600 transition flex items-center gap-1">
              Junk Removal
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {junkOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border py-2 z-50">
                <Link href="/services/furniture" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">Furniture Removal</Link>
                <Link href="/services/appliances" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">Appliance Removal</Link>
                <Link href="/services/cleanout" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">Property Cleanout</Link>
                <Link href="/services/commercial" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">Commercial</Link>
                <Link href="/services/electronics" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">Electronics Disposal</Link>
                <Link href="/services/what-we-take" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">What We Take</Link>
              </div>
            )}
          </div>
          <Link href="/donation-pickup" className="text-gray-700 hover:text-primary-600 transition">
            Donation Pickup
          </Link>
          <Link href="/assembly" className="text-gray-700 hover:text-primary-600 transition">
            Assembly
          </Link>
          <Link href="/pricing" className="text-gray-700 hover:text-primary-600 transition">
            Pricing
          </Link>
          <Link href="/service-areas" className="text-gray-700 hover:text-primary-600 transition">
            Service Areas
          </Link>
          <Link href="/contact" className="text-gray-700 hover:text-primary-600 transition">
            Contact
          </Link>
          <Link 
            href="/quote" 
            onClick={() => { if (typeof window !== 'undefined' && (window as any).gtag) (window as any).gtag('event', 'ads_conversion_Solicitar_cota_o_1', {}); }}
            className="bg-orange-500 text-white px-6 py-2.5 rounded-lg hover:bg-orange-600 transition font-bold shadow-md animate-[pulse_3s_ease-in-out_infinite]"
          >
            Get a Quote
          </Link>
        </div>

        {/* Mobile menu button */}
        <button aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} className="md:hidden text-gray-700" onClick={() => setMobileOpen(!mobileOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t px-4 pb-4">
          <div className="space-y-1 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase px-2 pt-2">Our Services</p>
            <Link href="/quote?service=haul-away" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600 font-medium">Junk Removal</Link>
            <Link href="/donation-pickup" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600 font-medium">Donation Pickup</Link>
            <Link href="/assembly" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600 font-medium">Furniture Assembly</Link>
            <Link href="/quote?service=labor-only" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600 font-medium">Moving Labor</Link>
            <div className="border-t my-2" />
            <Link href="/pricing" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600">Pricing</Link>
            <Link href="/service-areas" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600">Service Areas</Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600">Contact</Link>
            <Link href="/become-a-driver" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600">Become a Driver</Link>
            <Link href="/faq" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600">FAQ</Link>
            <div className="border-t my-2" />
            <a href="tel:+16094568188" className="block px-2 py-2 text-teal-600 font-semibold">Call (609) 456-8188</a>
            <div className="border-t my-2" />
            <Link href="/quote" onClick={() => { setMobileOpen(false); if (typeof window !== 'undefined' && (window as any).gtag) (window as any).gtag('event', 'ads_conversion_Solicitar_cota_o_1', {}); }} className="block bg-orange-500 text-white text-center px-4 py-3 rounded-lg font-bold hover:bg-orange-600 transition">Get a Quote</Link>
          </div>
        </div>
      )}
    </header>
  )
}
