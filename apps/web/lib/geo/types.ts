// Geographic data types for nationwide pSEO

export interface GeoCity {
  name: string
  slug: string           // e.g. "philadelphia-pa"
  state: string          // Full state name
  stateAbbr: string      // e.g. "PA"
  stateSlug: string      // e.g. "pa" or "new-york"
  county: string
  population: number
  lat: number
  lng: number
  neighborhoods: string[]
  zipCodes: string[]
  nearbyAreas: string[]
}

export interface GeoState {
  name: string
  abbr: string
  slug: string           // e.g. "new-jersey"
  cities: GeoCity[]
}

export interface ServiceData {
  name: string
  slug: string
  shortName: string
  description: string
  category: 'removal' | 'cleanout' | 'moving' | 'pickup'
  items: string[]
  benefits: string[]
  priceRange: string
  priceNote: string
}
