import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SERVICES } from '@/lib/seo-data'
import { getAllCities } from '@/lib/geo'
import {
  parseSlugNational,
  generatePageContentNational,
  generateFAQsNational,
  generateCityDescription,
  getNearbyCities,
} from '@/lib/seo-data-national'

interface PageProps {
  params: { slug: string }
}

// ISR: pages generated on first visit and revalidated every 24 hours
// Replaces generateStaticParams() to avoid multi-hour builds at national scale (5500+ pages)
export const revalidate = 86400
export const dynamicParams = true

export function generateMetadata({ params }: PageProps): Metadata {
  const data = parseSlugNational(params.slug)
  if (!data) return {}

  const { service, city } = data
  const page = generatePageContentNational(service, city)

  return {
    title: page.title,
    description: page.metaDescription,
    alternates: { canonical: page.url },
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      url: `https://haulkind.com${page.url}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.metaDescription,
    },
  }
}

export default function LocalSEOPage({ params }: PageProps) {
  const data = parseSlugNational(params.slug)
  if (!data) notFound()

  const { service, city } = data
  const page = generatePageContentNational(service, city)
  const faqs = generateFAQsNational(service, city)
  const cityDescription = generateCityDescription(city)

  // Related services in the same city (exclude current)
  const relatedServices = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 5)
  // Nearby cities for cross-linking
  const nearbyCities = getNearbyCities(city, 5)
  // Same service in other cities from same state
  const allCities = getAllCities()
  const sameCityState = allCities.filter((c) => c.stateAbbr === city.stateAbbr && c.slug !== city.slug)

  // Schema markup
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${service.name} in ${city.name}, ${city.stateAbbr}`,
    description: page.metaDescription,
    provider: {
      '@type': 'LocalBusiness',
      name: 'HaulKind',
      url: 'https://haulkind.com',
      telephone: '+1-267-434-7689',
      address: {
        '@type': 'PostalAddress',
        addressLocality: city.name,
        addressRegion: city.stateAbbr,
        addressCountry: 'US',
      },
      areaServed: {
        '@type': 'City',
        name: city.name,
        containedInPlace: {
          '@type': 'State',
          name: city.state,
        },
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: city.lat,
        longitude: city.lng,
      },
    },
    areaServed: {
      '@type': 'City',
      name: city.name,
      containedInPlace: {
        '@type': 'State',
        name: city.state,
      },
    },
    serviceType: service.name,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'USD',
      },
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulkind.com' },
      { '@type': 'ListItem', position: 2, name: 'Service Areas', item: 'https://haulkind.com/service-areas' },
      { '@type': 'ListItem', position: 3, name: city.state, item: `https://haulkind.com/service-areas/${city.stateSlug}` },
      { '@type': 'ListItem', position: 4, name: `${city.name}, ${city.stateAbbr}`, item: `https://haulkind.com/service-areas/${city.stateSlug}/${city.slug}` },
      { '@type': 'ListItem', position: 5, name: service.name, item: `https://haulkind.com${page.url}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="bg-white">
        {/* Breadcrumb */}
        <nav className="container mx-auto px-4 py-3 text-sm text-gray-500" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:text-primary-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/service-areas" className="hover:text-primary-600">Service Areas</Link></li>
            <li>/</li>
            <li><Link href={`/service-areas/${city.stateSlug}`} className="hover:text-primary-600">{city.state}</Link></li>
            <li>/</li>
            <li><span className="text-gray-900 font-medium">{service.name} in {city.name}</span></li>
          </ol>
        </nav>

        {/* Hero + CTA */}
        <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
                  {page.h1}
                </h1>
                <p className="text-lg md:text-xl text-primary-100 mb-6">
                  {service.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/quote"
                    className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition shadow-lg"
                  >
                    Get Instant Quote
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg text-lg font-medium transition"
                  >
                    View Pricing
                  </Link>
                </div>
                <p className="text-primary-200 text-sm mt-4">
                  Starting at {service.priceRange} &middot; Book online in 60 seconds
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center">
                  <div className="text-5xl mb-4">
                    {service.category === 'removal' ? '🚛' : service.category === 'cleanout' ? '🧹' : service.category === 'moving' ? '💪' : '📦'}
                  </div>
                  <h2 className="text-xl font-bold mb-2">Fast & Reliable</h2>
                  <p className="text-primary-100">Same-day service available in {city.name}</p>
                  <div className="mt-4 space-y-2 text-sm text-left text-primary-100">
                    <div className="flex items-center gap-2">
                      <span className="text-green-300">&#10003;</span> Transparent upfront pricing
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-300">&#10003;</span> Track your driver live
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-300">&#10003;</span> Professional, insured crew
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-300">&#10003;</span> Eco-friendly disposal
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic data injection: Local info + Driver availability + Regulations */}
        <section className="py-8 bg-primary-50 border-b border-primary-100">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                <span className="text-2xl" aria-hidden="true">&#x1F4CD;</span>
                <div>
                  <p className="font-semibold text-gray-900">Serving {city.name}</p>
                  <p className="text-sm text-gray-600">{city.county}, {city.stateAbbr} &middot; {city.zipCodes.length} ZIP codes</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                <span className="text-2xl" aria-hidden="true">&#x1F69B;</span>
                <div>
                  <p className="font-semibold text-gray-900">Drivers Available</p>
                  <p className="text-sm text-gray-600">We have drivers available near {city.name} today</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
                <span className="text-2xl" aria-hidden="true">&#x1F4CB;</span>
                <div>
                  <p className="font-semibold text-gray-900">Local Regulations</p>
                  <p className="text-sm text-gray-600">In {city.name}, {city.stateAbbr}, bulk trash rules vary. We ensure compliant disposal.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* City intro with unique description */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Professional {service.name} Services in {city.name}
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              {cityDescription}
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              HaulKind brings professional {service.shortName} services directly to {city.name} residents and businesses. With transparent pricing starting at {service.priceRange}, fast scheduling, and live GPS tracking of your driver, we make {service.shortName} simple and stress-free.
            </p>
          </div>
        </section>

        {/* Google Maps embed */}
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-xl font-bold mb-4">{service.name} Service Area in {city.name}, {city.stateAbbr}</h2>
            <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
              <iframe
                title={`${service.name} service area map - ${city.name}, ${city.stateAbbr}`}
                width="100%"
                height="350"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(city.name + ', ' + city.stateAbbr + ', USA')}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
              />
            </div>
          </div>
        </section>

        {/* What we remove / help with */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              {service.category === 'moving' ? 'What We Help With' : service.category === 'cleanout' ? 'What We Clear Out' : 'What We Remove'}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {service.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
                  <span className="text-primary-600 font-bold">&#10003;</span>
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How HaulKind Works */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              How {service.name} Works with HaulKind in {city.name}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-600 text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Get a Quote</h3>
                <p className="text-gray-600">
                  Enter your {city.name} address on our website and describe what you need removed or moved. Get an instant price in seconds.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-600 text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Book Online</h3>
                <p className="text-gray-600">
                  Pick a time that works for you. Same-day and next-day appointments are available in {city.name} when crews are open.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-600 text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold mb-2">We Handle It</h3>
                <p className="text-gray-600">
                  Our professional crew arrives on time, handles all the heavy lifting, and leaves your space clean. Track your driver live on the map.
                </p>
              </div>
            </div>
            <div className="text-center mt-10">
              <Link
                href="/quote"
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition shadow-lg"
              >
                Get Your Free Quote Now
              </Link>
            </div>
          </div>
        </section>

        {/* Why customers choose HaulKind */}
        <section className="py-12 md:py-16 bg-primary-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              Why {city.name} Customers Choose HaulKind
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.benefits.map((benefit, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-sm">&#10003;</span>
                    <span className="text-gray-800 font-medium">{benefit}</span>
                  </div>
                </div>
              ))}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-sm">&#10003;</span>
                  <span className="text-gray-800 font-medium">Serving {city.name} and all of {city.state}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Transparent {service.name} Pricing in {city.name}
            </h2>
            <p className="text-gray-700 text-lg mb-4">
              {service.name} in {city.name} starts at <span className="font-bold text-primary-600">{service.priceRange}</span>. {service.priceNote}
            </p>
            <p className="text-gray-600 mb-8">
              No hidden fees. No surprise charges. You see the price before you book and that is what you pay. Our pricing is the same whether you are in {city.neighborhoods[0]} or {city.neighborhoods[city.neighborhoods.length - 1]}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition shadow-lg"
              >
                Get Instant Quote
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-lg text-lg font-semibold transition"
              >
                See Full Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Neighborhoods served */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              {service.name} in {city.name} Neighborhoods
            </h2>
            <p className="text-gray-700 mb-6">
              HaulKind provides {service.shortName} services throughout {city.name}, {city.stateAbbr}, including:
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {city.neighborhoods.map((neighborhood, i) => (
                <span key={i} className="bg-white px-4 py-2 rounded-full text-sm text-gray-700 border border-gray-200 shadow-sm">
                  {neighborhood}
                </span>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-gray-600 text-sm font-medium mb-2">ZIP codes we serve in {city.name}:</p>
              <p className="text-gray-500 text-sm">{city.zipCodes.join(', ')}</p>
            </div>
            <p className="text-gray-600 text-sm mt-4">
              We also serve nearby areas including {city.nearbyAreas.join(', ')}. Enter your ZIP code in our quote tool to check coverage instantly.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">
              {service.name} in {city.name} — Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related services in same city */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Other Services in {city.name}, {city.stateAbbr}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedServices.map((s) => (
                <Link
                  key={s.slug}
                  href={`/${s.slug}-${city.slug}`}
                  className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100"
                >
                  <h3 className="font-bold text-primary-600 mb-1">{s.name}</h3>
                  <p className="text-sm text-gray-600">{s.name} in {city.name} &middot; {s.priceRange}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Same service in nearby cities */}
        {nearbyCities.length > 0 && (
          <section className="py-12 md:py-16">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                {service.name} in Nearby {city.state} Cities
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearbyCities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${service.slug}-${c.slug}`}
                    className="bg-gray-50 p-5 rounded-xl hover:bg-primary-50 transition border border-gray-200"
                  >
                    <h3 className="font-bold text-gray-900">{service.name} in {c.name}, {c.stateAbbr}</h3>
                    <p className="text-sm text-gray-600 mt-1">Serving {c.name} and surrounding areas</p>
                  </Link>
                ))}
                {sameCityState.length > nearbyCities.length && (
                  <Link
                    href={`/service-areas/${city.stateSlug}`}
                    className="bg-primary-50 p-5 rounded-xl hover:bg-primary-100 transition border border-primary-200 flex items-center justify-center"
                  >
                    <span className="font-bold text-primary-600">View all {city.state} cities &rarr;</span>
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready for {service.name} in {city.name}?
            </h2>
            <p className="text-primary-100 text-lg mb-8">
              Get a free, no-obligation quote in 60 seconds. Transparent pricing, fast scheduling, and professional service guaranteed.
            </p>
            <Link
              href="/quote"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 rounded-lg text-xl font-bold transition shadow-xl"
            >
              Get Your Free Quote Now
            </Link>
            <p className="text-primary-200 text-sm mt-4">
              No credit card required &middot; Free estimate &middot; Same-day service available
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
