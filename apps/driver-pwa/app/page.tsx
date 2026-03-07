'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function RootPage() {
  const router = useRouter()
  const { token, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (token) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [token, isLoading, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg font-semibold">HaulKind Drive</p>
      </div>
    </div>
  )
}
