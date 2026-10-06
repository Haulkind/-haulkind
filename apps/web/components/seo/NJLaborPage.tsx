import Link from 'next/link'
import {
  NJ_LABOR_SERVICES,
  getNJLaborCities,
  njCityH1,
  type NJLaborPageData,
} from '@/lib/nj-labor-pages'
import { NJ_CITY_PAGE_SERVICE } from '@/lib/nj-allowed-paths'

const SITE = 'https://haulkind.com'

const NJ_NOT_OFFERED =
  'HaulKind does not offer hauling, junk removal, cleanouts or any disposal service in New Jersey. Helpers can move items within your home or into your own vehicle, but nothing is hauled away.'

export default function NJLaborPage({ data }: { data: NJLaborPageData }) {
  const { service, city, url } = data
  const h1 = city ? njCityH1(city) : service.h1
  const cities = getNJLaborCities()
  const otherServices = NJ_LABOR_SERVICES.filter((s) => s.slug !== service.slug)

  const areaServed = city
    ? { '@type': 'City', name: city.city.name, containedInPlace: { '@type': 'State', name: 'New Jersey' } }
    : { '@type': 'State', name: 'New Jersey' }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: city ? `${service.name} in ${city.city.name}, NJ` : `${service.name} in New Jersey`,
    serviceType: service.name,
    url: `${SITE}${url}`,
    provider: { '@type': 'Organization', name: 'HaulKind', url: SITE },
    areaServed,
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: service.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Service Areas', item: `${SITE}/service-areas` },
      ...(city
        ? [
            { '@type': 'ListItem', position: 3, name: `${service.name} in New Jersey`, item: `${SITE}/${service.slug}-new-jersey` },
            { '@type': 'ListItem', position: 4, name: h1, item: `${SITE}${url}` },
          ]
        : [{ '@type': 'ListItem', position: 3, name: h1, item: `${SITE}${url}` }]),
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <section className="bg-gradient-to-br from-blue-50 to-white py-14 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/service-areas" className="hover:underline">Service Areas</Link>
            {city && (
              <>
                <span className="mx-2">/</span>
                <Link href={`/${service.slug}-new-jersey`} className="hover:underline">{service.name} in New Jersey</Link>
              </>
            )}
            <span className="mx-2">/</span>
            <span className="text-gray-700">{h1}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{h1}</h1>
          <p className="text-lg text-gray-700 mb-3 max-w-3xl">{service.intro}</p>
          {city && <p className="text-gray-700 mb-3 max-w-3xl">{city.localNote}</p>}
          <p className="text-sm font-semibold text-blue-800 mb-6">{service.priceLine}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={service.quoteHref}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition"
            >
              Get an Upfront Price
            </Link>
            <Link
              href="/how-it-works"
              className="bg-white border border-gray-300 hover:border-gray-400 text-gray-800 font-semibold px-6 py-3 rounded-lg transition"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-5xl grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              What our helpers do{city ? ` in ${city.city.name}` : ' in New Jersey'}
            </h2>
            <ul className="space-y-2">
              {service.tasks.map((t) => (
                <li key={t} className="flex items-start gap-2 text-gray-700">
                  <span className="text-blue-600 mt-1">&#10003;</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-bold text-amber-900 mb-2">Not offered in New Jersey</h2>
            <p className="text-sm text-amber-900">{NJ_NOT_OFFERED}</p>
          </div>
        </div>
      </section>

      {city && (
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Serving {city.city.name} and {city.city.county}</h2>
            <p className="text-gray-700 mb-3">
              Neighborhoods we regularly work in: {city.city.neighborhoods.slice(0, 6).join(', ')}.
            </p>
            <p className="text-gray-700">
              Nearby areas: {city.city.nearbyAreas.slice(0, 6).join(', ')}. Enter your address in the quote tool to confirm coverage.
            </p>
          </div>
        </section>
      )}

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently asked questions</h2>
          <div className="space-y-5">
            {service.faqs.map((f) => (
              <div key={f.q}>
                <h3 className="font-semibold text-gray-900">{f.q}</h3>
                <p className="text-gray-700 mt-1">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Other moving services in New Jersey</h2>
            <ul className="space-y-2">
              {otherServices.map((s) => (
                <li key={s.slug}>
                  <Link href={`/${s.slug}-new-jersey`} className="text-blue-700 hover:underline">
                    {s.name} in New Jersey
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/mattress-swap" className="text-blue-700 hover:underline">Mattress Swap</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Moving help by city</h2>
            <ul className="grid grid-cols-2 gap-2">
              {cities
                .filter((c) => !city || c.slug !== city.slug)
                .map((c) => (
                  <li key={c.slug}>
                    <Link href={`/${NJ_CITY_PAGE_SERVICE}-${c.slug}-nj`} className="text-blue-700 hover:underline">
                      {c.city.name}, NJ
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-14 bg-blue-600 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-3">Ready to book {service.name.toLowerCase()}{city ? ` in ${city.city.name}` : ''}?</h2>
          <p className="mb-6 text-blue-100">Upfront pricing, vetted local pros and live GPS tracking.</p>
          <Link href={service.quoteHref} className="inline-block bg-white text-blue-700 font-bold px-8 py-3 rounded-lg hover:bg-blue-50 transition">
            Get an Upfront Price
          </Link>
        </div>
      </section>
    </>
  )
}
