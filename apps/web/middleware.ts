import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/auth'
import { AccountType } from '@prisma/client'
import type { MyoFlowSession } from '@/lib/auth'

export function middlewareLogic(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const { auth: session } = req as NextRequest & { auth?: MyoFlowSession | null }

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

  if (!isAdminAccount) {
    const profileScore = session.user.therapist?.profileCompletionScore ?? null
    const hasTherapistContext = Boolean(session.user.therapistId)
    const needsOnboarding = hasTherapistContext && (profileScore === null || profileScore < 70)
    const isOnboardingRoute = pathname.startsWith('/onboarding')

    if (needsOnboarding && !isOnboardingRoute) {
      const redirectUrl = new URL('/onboarding', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
}

export default authMiddleware(middlewareLogic)

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/onboarding/:path*'],
}
