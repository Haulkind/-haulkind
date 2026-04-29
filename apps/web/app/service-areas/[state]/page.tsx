import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SERVICES } from '@/lib/seo-data'
import { getStateBySlug } from '@/lib/geo'

interface PageProps {
  params: { state: string }
}

export const revalidate = 86400
export const dynamicParams = true

export function generateMetadata({ params }: PageProps): Metadata {
  // NJDEP compliance: refuse metadata for any New Jersey state page.
  if (params.state === 'new-jersey') return { robots: { index: false, follow: false } }

  const state = getStateBySlug(params.state)
  if (!state) return {}

  return {
    title: `Hauling & Moving Help in ${state.name} | HaulKind`,
    description: `Professional hauling, furniture pickup, moving help, and more across ${state.name}. Serving ${state.cities.length} cities with transparent pricing and same-day service. Book online in 60 seconds.`,
    alternates: { canonical: `/service-areas/${state.slug}` },
    openGraph: {
      title: `Hauling & Moving Help in ${state.name} | HaulKind`,
      description: `Professional hauling and moving help in ${state.cities.length} cities across ${state.name}. Book online in 60 seconds.`,
      url: `https://haulkind.com/service-areas/${state.slug}`,
    },
  }
}

export default function StatePage({ params }: PageProps) {
  // NJDEP compliance: NJ state hub is permanently gone (middleware returns 410).
  // This notFound() is defense-in-depth in case a request bypasses middleware.
  if (params.state === 'new-jersey') notFound()

  const state = getStateBySlug(params.state)
  if (!state) notFound()

  const featuredServices = SERVICES.filter((s) =>
    ['junk-removal', 'furniture-removal', 'mattress-removal', 'appliance-removal', 'garage-cleanout', 'moving-help'].includes(s.slug)
  )

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulkind.com' },
      { '@type': 'ListItem', position: 2, name: 'Service Areas', item: 'https://haulkind.com/service-areas' },
      { '@type': 'ListItem', position: 3, name: state.name, item: `https://haulkind.com/service-areas/${state.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="bg-white">
        {/* Breadcrumb */}
        <nav className="container mx-auto px-4 py-3 text-sm text-gray-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1">
            <li><Link href="/" className="hover:text-primary-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/service-areas" className="hover:text-primary-600">Service Areas</Link></li>
            <li>/</li>
            <li><span className="text-gray-900 font-medium">{state.name}</span></li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16 md:py-20">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Hauling &amp; Moving Help in {state.name}
            </h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
              HaulKind provides professional hauling, furniture pickup, moving labor, and more across {state.cities.length} cities in {state.name}. Find your city below and book online in 60 seconds.
            </p>
            <Link
              href="/quote"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition shadow-lg"
            >
              Get Instant Quote
            </Link>
          </div>
        </section>

        {/* Cities Grid */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Cities We Serve in {state.name}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.cities.map((city) => (
                <div key={city.slug} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    <Link href={`/service-areas/${state.slug}/${city.slug}`} className="hover:text-primary-600">
                      {city.name}, {city.stateAbbr}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Population: {city.population.toLocaleString()} &middot; {city.neighborhoods.length}+ neighborhoods
                  </p>
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Popular services:</p>
                    {featuredServices.slice(0, 4).map((service) => (
                      <Link
                        key={service.slug}
                        href={`/${service.slug}-${city.slug}`}
                        className="block text-sm text-primary-600 hover:text-primary-800 hover:underline"
                      >
                        {service.name} in {city.name} &rarr;
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`/service-areas/${state.slug}/${city.slug}`}
                    className="inline-block w-full text-center bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition text-sm"
                  >
                    View All Services in {city.name}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* All Services List */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">All Services in {state.name}</h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Browse our services by city. Click any combination to learn more and get an instant quote.
            </p>
            <div className="space-y-8">
              {SERVICES.slice(0, 8).map((service) => (
                <div key={service.slug}>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{service.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {state.cities.map((city) => (
                      <Link
                        key={`${service.slug}-${city.slug}`}
                        href={`/${service.slug}-${city.slug}`}
                        className="bg-white px-4 py-2 rounded-full text-sm text-gray-700 border border-gray-200 hover:border-primary-400 hover:text-primary-600 transition shadow-sm"
                      >
                        {city.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Not sure section */}
        <section className="py-12 md:py-16 bg-primary-50">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Not sure if we serve your area in {state.name}?</h2>
            <p className="text-gray-700 mb-6 text-lg">
              Enter your address in our quote tool and we will check coverage instantly. We are actively expanding to new areas in {state.name}.
            </p>
            <Link
              href="/quote"
              className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition shadow-lg"
            >
              Check Coverage &amp; Get a Quote
            </Link>
          </div>
        </section>

        {/* Back to all states */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-5xl text-center">
            <Link
              href="/service-areas"
              className="text-primary-600 hover:text-primary-800 font-medium text-lg"
            >
              &larr; View All States
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
