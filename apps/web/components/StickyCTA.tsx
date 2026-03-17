'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function StickyCTA() {
  const pathname = usePathname()
  
  // Don't show on quote pages
  if (pathname?.startsWith('/quote')) {
    return null
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg z-40">
      <div className="flex gap-3">
        <a
          href="tel:+16094568188"
          onClick={() => { if (typeof window !== 'undefined' && (window as any).clarity) (window as any).clarity('set', 'phone_clicked', 'true'); }}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-200 transition text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          Call Now
        </a>
        <a
          href="sms:+16094568188"
          onClick={() => { if (typeof window !== 'undefined' && (window as any).clarity) (window as any).clarity('set', 'sms_clicked', 'true'); }}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-200 transition text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          Text Us
        </a>
        <Link
          href="/quote"
          onClick={() => { if (typeof window !== 'undefined' && (window as any).gtag) (window as any).gtag('event', 'ads_conversion_Solicitar_cota_o_1', {}); }}
          className="flex-1 flex items-center justify-center bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition text-sm"
        >
          Get Quote
        </Link>
      </div>
    </div>
  )
}
