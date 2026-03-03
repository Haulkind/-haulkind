import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { QuoteProvider } from '@/lib/QuoteContext'
import { TRPCProvider } from '@/lib/trpc-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Haulkind - Fast Local Junk Removal with Transparent Pricing',
  description: 'No memberships. Track your driver live. Drivers keep 60%. Get a quote today.',
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-KCC7J1ZT6Y" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-KCC7J1ZT6Y');
        `}</Script>
      </head>
      <body className={inter.className}>
        <TRPCProvider>
          <QuoteProvider>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </QuoteProvider>
        </TRPCProvider>
      </body>
    </html>
  )
}
