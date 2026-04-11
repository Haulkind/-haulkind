import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SERVICES } from '@/lib/seo-data'
import { getStateBySlug } from '@/lib/geo'
import { generateCityDescription } from '@/lib/seo-data-national'
import type { GeoCity } from '@/lib/geo'

interface PageProps {
  params: { state: string; city: string }
}

export const revalidate = 86400
export const dynamicParams = true

function findCity(stateSlug: string, citySlug: string): { state: ReturnType<typeof getStateBySlug>; city: GeoCity } | null {
  const state = getStateBySlug(stateSlug)
  if (!state) return null
  const city = state.cities.find(c => c.slug === citySlug)
  if (!city) return null
  return { state, city }
}

export function generateMetadata({ params }: PageProps): Metadata {
  const result = findCity(params.state, params.city)
  if (!result) return {}
  const { city } = result

  return {
    title: `Junk Removal & Moving Help in ${city.name}, ${city.stateAbbr} | HaulKind`,
    description: `Professional junk removal, furniture removal, cleanouts, and moving help in ${city.name}, ${city.stateAbbr}. Serving ${city.neighborhoods.length}+ neighborhoods. Transparent pricing, same-day service. Book online.`,
    alternates: { canonical: `/service-areas/${city.stateSlug}/${city.slug}` },
    openGraph: {
      title: `HaulKind Services in ${city.name}, ${city.stateAbbr}`,
      description: `All HaulKind services available in ${city.name}, ${city.stateAbbr}. Junk removal, moving help, cleanouts and more.`,
      url: `https://haulkind.com/service-areas/${city.stateSlug}/${city.slug}`,
    },
  }
}

export default function CityPage({ params }: PageProps) {
  const result = findCity(params.state, params.city)
  if (!result) notFound()
  const { state, city } = result
  const cityDescription = generateCityDescription(city)

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulkind.com' },
      { '@type': 'ListItem', position: 2, name: 'Service Areas', item: 'https://haulkind.com/service-areas' },
      { '@type': 'ListItem', position: 3, name: state!.name, item: `https://haulkind.com/service-areas/${state!.slug}` },
      { '@type': 'ListItem', position: 4, name: `${city.name}, ${city.stateAbbr}`, item: `https://haulkind.com/service-areas/${city.stateSlug}/${city.slug}` },
    ],
  }

  const localBusinessSchema = {
    '@context': 'https://schema.org',
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
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />

      <div className="bg-white">
        {/* Breadcrumb */}
        <nav className="container mx-auto px-4 py-3 text-sm text-gray-500" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:text-primary-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/service-areas" className="hover:text-primary-600">Service Areas</Link></li>
            <li>/</li>
            <li><Link href={`/service-areas/${state!.slug}`} className="hover:text-primary-600">{state!.name}</Link></li>
            <li>/</li>
            <li><span className="text-gray-900 font-medium">{city.name}, {city.stateAbbr}</span></li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16 md:py-20">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              HaulKind Services in {city.name}, {city.stateAbbr}
            </h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
              Professional junk removal, furniture removal, cleanout services, and moving labor in {city.name}. Serving {city.neighborhoods.length}+ neighborhoods with transparent pricing and same-day availability.
            </p>
            <Link
              href="/quote"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition shadow-lg"
            >
              Get Instant Quote in {city.name}
            </Link>
          </div>
        </section>

        {/* City description */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <p className="text-gray-700 text-lg leading-relaxed">{cityDescription}</p>
          </div>
        </section>

        {/* All Services Grid */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              All Services in {city.name}, {city.stateAbbr}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SERVICES.map((service) => (
                <Link
                  key={service.slug}
                  href={`/${service.slug}-${city.slug}`}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition group"
                >
                  <h3 className="text-lg font-bold text-primary-600 group-hover:text-primary-800 mb-2">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{service.description.slice(0, 120)}...</p>
                  <p className="text-sm font-medium text-primary-600">
                    Starting at {service.priceRange} &rarr;
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Neighborhoods */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Neighborhoods We Serve in {city.name}
            </h2>
            <div className="flex flex-wrap gap-3 mb-6">
              {city.neighborhoods.map((neighborhood, i) => (
                <span key={i} className="bg-gray-50 px-4 py-2 rounded-full text-sm text-gray-700 border border-gray-200">
                  {neighborhood}
                </span>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-gray-600 text-sm font-medium mb-2">ZIP codes we serve:</p>
              <p className="text-gray-500 text-sm">{city.zipCodes.join(', ')}</p>
            </div>
            <p className="text-gray-600 text-sm mt-4">
              We also serve nearby areas including {city.nearbyAreas.join(', ')}.
            </p>
          </div>
        </section>

        {/* Google Maps */}
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-xl font-bold mb-4">HaulKind Service Area in {city.name}, {city.stateAbbr}</h2>
            <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
              <iframe
                title={`HaulKind service area map - ${city.name}, ${city.stateAbbr}`}
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

        {/* Other cities in state */}
        {state!.cities.length > 1 && (
          <section className="py-12 md:py-16 bg-gray-50">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                Other Cities in {state!.name}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {state!.cities
                  .filter(c => c.slug !== city.slug)
                  .map((c) => (
                    <Link
                      key={c.slug}
                      href={`/service-areas/${state!.slug}/${c.slug}`}
                      className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100"
                    >
                      <h3 className="font-bold text-gray-900">{c.name}, {c.stateAbbr}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {c.neighborhoods.length}+ neighborhoods &middot; Pop. {c.population.toLocaleString()}
                      </p>
                    </Link>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready for Service in {city.name}?
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

        {/* Back links */}
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-5xl flex gap-6 justify-center">
            <Link href={`/service-areas/${state!.slug}`} className="text-primary-600 hover:text-primary-800 font-medium">
              &larr; All {state!.name} Cities
            </Link>
            <Link href="/service-areas" className="text-primary-600 hover:text-primary-800 font-medium">
              &larr; All States
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
