import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  // CSP with nonce for scripts
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self';`
  )
  
  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const token = await getToken({ req: request })
    if (!token) {
      return NextResponse.redirect(new URL('/auth/sign-in', request.url))
    }
  }
  
  // Handle mini-site subdomain routing (future feature)
  // TODO-CLAUDE: Implement subdomain routing when feature flag is enabled
  const host = request.headers.get('host')
  if (host && !host.includes('localhost') && host.includes('.')) {
    const subdomain = host.split('.')[0]
    if (subdomain && subdomain !== 'www') {
      // Redirect to /s/[slug] path-based routing for now
      return NextResponse.redirect(new URL(`/s/${subdomain}`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}