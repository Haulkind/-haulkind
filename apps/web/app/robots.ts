import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/driver/', '/quote/'],
      },
    ],
    sitemap: 'https://haulkind.com/sitemap.xml',
  }
}
