'use client'

import { usePathname, useRouter } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', icon: '🏠' },
  { path: '/schedule', label: 'Book', icon: '📦' },
  { path: '/track', label: 'Track', icon: '📍' },
  { path: '/orders', label: 'Orders', icon: '📋' },
  { path: '/profile', label: 'Profile', icon: '👤' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  // Hide on auth page
  if (pathname === '/auth' || pathname === '/') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map(item => {
          const isActive = pathname.startsWith(item.path)
          return (
            <button
              key={item.path}
              onClick={() => {
                if (item.path === '/dashboard' && !isLoggedIn()) {
                  router.push('/auth')
                } else if (item.path === '/orders' && !isLoggedIn()) {
                  router.push('/auth')
                } else if (item.path === '/profile' && !isLoggedIn()) {
                  router.push('/auth')
                } else {
                  router.push(item.path)
                }
              }}
              className={`flex flex-col items-center justify-center w-16 h-full transition ${
                isActive ? 'text-primary-600' : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-0.5 font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
