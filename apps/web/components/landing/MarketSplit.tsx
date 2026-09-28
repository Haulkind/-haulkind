import Link from 'next/link'
import { HAULING_ELIGIBILITY_NOTICE } from '@/lib/service-availability'

const NJ_LINKS = [
  { label: 'Moving Labor', href: '/services/moving-labor' },
  { label: 'Loading & Unloading', href: '/services/moving-labor#loading-unloading' },
  { label: 'Furniture Assembly', href: '/assembly' },
  { label: 'Heavy Lifting', href: '/services/moving-labor#heavy-lifting' },
  { label: 'Mattress Swaps', href: '/mattress-swap' },
  { label: 'Hourly Help', href: '/quote/labor-only/hours' },
]

const HAULING_STATES = [
  {
    abbr: 'PA',
    name: 'Pennsylvania',
    hub: '/service-areas/pennsylvania',
    junk: '/junk-removal-philadelphia-pa',
    junkLabel: 'Junk Removal Philadelphia',
  },
  {
    abbr: 'DE',
    name: 'Delaware',
    hub: '/service-areas/delaware',
    junk: '/junk-removal-wilmington-de',
    junkLabel: 'Junk Removal Wilmington',
  },
  {
    abbr: 'NY',
    name: 'New York',
    hub: '/service-areas/new-york',
    junk: '/junk-removal-new-york-city-ny',
    junkLabel: 'Junk Removal New York City',
  },
]

export default function MarketSplit() {
  return (
    <section className="py-14 md:py-20 bg-white" aria-labelledby="market-split-heading">
      <div className="container mx-auto px-4">
        <h2 id="market-split-heading" className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-3">
          Where We Work &amp; What We Offer
        </h2>
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-10">
          HaulKind serves New Jersey, Pennsylvania, Delaware and New York. Services vary by state.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 md:p-8">
            <p className="text-xs font-bold tracking-widest text-blue-700 mb-2">NEW JERSEY</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Moving Help &amp; Labor</h3>
            <p className="text-gray-700 mb-5">
              Moving Labor &bull; Loading &amp; Unloading &bull; Furniture Assembly &bull; Heavy Lifting &bull; Mattress Swaps &bull; Hourly Help
            </p>
            <ul className="flex flex-wrap gap-2">
              {NJ_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-block bg-white border border-blue-200 text-blue-800 text-sm font-semibold px-3 py-1.5 rounded-full hover:bg-blue-100 transition"
                  >
                    {l.label} in NJ
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border-2 border-teal-200 bg-teal-50 p-6 md:p-8">
            <p className="text-xs font-bold tracking-widest text-teal-700 mb-2">PA &bull; DE &bull; NY</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Moving Help &amp; Hauling</h3>
            <p className="text-gray-700 mb-5">
              Moving Help &bull; Furniture Assembly &bull; Loading &amp; Unloading &bull; Hauling &bull; Junk Removal in eligible service areas
            </p>
            <ul className="space-y-2">
              {HAULING_STATES.map((s) => (
                <li key={s.abbr} className="flex flex-wrap items-center gap-2 text-sm">
                  <Link href={s.hub} className="font-bold text-teal-800 hover:underline">
                    {s.name}
                  </Link>
                  <span className="text-gray-400">&middot;</span>
                  <Link href="/services/moving-labor" className="text-teal-700 hover:underline">
                    Moving Help
                  </Link>
                  <span className="text-gray-400">&middot;</span>
                  <Link href={s.junk} className="text-teal-700 hover:underline">
                    {s.junkLabel}
                  </Link>
                  <span className="text-gray-400">&middot;</span>
                  <Link href={s.hub} className="text-teal-700 hover:underline">
                    Hauling {s.abbr}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-5">{HAULING_ELIGIBILITY_NOTICE}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
