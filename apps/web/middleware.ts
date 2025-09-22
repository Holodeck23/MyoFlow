import { NextRequest, NextResponse } from 'next/server'
import auth from '@/lib/auth'

export default auth(async function middleware(req: NextRequest) {
  // Add your middleware logic here
  // For example, redirect if not authenticated
  // if (!req.auth) {
  //   return NextResponse.redirect(new URL('/auth/sign-in', req.url))
  // }
  return NextResponse.next()
})

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/dashboard/:path*', '/auth/sign-in'],
}