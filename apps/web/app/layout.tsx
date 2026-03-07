import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StickyCTA from '@/components/StickyCTA'
import RecruitBanner from '@/components/RecruitBanner'
import { QuoteProvider } from '@/lib/QuoteContext'
import { TRPCProvider } from '@/lib/trpc-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'HaulKind - Fast Local Junk Removal & Moving Help | PA, NY, NJ',
    template: '%s | HaulKind',
  },
  description: 'Affordable junk removal and moving labor in Pennsylvania, New York & New Jersey. Transparent pricing from $109. Track your driver live. Same-day service available. Get a free quote in seconds.',
  keywords: [
    'junk removal', 'junk hauling', 'trash removal', 'furniture removal',
    'appliance removal', 'moving help', 'labor only moving',
    'junk removal near me', 'cheap junk removal',
    'junk removal Philadelphia', 'junk removal NYC', 'junk removal New Jersey',
    'same day junk removal', 'furniture pickup', 'mattress removal',
    'yard waste removal', 'construction debris removal',
    'local moving help', 'loading unloading help',
    'Pennsylvania junk removal', 'New York junk removal', 'New Jersey junk removal',
    'transparent pricing junk removal', 'track driver live',
    'HaulKind', 'haul away service',
  ],
  metadataBase: new URL('https://haulkind.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://haulkind.com',
    siteName: 'HaulKind',
    title: 'HaulKind - Fast Local Junk Removal & Moving Help',
    description: 'Affordable junk removal starting at $109. Transparent pricing, live driver tracking, same-day service. Serving PA, NY & NJ. Get a free quote now!',
    images: [
      {
        url: '/haulkind_hero_truck.webp',
        width: 1200,
        height: 630,
        alt: 'HaulKind - Professional Junk Removal Service',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HaulKind - Fast Local Junk Removal & Moving Help',
    description: 'Affordable junk removal starting at $109. Transparent pricing, live driver tracking. Serving PA, NY & NJ.',
    images: ['/haulkind_hero_truck.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'G-KCC7J1ZT6Y',
  },
  category: 'Home Services',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'HaulKind',
    description: 'Fast local junk removal and moving help with transparent pricing. Serving Pennsylvania, New York, and New Jersey.',
    url: 'https://haulkind.com',
    logo: 'https://haulkind.com/haulkind_hero_truck.webp',
    image: 'https://haulkind.com/haulkind_hero_truck.webp',
    email: 'support@haulkind.com',
    areaServed: [
      { '@type': 'State', name: 'Pennsylvania' },
      { '@type': 'State', name: 'New York' },
      { '@type': 'State', name: 'New Jersey' },
    ],
    serviceType: ['Junk Removal', 'Hauling', 'Moving Labor', 'Furniture Removal', 'Appliance Removal'],
    priceRange: '$109 - $529',
    openingHours: 'Mo-Su 07:00-19:00',
    sameAs: [],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Junk Removal & Moving Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Junk Removal (Haul Away)',
            description: 'Professional junk removal service. We load, haul, and dispose of your items.',
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '109',
            priceCurrency: 'USD',
            minPrice: '109',
            maxPrice: '529',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Labor Only (Moving Help)',
            description: 'Hourly moving labor. Helpers to load, unload, and move heavy items.',
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '79',
            priceCurrency: 'USD',
            unitText: 'HOUR',
          },
        },
      ],
    },
  }

  return (
    <html lang="en">
      <head>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-KCC7J1ZT6Y" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-KCC7J1ZT6Y');
          gtag('config', 'AW-17988332947');
          function gtagSendEvent(url) {
            var callback = function () {
              if (typeof url === 'string') {
                window.location = url;
              }
            };
            gtag('event', 'ads_conversion_Solicitar_cota_o_1', {
              'event_callback': callback,
              'event_timeout': 2000,
            });
            return false;
          }
          window.gtagSendEvent = gtagSendEvent;
        `}</Script>
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '4348813218781671');
          fbq('track', 'PageView');
        `}</Script>
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }} src="https://www.facebook.com/tr?id=4348813218781671&ev=PageView&noscript=1" alt="" />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} pb-[72px] md:pb-0`}>
        <TRPCProvider>
          <QuoteProvider>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <RecruitBanner />
            <Footer />
            <StickyCTA />
          </QuoteProvider>
        </TRPCProvider>
      </body>
    </html>
  )
}
