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

// States where hauling / junk removal / cleanouts / any disposal service may
// be advertised. New Jersey is labor-only (NJDEP).
export const HAULING_STATES: readonly MarketState[] = ['PA', 'DE', 'NY']

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
  { state: 'NY', from: 5, to: 5 }, // 005xx Holtsville
  { state: 'NY', from: 63, to: 63 }, // 063xx Fishers Island
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

export function isDisposalAllowedForZip(zip: string | null | undefined): boolean {
  const state = getStateFromZip(zip)
  // Unknown ZIP: leave the decision to the address/service-area check.
  if (!state) return true
  return isHaulingState(state)
}

export const NJ_LABOR_NOTICE =
  'In New Jersey, HaulKind offers Moving Labor, Loading & Unloading, Furniture Assembly, Heavy Lifting, Mattress Swap and Donation Pickup. Hauling and junk removal are not offered in New Jersey.'

export const HAULING_ELIGIBILITY_NOTICE =
  'Hauling and junk removal are available in eligible Pennsylvania, Delaware and New York service areas only.'

export const MARKET_LABEL = 'NJ • PA • DE • NY'
