import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/services/', '/contact'],
        disallow: ['/api/', '/driver/'],
      },
    ],
    sitemap: 'https://haulkind.com/sitemap.xml',
  }
}
