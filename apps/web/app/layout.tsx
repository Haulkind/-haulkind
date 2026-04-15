import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import dynamic from 'next/dynamic'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PhoneBar from '@/components/PhoneBar'
import { QuoteProvider } from '@/lib/QuoteContext'
import { TRPCProvider } from '@/lib/trpc-provider'

// Lazy-load non-critical layout components to reduce initial JS bundle / TBT
const StickyCTA = dynamic(() => import('@/components/StickyCTA'), { ssr: false })
const RecruitBanner = dynamic(() => import('@/components/RecruitBanner'), { ssr: false })
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false })

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'HaulKind - Fast Local Hauling & Moving Help | PA, NY, NJ',
    template: '%s | HaulKind',
  },
  description: 'Affordable hauling, moving labor & furniture donation pickup in PA, NY & NJ. All-in pricing from $99. Same-day service. Get a free quote now!',
  keywords: [
    'hauling service', 'moving help', 'labor only moving',
    'furniture pickup', 'mattress swap',
    'local moving help', 'loading unloading help',
    'furniture donation pickup', 'moving labor',
    'furniture assembly', 'donation pickup',
    'transparent pricing', 'track driver live',
    'HaulKind', 'same day service',
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
    title: 'HaulKind — Fast, Fair Hauling & Moving Help',
    description: 'Same-day hauling, donation pickup & furniture assembly in PA, NJ & NY. Upfront pricing, GPS tracking, licensed & insured. Call (609) 456-8188',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HaulKind — Fast, Fair Hauling & Moving Help',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HaulKind — Fast, Fair Hauling & Moving Help',
    description: 'Same-day hauling & moving help in PA, NJ & NY. Upfront pricing, GPS tracking.',
    images: ['/og-image.png'],
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
    description: 'Fast local hauling, moving labor, and furniture donation pickup with transparent pricing. Serving Pennsylvania, New York, and New Jersey.',
    url: 'https://haulkind.com',
    logo: 'https://haulkind.com/logo-full.svg',
    image: 'https://haulkind.com/og-image.png',
    telephone: '+1-609-456-8188',
    email: 'support@haulkind.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Philadelphia',
      addressRegion: 'PA',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 39.9526,
      longitude: -75.1652,
    },
    areaServed: [
      { '@type': 'State', name: 'Pennsylvania' },
      { '@type': 'State', name: 'New York' },
      { '@type': 'State', name: 'New Jersey' },
    ],
    serviceType: ['Hauling', 'Moving Labor', 'Donation Pickup', 'Furniture Assembly', 'Mattress Swap', 'Loading & Unloading'],
    priceRange: '$79 - $529',
    openingHours: 'Mo-Su 07:00-19:00',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      reviewCount: '7',
      bestRating: '5',
    },
    sameAs: [],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Hauling & Moving Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Hauling Service',
            description: 'Professional hauling service. We load, transport, and handle your items with care.',
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '99',
            priceCurrency: 'USD',
            minPrice: '99',
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
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Donation Pickup',
            description: 'We pick up gently-used items and deliver them to local charities. Tax receipt available.',
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '109',
            priceCurrency: 'USD',
                        minPrice: '99',
                        maxPrice: '389',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Furniture Assembly',
            description: 'Professional furniture assembly for IKEA, Wayfair, Amazon and more.',
          },
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: '89',
            priceCurrency: 'USD',
            minPrice: '59',
            maxPrice: '299',
          },
        },
      ],
    },
  }

  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager — deferred to reduce TBT */}
        <Script id="gtm-head" strategy="lazyOnload">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-KNBG3C48');
        `}</Script>
        {/* Preload hero poster for instant LCP paint (no video preload — too heavy for mobile) */}
        <link rel="preload" href="/haulkind-hero-poster.jpg" as="image" />
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0D9488" />
        <link rel="manifest" href="/site.webmanifest" />
        {/* DNS-prefetch only (no preconnect) since scripts are deferred via lazyOnload */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-KCC7J1ZT6Y" strategy="lazyOnload" />
        <Script id="gtag-init" strategy="lazyOnload">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-KCC7J1ZT6Y');
          gtag('config', 'AW-17988332947');
          gtag('config', 'AW-17510762936');
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
        <Script id="meta-pixel" strategy="lazyOnload">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1470537883812602');
          fbq('track', 'PageView');
        `}</Script>
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }} src="https://www.facebook.com/tr?id=1470537883812602&ev=PageView&noscript=1" alt="Meta Pixel tracking" />
        </noscript>
        <Script id="microsoft-clarity" strategy="lazyOnload">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "vx0i6awb5i");
        `}</Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} pb-[72px] md:pb-0`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KNBG3C48" height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
        </noscript>
        <TRPCProvider>
          <QuoteProvider>
            <PhoneBar />
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <RecruitBanner />
            <Footer />
            <StickyCTA />
            <CookieConsent />
          </QuoteProvider>
        </TRPCProvider>
      </body>
    </html>
  )
}
