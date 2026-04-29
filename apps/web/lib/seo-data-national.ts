// National SEO data layer - bridges geo database with page generation
// Replaces the old hardcoded seo-data.ts for nationwide pSEO
import type { GeoCity } from './geo'
import { STATES, getAllCities, getCityBySlug } from './geo'
import { SERVICES } from './seo-data'
import type { ServiceData } from './seo-data'

// ----- City description generator (unique per city to avoid thin content) -----

function formatPopulation(pop: number): string {
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)} million`
  if (pop >= 100_000) return `${Math.round(pop / 1000)}K`
  return pop.toLocaleString()
}

/** Generate a unique city description based on real data to avoid duplicate content */
export function generateCityDescription(city: GeoCity): string {
  const pop = formatPopulation(city.population)
  const neighborhoodList = city.neighborhoods.slice(0, 4).join(', ')

  // NJ compliance: No "Junk Removal" or "Solid Waste Disposal" wording for New Jersey cities
  const isNJ = city.stateAbbr === 'NJ'
  const serviceLabel = isNJ ? 'furniture donation pickup, moving labor, and furniture assembly' : 'junk removal and hauling services'
  const serviceLabel2 = isNJ ? 'furniture donation pickup, moving labor, and furniture assembly' : 'same-day junk removal, furniture pickup, and moving help'

  const templates = [
    `With a population of ${pop}, ${city.name} is a vibrant community in ${city.county}, ${city.state}. From ${neighborhoodList} and beyond, residents and businesses need reliable ${serviceLabel} they can trust. HaulKind provides fast, affordable pickup and moving help throughout ${city.name} and surrounding ${city.stateAbbr} areas.`,
    `${city.name}, ${city.stateAbbr} is home to ${pop} residents across diverse neighborhoods including ${neighborhoodList}. Whether you are moving, decluttering, or renovating, HaulKind delivers professional ${isNJ ? 'moving labor, furniture assembly, and donation pickup' : 'hauling, cleanout, and moving labor'} services with transparent pricing and live GPS tracking.`,
    `Located in ${city.county}, ${city.name} is one of ${city.state}'s thriving communities with ${pop} residents. From ${city.neighborhoods[0]} to ${city.neighborhoods[Math.min(city.neighborhoods.length - 1, 5)]}, HaulKind provides ${serviceLabel2} across the entire ${city.name} area.`,
  ]

  // Use city slug hash to pick a template deterministically
  const hash = city.slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return templates[hash % templates.length]!
}

// ----- Slug utilities for nationwide scale -----

// NJDEP compliance: NO service+city pages may be generated for ANY NJ city.
// Inspector Chris Farrar (NJDEP) requires complete removal of all junk-removal
// content tied to New Jersey. NJ paths return HTTP 410 Gone via middleware,
// and these helpers refuse to resolve any NJ slug as a defense-in-depth check.

/** Get all valid service+city slug combinations (NJ cities excluded entirely) */
export function getAllSlugsNational(): string[] {
  const cities = getAllCities()
  const slugs: string[] = []
  for (const service of SERVICES) {
    for (const city of cities) {
      if (city.stateAbbr === 'NJ') continue
      slugs.push(`${service.slug}-${city.slug}`)
    }
  }
  return slugs
}

/** Parse a slug back to service + city (works with nationwide data; NJ refused) */
export function parseSlugNational(slug: string): { service: ServiceData; city: GeoCity } | null {
  for (const service of SERVICES) {
    if (slug.startsWith(service.slug + '-')) {
      const citySlug = slug.slice(service.slug.length + 1)
      const city = getCityBySlug(citySlug)
      if (!city) continue
      if (city.stateAbbr === 'NJ') return null
      return { service, city }
    }
  }
  return null
}

/** Generate unique page content for a service+city combination */
export function generatePageContentNational(service: ServiceData, city: GeoCity) {
  const slug = `${service.slug}-${city.slug}`
  const url = `/${slug}`
  const title = `${service.name} in ${city.name}, ${city.stateAbbr} | HaulKind`
  const metaDescription = `Professional ${service.shortName} in ${city.name}, ${city.stateAbbr}. ${service.priceRange}. Same-day service, transparent pricing, live driver tracking. Book online in 60 seconds.`
  const h1 = `${service.name} in ${city.name}, ${city.stateAbbr}`

  return { slug, url, title, metaDescription, h1 }
}

