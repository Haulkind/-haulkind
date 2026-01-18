'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function StickyCTA() {
  const pathname = usePathname()
  
  // Don't show on quote page
  if (pathname === '/quote') {
    return null
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
      <Link 
        href="/quote"
        className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
      >
        Get a Quote
      </Link>
    </div>
  )
}
