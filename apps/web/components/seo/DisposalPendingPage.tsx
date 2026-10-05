import Link from 'next/link'
import type { ServiceData } from '@/lib/seo-data'
import type { GeoCity } from '@/lib/geo/types'

export default function DisposalPendingPage({ service, city }: { service: ServiceData; city: GeoCity }) {
  return (
    <div className="bg-white">
      <nav className="container mx-auto px-4 py-3 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link href="/" className="hover:text-primary-600">Home</Link></li>
          <li>/</li>
          <li><Link href="/service-areas" className="hover:text-primary-600">Service Areas</Link></li>
          <li>/</li>
          <li><Link href={`/service-areas/${city.stateSlug}`} className="hover:text-primary-600">{city.state}</Link></li>
        </ol>
      </nav>
      <section className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {service.name} in {city.name}, {city.stateAbbr}
        </h1>
        <p className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 font-medium">
          {service.name} is not yet available in {city.state}. In {city.name}, HaulKind currently offers moving help and furniture assembly.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href={`/moving-help-${city.slug}`} className="block rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:bg-primary-50 transition">
            <h2 className="font-bold text-primary-600 mb-1">Moving Help in {city.name}</h2>
            <p className="text-sm text-gray-600">Loading, unloading, heavy lifting and in-home furniture moving.</p>
          </Link>
          <Link href="/quote/assembly" className="block rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:bg-primary-50 transition">
            <h2 className="font-bold text-primary-600 mb-1">Furniture Assembly</h2>
            <p className="text-sm text-gray-600">Beds, desks, wardrobes and flat-pack furniture built at your home.</p>
          </Link>
        </div>
        <p className="mt-8 text-sm text-gray-600">
          See everything available in {city.state} on the{' '}
          <Link href={`/service-areas/${city.stateSlug}`} className="text-primary-600 underline">{city.state} service area page</Link>.
        </p>
      </section>
    </div>
  )
}
