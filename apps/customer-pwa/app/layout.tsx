import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import InstallBanner from '@/components/InstallBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Haulkind - Track Your Order',
  description: 'Track your junk removal order in real time, manage bookings, and get notifications.',
  manifest: '/manifest.json',
  robots: {
    index: false,
    follow: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Haulkind',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-KCC7J1ZT6Y" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-KCC7J1ZT6Y');
        `}</Script>
      </head>
      <body className={inter.className}>
        <main className="min-h-screen pb-20">
          {children}
        </main>
        <BottomNav />
        <InstallBanner />
      </body>
    </html>
  )
}
