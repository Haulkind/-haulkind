import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import BottomNav from '@/components/BottomNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HaulKind Drive',
  description: 'HaulKind Driver App — Manage orders, track earnings, go online.',
  manifest: '/manifest.json',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HK Drive',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1e3a8a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <main className="min-h-screen pb-20">
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  )
}
