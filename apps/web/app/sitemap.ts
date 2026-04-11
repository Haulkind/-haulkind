import type { MetadataRoute } from 'next'
import { SERVICES } from '@/lib/seo-data'
import { STATES, getAllCities } from '@/lib/geo'
import { getAllPosts } from '@/lib/blog'
import { getStatesWithCounts } from '@/lib/seo-data-national'

// Sitemap index: chunk pSEO URLs into multiple child sitemaps to stay under the 50k URL limit.
// Chunk 0 = core + blog pages
// Chunk 1..N = pSEO pages grouped by service (one chunk per service)
// This ensures each child sitemap stays well under 50k URLs.

/** Next.js App Router: generates the sitemap index entries */
export async function generateSitemaps() {
  // Chunk 0 = core + blog + service-areas hierarchy
  // Chunk 1..11 = one chunk per service (each service × all cities)
  const ids = [{ id: 0 }]
  SERVICES.forEach((_, i) => ids.push({ id: i + 1 }))
  return ids
}

export default function sitemap({ id }: { id: number }): MetadataRoute.Sitemap {
  const baseUrl = 'https://haulkind.com'
  const now = new Date()

  // Chunk 0: Core pages + blog + service-areas hierarchy
  if (id === 0) {
    const corePages: MetadataRoute.Sitemap = [
      { url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
      { url: `${baseUrl}/services/cleanout`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
      { url: `${baseUrl}/services/furniture`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
      { url: `${baseUrl}/services/appliances`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
      { url: `${baseUrl}/services/moving-labor`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
      { url: `${baseUrl}/services/commercial`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
      { url: `${baseUrl}/services/electronics`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
      { url: `${baseUrl}/services/what-we-take`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
      { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
      { url: `${baseUrl}/how-it-works`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
      { url: `${baseUrl}/service-areas`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
      { url: `${baseUrl}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
      { url: `${baseUrl}/become-a-driver`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${baseUrl}/mattress-swap`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
      { url: `${baseUrl}/quote/mattress-swap`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
      { url: `${baseUrl}/quote/assembly`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
      { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
      { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    ]

    // Hierarchical service-areas pages: /service-areas/[state] and /service-areas/[state]/[city]
    const statesWithCounts = getStatesWithCounts()
    const serviceAreaPages: MetadataRoute.Sitemap = []
    for (const state of statesWithCounts) {
      serviceAreaPages.push({
        url: `${baseUrl}/service-areas/${state.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
      for (const city of state.cities) {
        serviceAreaPages.push({
          url: `${baseUrl}/service-areas/${state.slug}/${city.slug}`,
          lastModified: now,
          changeFrequency: 'monthly',
          priority: 0.7,
        })
      }
    }

    // Blog pages
    const blogPosts = getAllPosts()
    const blogPages: MetadataRoute.Sitemap = [
      { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
      ...blogPosts.map(post => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updated || post.date),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
    ]

    return [...corePages, ...serviceAreaPages, ...blogPages]
  }

  // Chunks 1..N: pSEO pages for one service × all cities
  const serviceIndex = id - 1
  const service = SERVICES[serviceIndex]
  if (!service) return []

  const cities = getAllCities()
  return cities.map(city => ({
    url: `${baseUrl}/${service.slug}-${city.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))
}
