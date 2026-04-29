import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ADS_CITIES } from '@/lib/ads-cities'
import AdsLandingPage from '@/components/AdsLandingPage'

interface PageProps {
  params: { slug: string }
}

export function generateStaticParams() {
  return ADS_CITIES.map((c) => ({ slug: c.slug }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const city = ADS_CITIES.find((c) => c.slug === params.slug)
  if (!city) return {}

  return {
    title: city.title,
    description: city.metaDescription,
    alternates: { canonical: `https://haulkind.com/ads/${city.slug}` },
    robots: { index: false, follow: true }, // noindex for ads pages — avoid duplicate content
  }
}

export default function AdsPage({ params }: PageProps) {
  const city = ADS_CITIES.find((c) => c.slug === params.slug)
  // NJDEP compliance: refuse to render any New Jersey ads landing page
  // (defense-in-depth — middleware also returns HTTP 410 for these paths).
  if (!city || city.state === 'NJ') notFound()

  return (
    <AdsLandingPage
      city={city.city}
      state={city.state}
      h1={city.h1}
      subtitle={city.subtitle}
      neighborhoods={city.neighborhoods}
    />
  )
}
