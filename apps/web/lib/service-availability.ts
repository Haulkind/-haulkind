// Single source of truth for where HaulKind operates and which services may
// be offered in each state. Every component that shows, hides or links to a
// service by location must read from here instead of hard-coding rules.

export type MarketState = 'NJ' | 'PA' | 'DE' | 'NY'

export const MARKET_STATES: readonly MarketState[] = ['NJ', 'PA', 'DE', 'NY']

export const MARKET_STATE_NAMES: Record<MarketState, string> = {
  NJ: 'New Jersey',
  PA: 'Pennsylvania',
  DE: 'Delaware',
  NY: 'New York',
}

export const MARKET_STATE_SLUGS: Record<MarketState, string> = {
  NJ: 'new-jersey',
  PA: 'pennsylvania',
  DE: 'delaware',
  NY: 'new-york',
}

// Delaware hauling stays off until operations confirm which services run
// there. Set NEXT_PUBLIC_ENABLE_DE_HAULING=true at build time to advertise it.
export const DE_HAULING_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DE_HAULING === 'true'

// States where hauling / junk removal / cleanouts / any disposal service may
// be advertised. New Jersey is labor-only (NJDEP).
export const HAULING_STATES: readonly MarketState[] = DE_HAULING_ENABLED ? ['PA', 'DE', 'NY'] : ['PA', 'NY']

function joinNames(items: readonly string[], sep: string, last: string): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(sep)} ${last} ${items[items.length - 1]}`
}

// "PA, DE & NY" / "PA & NY"
export const HAULING_ABBR_LABEL = joinNames(HAULING_STATES, ', ', '&')
// "PA • DE • NY" / "PA • NY"
export const HAULING_BULLET_LABEL = HAULING_STATES.join(' • ')
// "Pennsylvania, Delaware and New York" / "Pennsylvania and New York"
export const HAULING_NAMES_LABEL = joinNames(HAULING_STATES.map(s => MARKET_STATE_NAMES[s]), ', ', 'and')
// JSON-LD areaServed for hauling offers
export const HAULING_AREA_SERVED = HAULING_STATES.map(s => ({ '@type': 'State', name: MARKET_STATE_NAMES[s] }))

export type ServiceCategory = 'labor' | 'assembly' | 'mattress' | 'donation' | 'disposal'

export interface ServiceAvailability {
  key: string
  label: string
  category: ServiceCategory
}

// Any service in the `disposal` category is forbidden in NJ. Everything else
// is available in every market state.
export const SERVICE_CATALOG: readonly ServiceAvailability[] = [
  { key: 'moving-labor', label: 'Moving Labor', category: 'labor' },
  { key: 'loading-unloading', label: 'Loading & Unloading', category: 'labor' },
  { key: 'heavy-lifting', label: 'Heavy Lifting', category: 'labor' },
  { key: 'furniture-moving', label: 'Furniture Moving & Rearranging', category: 'labor' },
  { key: 'hourly-help', label: 'Hourly Help', category: 'labor' },
  { key: 'furniture-assembly', label: 'Furniture Assembly', category: 'assembly' },
  { key: 'mattress-swap', label: 'Mattress Swap', category: 'mattress' },
  { key: 'donation-pickup', label: 'Donation Pickup', category: 'donation' },
  { key: 'hauling', label: 'Hauling', category: 'disposal' },
  { key: 'junk-removal', label: 'Junk Removal', category: 'disposal' },
  { key: 'cleanout', label: 'Cleanouts', category: 'disposal' },
]

export function isMarketState(abbr: string | null | undefined): abbr is MarketState {
  return !!abbr && (MARKET_STATES as readonly string[]).includes(abbr.toUpperCase())
}

export function isHaulingState(abbr: string | null | undefined): boolean {
  return !!abbr && (HAULING_STATES as readonly string[]).includes(abbr.toUpperCase())
}

export function isDisposalCategory(category: ServiceCategory): boolean {
  return category === 'disposal'
}

export function isServiceAvailable(category: ServiceCategory, state: string | null | undefined): boolean {
  if (!isMarketState(state)) return false
  if (isDisposalCategory(category)) return isHaulingState(state)
  return true
}

export function getServicesForState(state: string | null | undefined): ServiceAvailability[] {
  return SERVICE_CATALOG.filter(s => isServiceAvailable(s.category, state))
}

// USPS 3-digit ZIP prefixes by state, parsed as integers (070 -> 70). Inclusive.
const ZIP_PREFIX_RANGES: Array<{ state: MarketState; from: number; to: number }> = [
  { state: 'NJ', from: 70, to: 89 }, // 07000-08999
  { state: 'NY', from: 100, to: 149 },
  { state: 'PA', from: 150, to: 196 },
  { state: 'DE', from: 197, to: 199 },
]

export function getStateFromZip(zip: string | null | undefined): MarketState | null {
  const z = (zip || '').replace(/\D/g, '').slice(0, 5)
  if (z.length !== 5) return null
  const prefix = parseInt(z.slice(0, 3), 10)
  const match = ZIP_PREFIX_RANGES.find(r => prefix >= r.from && prefix <= r.to)
  return match ? match.state : null
}

export function isNJZip(zip: string | null | undefined): boolean {
  return getStateFromZip(zip) === 'NJ'
}

// pSEO service categories come from lib/seo-data.ts ('removal' | 'cleanout' |
// 'moving' | 'pickup'). Anything but 'moving' is a disposal offer. A market
// state whose hauling is still off (Delaware behind the feature flag) must not
// advertise those pages until operations confirm.
export function isDisposalPendingState(seoCategory: string, state: string | null | undefined): boolean {
  return seoCategory !== 'moving' && isMarketState(state) && !isHaulingState(state)
}

// State typed by the customer (2-letter). Unknown/non-market states are left
// to the address/service-area check; market states without hauling are blocked.
export function isDisposalAllowedForState(state: string | null | undefined): boolean {
  const s = (state || '').trim().toUpperCase()
  if (!isMarketState(s)) return true
  return isHaulingState(s)
}

export function isDisposalAllowedForZip(zip: string | null | undefined): boolean {
  const state = getStateFromZip(zip)
  // Unknown ZIP: leave the decision to the address/service-area check.
  if (!state) return true
  return isHaulingState(state)
}

export const NJ_LABOR_NOTICE =
  'In New Jersey, HaulKind offers Moving Labor, Loading & Unloading, Furniture Assembly, Heavy Lifting, Mattress Swap and Donation Pickup. Hauling and junk removal are not offered in New Jersey.'

export const HAULING_ELIGIBILITY_NOTICE =
  `Hauling and junk removal are available in eligible ${HAULING_NAMES_LABEL} service areas only.`

export const MARKET_LABEL = 'NJ • PA • DE • NY'
