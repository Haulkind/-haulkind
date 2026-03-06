import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/driver/', '/quote/tracking'],
      },
    ],
    sitemap: 'https://haulkind.com/sitemap.xml',
    host: 'https://haulkind.com',
  }
}
