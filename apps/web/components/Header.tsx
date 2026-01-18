'use client'

import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary-600">
          Haulkind
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/how-it-works" className="text-gray-700 hover:text-primary-600 transition">
            How It Works
          </Link>
          <Link href="/pricing" className="text-gray-700 hover:text-primary-600 transition">
            Pricing
          </Link>
          <Link href="/service-areas" className="text-gray-700 hover:text-primary-600 transition">
            Service Areas
          </Link>
          <Link href="/become-a-driver" className="text-gray-700 hover:text-primary-600 transition">
            Become a Driver
          </Link>
          <Link href="/faq" className="text-gray-700 hover:text-primary-600 transition">
            FAQ
          </Link>
          <Link 
            href="/quote" 
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition font-medium"
          >
            Get a Quote
          </Link>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>
    </header>
  )
}
