import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
