import type { Metadata } from 'next'
import Link from 'next/link'
import { SERVICES } from '@/lib/seo-data'
import { getStatesWithCounts } from '@/lib/seo-data-national'

export const metadata: Metadata = {
  title: 'Service Areas - Nationwide Junk Removal & Moving Help | HaulKind',
  description: 'HaulKind serves cities across all 50 states. Professional junk removal, furniture removal, cleanouts, and moving help. Get a free quote.',
  alternates: { canonical: '/service-areas' },
  openGraph: {
    title: 'HaulKind Service Areas - Nationwide Coverage',
    description: 'Professional junk removal and moving help across all 50 states. Book online in 60 seconds.',
    url: 'https://haulkind.com/service-areas',
  },
}

const featuredServices = SERVICES.filter((s) =>
  ['junk-removal', 'furniture-removal', 'mattress-removal', 'appliance-removal', 'garage-cleanout', 'moving-help'].includes(s.slug)
)

export default function ServiceAreas() {
  const statesWithCounts = getStatesWithCounts()

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulkind.com' },
      { '@type': 'ListItem', position: 2, name: 'Service Areas', item: 'https://haulkind.com/service-areas' },
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
            <li><span className="text-gray-900 font-medium">Service Areas</span></li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16 md:py-20">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Junk Removal &amp; Moving Help Service Areas
            </h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
              HaulKind provides professional junk removal, furniture removal, cleanout services, and moving labor nationwide. Find your state and city below and book online in 60 seconds.
            </p>
            <Link
              href="/quote"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition shadow-lg"
            >
              Get Instant Quote
            </Link>
          </div>
        </section>

        {/* All States Grid */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">All {statesWithCounts.length} States</h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Click a state to see all cities and services available in that area.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {statesWithCounts.map((state) => (
                <Link
                  key={state.slug}
                  href={`/service-areas/${state.slug}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-primary-200 transition group"
                >
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600">{state.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{state.cities.length} {state.cities.length === 1 ? 'city' : 'cities'}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Not sure section */}
        <section className="py-12 md:py-16 bg-primary-50">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Not sure if we serve your area?</h2>
            <p className="text-gray-700 mb-6 text-lg">
              Enter your address in our quote tool and we will check coverage instantly. We are actively expanding to new areas.
            </p>
            <Link
              href="/quote"
              className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition shadow-lg"
            >
              Check Coverage &amp; Get a Quote
            </Link>
          </div>
        </section>

        {/* Quick links */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl font-bold mb-6">Explore HaulKind</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/pricing" className="bg-gray-50 p-4 rounded-lg hover:bg-primary-50 transition text-center">
                <h3 className="font-bold text-gray-900">Pricing</h3>
                <p className="text-sm text-gray-600">Transparent rates</p>
              </Link>
              <Link href="/how-it-works" className="bg-gray-50 p-4 rounded-lg hover:bg-primary-50 transition text-center">
                <h3 className="font-bold text-gray-900">How It Works</h3>
                <p className="text-sm text-gray-600">3 simple steps</p>
              </Link>
              <Link href="/faq" className="bg-gray-50 p-4 rounded-lg hover:bg-primary-50 transition text-center">
                <h3 className="font-bold text-gray-900">FAQ</h3>
                <p className="text-sm text-gray-600">Common questions</p>
              </Link>
              <Link href="/become-a-driver" className="bg-gray-50 p-4 rounded-lg hover:bg-primary-50 transition text-center">
                <h3 className="font-bold text-gray-900">Become a Driver</h3>
                <p className="text-sm text-gray-600">Join our team</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Driver CTA */}
        <section className="py-16 md:py-20 bg-secondary-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Are you a driver in these areas?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join HaulKind and earn competitive pay on your own schedule. We are looking for drivers in all our service areas.
            </p>
            <Link
              href="/become-a-driver"
              className="inline-block bg-white text-secondary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              Become a Driver
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
