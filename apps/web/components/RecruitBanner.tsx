'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function RecruitBanner() {
  const pathname = usePathname()

  // Hide on /become-a-driver and /quote pages
  if (pathname?.startsWith('/become-a-driver') || pathname?.startsWith('/quote')) {
    return null
  }

  return (
    <div className="hidden md:block bg-gray-100 border-t border-gray-200">
      <div className="container mx-auto px-4 py-3 text-center text-sm text-gray-700">
        Are you a driver in NYC, Philadelphia or NJ? Earn $25–$45/hr on your schedule.{' '}
        <Link href="/become-a-driver" className="text-secondary-600 font-semibold hover:underline">
          Apply as a HaulKind Driver &rarr;
        </Link>
      </div>
    </div>
  )
}
