import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/driver/',
          '/quote/tracking',
          // NJDEP compliance: legacy New Jersey service paths are permanently
          // gone (HTTP 410). Block crawlers from re-indexing them.
          '/service-areas/new-jersey',
          '/service-areas/new-jersey/',
          '/junk-removal-*-nj',
          '/furniture-removal-*-nj',
          '/mattress-removal-*-nj',
          '/appliance-removal-*-nj',
          '/electronics-removal-*-nj',
          '/garage-cleanout-*-nj',
          '/basement-cleanout-*-nj',
          '/curbside-pickup-*-nj',
          '/donation-pickup-*-nj',
          '/moving-help-*-nj',
          '/labor-only-moving-help-*-nj',
          '/ads/hauling-south-jersey',
          '/ads/hauling-trenton',
          '/ads/hauling-princeton',
          '/ads/hauling-jersey-city',
          '/ads/hauling-newark',
          '/ads/hauling-hoboken',
          '/ads/*-nj',
        ],
      },
    ],
    sitemap: 'https://haulkind.com/sitemap.xml',
    host: 'https://haulkind.com',
  }
}
