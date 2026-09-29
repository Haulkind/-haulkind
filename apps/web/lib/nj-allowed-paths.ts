// New Jersey URLs that are allowed to serve content. Everything else under a
// NJ city slug stays 410 Gone (NJDEP). Kept dependency-free so the Edge
// middleware can import it.

export const NJ_LABOR_SERVICE_SLUGS = [
  'moving-labor',
  'moving-help',
  'furniture-assembly',
  'loading-unloading',
  'heavy-lifting',
] as const

export type NJLaborServiceSlug = (typeof NJ_LABOR_SERVICE_SLUGS)[number]

// City slugs (without the -nj suffix) that have a live labor page.
export const NJ_LABOR_CITY_SLUGS = [
  'jersey-city',
  'newark',
  'elizabeth',
  'trenton',
  'princeton',
  'camden',
  'cherry-hill',
  'mount-laurel',
] as const

// Only Moving Help gets a per-city page for now; the other labor services
// link to the city page to avoid thin duplicates.
export const NJ_CITY_PAGE_SERVICE: NJLaborServiceSlug = 'moving-help'

export const NJ_ALLOWED_PATH_PATTERNS: RegExp[] = [
  new RegExp(`^/(${NJ_LABOR_SERVICE_SLUGS.join('|')})-new-jersey/?$`, 'i'),
  new RegExp(`^/${NJ_CITY_PAGE_SERVICE}-(${NJ_LABOR_CITY_SLUGS.join('|')})-nj/?$`, 'i'),
]

export function isAllowedNJPath(pathname: string): boolean {
  return NJ_ALLOWED_PATH_PATTERNS.some((p) => p.test(pathname))
}
