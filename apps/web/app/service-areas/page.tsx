import type { Metadata } from 'next'
import Link from 'next/link'
import { SERVICES } from '@/lib/seo-data'
import { getStatesWithCounts } from '@/lib/seo-data-national'
import { HAULING_ELIGIBILITY_NOTICE, MARKET_STATE_SLUGS, isHaulingState } from '@/lib/service-availability'

export const metadata: Metadata = {
  title: 'Service Areas - Moving Help in NJ, Hauling in PA, DE & NY',
  description: 'HaulKind serves New Jersey, Pennsylvania, Delaware and New York. Moving labor and furniture assembly in NJ; hauling and junk removal in eligible PA, DE & NY areas. Get a free quote.',
  alternates: { canonical: '/service-areas' },
  openGraph: {
    title: 'HaulKind Service Areas - NJ, PA, DE & NY',
    description: 'Moving help in New Jersey. Hauling and junk removal in eligible Pennsylvania, Delaware and New York service areas. Book online in 60 seconds.',
    url: 'https://haulkind.com/service-areas',
  },
}

const MARKET_SLUGS = new Set<string>(Object.values(MARKET_STATE_SLUGS))

const featuredServices = SERVICES.filter((s) =>
  ['junk-removal', 'furniture-removal', 'mattress-removal', 'appliance-removal', 'garage-cleanout', 'moving-help'].includes(s.slug)
)

export default function ServiceAreas() {
  const statesWithCounts = getStatesWithCounts()
  const marketStates = statesWithCounts.filter((s) => MARKET_SLUGS.has(s.slug))
  const otherStates = statesWithCounts.filter((s) => !MARKET_SLUGS.has(s.slug))

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
              Moving Help &amp; Hauling Service Areas
            </h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
              HaulKind serves New Jersey, Pennsylvania, Delaware and New York. Moving labor, loading &amp; unloading, furniture assembly and heavy lifting in New Jersey. Hauling and junk removal in eligible Pennsylvania, Delaware and New York service areas.
            </p>
            <Link
              href="/quote"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition shadow-lg"
            >
              Get Instant Quote
            </Link>
          </div>
        </section>

        {/* Core market states */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Where HaulKind Operates</h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Click a state to see cities and the services available there.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-5">
                <p className="text-xs font-bold tracking-widest text-blue-700 mb-1">NEW JERSEY</p>
                <h3 className="text-lg font-bold text-gray-900">Moving Help &amp; Labor</h3>
                <p className="text-sm text-gray-600 mt-1">Moving Labor &bull; Loading &amp; Unloading &bull; Furniture Assembly &bull; Heavy Lifting &bull; Mattress Swaps</p>
                <div className="flex flex-wrap gap-2 mt-3 text-xs">
                  <Link href="/services/moving-labor" className="text-blue-700 font-semibold hover:underline">Moving Labor</Link>
                  <Link href="/assembly" className="text-blue-700 font-semibold hover:underline">Assembly</Link>
                  <Link href="/mattress-swap" className="text-blue-700 font-semibold hover:underline">Mattress Swap</Link>
                </div>
              </div>
              {marketStates.map((state) => (
                <Link
                  key={state.slug}
                  href={`/service-areas/${state.slug}`}
                  className="bg-teal-50 rounded-xl border-2 border-teal-200 p-5 hover:shadow-lg hover:border-teal-400 transition group"
                >
                  <p className="text-xs font-bold tracking-widest text-teal-700 mb-1">{state.abbr}</p>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-700">{state.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Moving Help &bull; Furniture Assembly &bull; Loading &amp; Unloading{isHaulingState(state.abbr) ? ' \u2022 Hauling \u2022 Junk Removal (eligible areas)' : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">{state.cities.length} {state.cities.length === 1 ? 'city' : 'cities'}</p>
                </Link>
              ))}
            </div>
            <p className="text-sm text-gray-500 text-center max-w-2xl mx-auto">{HAULING_ELIGIBILITY_NOTICE}</p>
          </div>
        </section>

        {/* Other states (legacy city pages) */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Other Locations</h2>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              Outside NJ, PA, DE and NY, availability is limited. Enter your address in the quote tool to check coverage before booking.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {otherStates.map((state) => (
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
