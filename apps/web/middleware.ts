import { NextRequest, NextResponse } from 'next/server'
import auth from '@/lib/auth'
import { AccountType } from '@prisma/client'

export function middlewareLogic(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const session = req.auth

  if (!session?.user) {
    return NextResponse.next()
  }

  const accountType = session.user.accountType
  const isAdminAccount = accountType === AccountType.ADMIN
  const isAdminRoute = pathname.startsWith('/admin')

  if (isAdminAccount && !isAdminRoute) {
    const redirectUrl = new URL('/admin', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  if (!isAdminAccount && isAdminRoute) {
    const redirectUrl = new URL('/dashboard', req.url)
    redirectUrl.searchParams.set('error', 'unauthorized')
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export default auth(middlewareLogic)

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
