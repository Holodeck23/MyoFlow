import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const nonce = crypto.randomUUID(); // ok in edge runtime
  
  const isDev = process.env.NODE_ENV !== "production";
  const styleSrc = isDev ? "'self' 'unsafe-inline'" : `'self' 'nonce-${nonce}'`;

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src ${styleSrc};
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `
  
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set(
    'Content-Security-Policy',
    cspHeader.replace(/\s{2,}/g, ' ').trim()
  )

  // HSTS, Referrer-Policy, etc.
  requestHeaders.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  requestHeaders.set('X-Content-Type-Options', 'nosniff')
  requestHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  requestHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Authentication protection for dashboard routes
  const { pathname } = req.nextUrl;
  const protectedPaths = [
    '/dashboard',
    '/clients',
    '/appointments',
    '/services',
    '/invoices',
    '/vouchers',
    '/products',
    '/settings',
    '/api/files'
  ];

  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtectedPath) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (!token) {
          const url = new URL('/sign-in', req.url);
          url.searchParams.set('callbackUrl', req.url);
          return NextResponse.redirect(url);
      }
  }

  return NextResponse.next({
    headers: requestHeaders,
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

