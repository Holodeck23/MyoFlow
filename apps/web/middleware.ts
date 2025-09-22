import auth from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const response = NextResponse.next()

  if (!req.auth && req.nextUrl.pathname.startsWith('/dashboard')) {
    const newUrl = new URL('/auth/sign-in', req.nextUrl.origin)
    return NextResponse.redirect(newUrl)
  }

  return response
})

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/dashboard/:path*', '/auth/sign-in'],
}