/** Generate unique FAQ content per service+city to avoid duplicate content */
export function generateFAQsNational(service: ServiceData, city: GeoCity): { question: string; answer: string }[] {
  const pop = formatPopulation(city.population)
  const faqs = [
    {
      question: `How much does ${service.shortName} cost in ${city.name}, ${city.stateAbbr}?`,
      answer: `${service.name} in ${city.name} starts at ${service.priceRange}. ${service.priceNote} Get an instant quote on our website with your specific details for an exact price.`,
    },
    {
      question: `Can I get same-day ${service.shortName} in ${city.name}?`,
      answer: `Yes, HaulKind offers same-day ${service.shortName} in ${city.name} and surrounding ${city.stateAbbr} areas when crews are available. Book early in the day for the best availability. We also offer flexible scheduling for future dates.`,
    },
    {
      question: `What areas in ${city.name} does HaulKind serve?`,
      answer: `We serve all of ${city.name} including ${city.neighborhoods.slice(0, 5).join(', ')}, and surrounding areas like ${city.nearbyAreas.slice(0, 3).join(', ')}. Enter your address in our quote tool to confirm coverage.`,
    },
    {
      question: `Do I need to be home for ${service.shortName}?`,
      answer: service.category === 'pickup'
        ? `For curbside pickup, you typically do not need to be home as long as items are accessible. For indoor pickup in ${city.name}, someone should be present to show our team what needs to go.`
        : `For ${service.shortName} in ${city.name}, we recommend being present so you can point out exactly what needs to go. However, you can also leave detailed instructions and grant access if you cannot be there.`,
    },
    {
      question: `How do I book ${service.shortName} in ${city.name}, ${city.stateAbbr}?`,
      answer: `Booking is easy. Visit our website, enter your ${city.name} address, select your service type, and get an instant quote. You can schedule online in under 60 seconds. We accept all major credit cards and payment is collected after the job is confirmed.`,
    },
  ]

  // Add city-specific FAQ using population data for uniqueness
  faqs.push({
    question: `Does HaulKind serve all neighborhoods in ${city.name}?`,
    answer: `Yes! HaulKind serves all of ${city.name}'s ${pop} residents. We cover every neighborhood from ${city.neighborhoods[0]} to ${city.neighborhoods[city.neighborhoods.length - 1]}, plus nearby communities like ${city.nearbyAreas.join(', ')}. Enter your ZIP code (${city.zipCodes[0]} and more) in our quote tool to confirm.`,
  })

  // Add service-specific FAQ (only for non-NJ or non-waste services)
  if (service.category === 'removal' && city.stateAbbr !== 'NJ') {
    faqs.push({
      question: `What happens to my items after ${service.shortName} in ${city.name}?`,
      answer: `After picking up your items in ${city.name}, our team sorts materials for recycling, donation, and responsible handling. We partner with local recycling facilities and donation centers in ${city.county}. Usable items are donated whenever possible.`,
    })
  }

  if (service.category === 'cleanout' && city.stateAbbr !== 'NJ') {
    faqs.push({
      question: `How long does a ${service.shortName} take in ${city.name}?`,
      answer: `Most ${service.shortName} jobs in ${city.name} take between 1-4 hours depending on the amount of material. A standard single-car garage or small basement can usually be cleared in about 2 hours. Larger spaces or heavily packed areas may take longer.`,
    })
  }

  if (service.category === 'moving') {
    faqs.push({
      question: `How many helpers do I need for my move in ${city.name}?`,
      answer: `For a typical apartment move in ${city.name}, 2 helpers is standard. For larger homes or moves involving heavy items like pianos or safes, we recommend 3-4 helpers. You can choose the number when booking, and we will advise if we think you need more.`,
    })
  }

  if (service.category === 'pickup') {
    faqs.push({
      question: `What items can you pick up curbside in ${city.name}?`,
      answer: `We pick up bulky furniture, mattresses, appliances, yard waste, construction debris, and more from the curb in ${city.name}. If the city won't take it, we will. Items must be accessible from the curb or driveway.`,
    })
  }

  return faqs
}

/** Get all states with city counts for the service areas page */
export function getStatesWithCounts(): { name: string; abbr: string; slug: string; cityCount: number; cities: GeoCity[] }[] {
  // NJDEP compliance: New Jersey is excluded from the public service-areas
  // index — /service-areas/new-jersey returns HTTP 410 Gone via middleware,
  // so a clickable "New Jersey" tile here would be a broken link.
  return STATES
    .filter(state => state.slug !== 'new-jersey')
    .map(state => ({
      name: state.name,
      abbr: state.abbr,
      slug: state.slug,
      cityCount: state.cities.length,
      cities: state.cities,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Get nearby cities for cross-linking (same state, different city) */
export function getNearbyCities(city: GeoCity, limit = 5): GeoCity[] {
  const stateCities = getAllCities().filter(c => c.stateAbbr === city.stateAbbr && c.slug !== city.slug)
  
  // Sort by distance using simple lat/lng
  return stateCities
    .map(c => ({
      city: c,
      dist: Math.sqrt(Math.pow(c.lat - city.lat, 2) + Math.pow(c.lng - city.lng, 2)),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map(c => c.city)
}
