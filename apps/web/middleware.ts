import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// NJDEP compliance: any URL that ties HaulKind services to a New Jersey city
// must return HTTP 410 Gone — NOT a redirect, NOT a 404. 410 tells crawlers
// (and the NJDEP inspector) that the resource is permanently removed.
//
// Patterns covered:
//   /service-areas/new-jersey
//   /service-areas/new-jersey/<anything>
//   /<service>-<njcity>-nj         (e.g. /curbside-pickup-newark-nj)
//   /<service>-jersey-city-nj      (jersey-city contains a hyphen)
//   /ads/<anything>-nj
//   /ads/<anything>-jersey         (south-jersey, north-jersey, central-jersey)
//   /ads/hauling-trenton, /ads/hauling-princeton (legacy NJ ads)
const NJ_PATH_PATTERNS: RegExp[] = [
  /^\/service-areas\/new-jersey(\/.*)?$/i,
  /^\/[a-z0-9-]+-nj\/?$/i,
  /^\/ads\/[a-z0-9-]+-nj\/?$/i,
  /^\/ads\/[a-z0-9-]*-jersey\/?$/i,
  /^\/ads\/hauling-(south-jersey|trenton|princeton)\/?$/i,
]

function gone(): NextResponse {
  // 410 Gone: permanently removed. Stronger signal than 404.
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>410 Gone</title>` +
    `<meta name="robots" content="noindex,nofollow"></head><body>` +
    `<h1>410 Gone</h1><p>This page has been permanently removed.</p>` +
    `</body></html>`,
    {
      status: 410,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    }
  )
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // Redirect www.haulkind.com → haulkind.com (301 permanent)
  if (host.startsWith('www.')) {
    const newHost = host.replace(/^www\./, '')
    url.host = newHost
    url.port = ''
    return NextResponse.redirect(
      new URL(`https://${newHost}${url.pathname}${url.search}`),
      301
    )
  }

  const pathname = url.pathname
  for (const pattern of NJ_PATH_PATTERNS) {
    if (pattern.test(pathname)) {
      return gone()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
