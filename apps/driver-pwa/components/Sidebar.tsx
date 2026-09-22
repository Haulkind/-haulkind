'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import MenuIcon, { type MenuIconName } from './MenuIcon'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const menuItems: { href: string; label: string; icon: MenuIconName }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/profile', label: 'My Profile', icon: 'profile' },
  { href: '/orders', label: 'My Orders', icon: 'orders' },
  { href: '/orders/history', label: 'Order History', icon: 'history' },
  { href: '/earnings', label: 'Earnings', icon: 'earnings' },
  { href: '/documents', label: 'My Documents', icon: 'documents' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { driver, logout } = useAuth()
  const activeItem = menuItems.filter(entry => pathname === entry.href || pathname?.startsWith(entry.href + '/')).sort((a, b) => b.href.length - a.href.length)[0]
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => { if (panel.current) panel.current.inert = !open }, [open])

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
        aria-label="Driver navigation"
        aria-hidden={!open}
        ref={panel}
        className={`fixed top-0 left-0 bottom-0 w-[min(85vw,340px)] flex flex-col bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0 visible pointer-events-auto' : '-translate-x-full invisible pointer-events-none'
        }`}
      >
        {/* Driver header */}
        <div className="relative bg-gray-800 text-white px-5 pb-5 shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 48px)' }}>
          <button aria-label="Close navigation menu" onClick={onClose} className="absolute left-2 p-3 text-white" style={{ top: 'calc(env(safe-area-inset-top) + 4px)' }}>
            <MenuIcon name="back" />
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
        <nav className="py-2 flex-1 min-h-0 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeItem === item
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={onClose}
                className={`flex items-center gap-4 px-5 py-4 text-base transition ${
                  isActive
                    ? 'text-primary-600 bg-primary-50 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  <MenuIcon name={item.icon} />
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="p-5 border-t border-gray-200 shrink-0" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 text-red-500 font-semibold text-base"
          >
            <MenuIcon name="logout" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
