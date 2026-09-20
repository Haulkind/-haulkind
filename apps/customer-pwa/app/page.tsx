'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth'
import CustomerLogo from '@/components/CustomerLogo'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace('/dashboard')
    } else {
      router.replace('/auth')
    }
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-screen">
      <CustomerLogo priority />
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
  )
}
