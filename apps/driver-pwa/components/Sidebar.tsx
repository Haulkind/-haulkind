'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'H' },
  { href: '/profile', label: 'My Profile', icon: 'P' },
  { href: '/orders', label: 'My Orders', icon: 'M' },
  { href: '/orders/history', label: 'Order History', icon: 'O' },
  { href: '/earnings', label: 'Earnings', icon: 'E' },
  { href: '/documents', label: 'My Documents', icon: 'D' },
  { href: '/settings', label: 'Settings', icon: 'S' },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { driver, logout } = useAuth()

  // Close sidebar on route change
  useEffect(() => {
    onClose()
  }, [pathname])

  const displayName = driver?.first_name
    ? `${driver.first_name} ${driver.last_name || ''}`.trim()
    : driver?.name || 'Driver'

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout()
      window.location.href = '/login'
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Driver header */}
        <div className="bg-gray-800 text-white px-5 pt-12 pb-5">
          <button onClick={onClose} className="absolute top-3 left-4 text-white/70 text-2xl">
            &lt;
          </button>
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 mx-auto mb-3 flex items-center justify-center">
            {driver?.selfie_url ? (
              <img
                src={driver.selfie_url}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <h2 className="text-lg font-bold text-center">{displayName}</h2>
          <p className="text-sm text-gray-300 text-center truncate">{driver?.email || ''}</p>
        </div>

        {/* Menu items */}
        <nav className="py-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-5 py-4 text-base transition ${
                  isActive
                    ? 'text-primary-600 bg-primary-50 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="text-red-500 font-semibold text-base"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
