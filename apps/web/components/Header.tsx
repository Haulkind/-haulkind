'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [servicesOpen, setServicesOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary-600">
          Haulkind
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          {/* Services dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button className="text-gray-700 hover:text-primary-600 transition flex items-center gap-1">
              Services
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {servicesOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border py-2 z-50">
                <Link href="/services/cleanout" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">Property Cleanouts</Link>
                <Link href="/services/furniture" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">Furniture Removal</Link>
                <Link href="/services/appliances" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">Appliance Removal</Link>
                <Link href="/services/moving-labor" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">Moving Labor</Link>
                <Link href="/services/commercial" className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">Commercial</Link>
              </div>
            )}
          </div>
          <Link href="/pricing" className="text-gray-700 hover:text-primary-600 transition">
            Pricing
          </Link>
          <Link href="/how-it-works" className="text-gray-700 hover:text-primary-600 transition">
            How It Works
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
                        className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition font-medium"
          >
            Get a Quote
          </Link>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-gray-700" onClick={() => setMobileOpen(!mobileOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t px-4 pb-4">
          <div className="space-y-1 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase px-2 pt-2">Services</p>
            <Link href="/services/cleanout" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600">Property Cleanouts</Link>
            <Link href="/services/furniture" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600">Furniture Removal</Link>
            <Link href="/services/appliances" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600">Appliance Removal</Link>
            <Link href="/services/moving-labor" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600">Moving Labor</Link>
            <Link href="/services/commercial" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600">Commercial</Link>
            <div className="border-t my-2" />
            <Link href="/pricing" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600">Pricing</Link>
            <Link href="/how-it-works" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600">How It Works</Link>
            <Link href="/service-areas" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600">Service Areas</Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600">Contact</Link>
            <Link href="/become-a-driver" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600">Become a Driver</Link>
            <Link href="/faq" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-gray-700 hover:text-primary-600">FAQ</Link>
            <div className="border-t my-2" />
            <Link href="/quote" onClick={() => { setMobileOpen(false); if (typeof window !== 'undefined' && (window as any).gtag) (window as any).gtag('event', 'ads_conversion_Solicitar_cota_o_1', {}); }} className="block bg-primary-600 text-white text-center px-4 py-3 rounded-lg font-medium hover:bg-primary-700 transition">Get a Quote</Link>
          </div>
        </div>
      )}
    </header>
  )
}
