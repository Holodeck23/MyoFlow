import { auth } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Structured authentication error for proper HTTP status code handling
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Shared helper to require an authenticated therapist without side effects.
 * Throws AuthError if the therapist doesn't exist instead of creating one.
 * Use this for GET/read-only operations.
 *
 * @throws {AuthError} 401 if not authenticated, 404 if user/therapist not found
 */
export async function requireTherapist() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new AuthError('Unauthorized - No active session', 401, 'NO_SESSION')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    throw new AuthError('User account not found. Please complete setup first.', 404, 'USER_NOT_FOUND')
  }

  const therapist = await prisma.therapist.findFirst({
    where: { userId: user.id }
  })

  if (!therapist) {
    throw new AuthError('Therapist profile not found. Please complete setup first.', 404, 'THERAPIST_NOT_FOUND')
  }

  return { therapist, user, session }
}

/**
 * Error handler wrapper for API routes to properly handle AuthError instances
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   return handleAuthErrors(async () => {
 *     const { therapist } = await requireTherapist()
 *     // ... rest of handler
 *   })
 * }
 */
export async function handleAuthErrors(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler()
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.errorCode
        },
        { status: error.statusCode }
      )
    }
    // Re-throw unexpected errors for global error handler
    throw error
  }
}

/**
 * Setup helper that creates missing user/therapist accounts.
 * Use this only in POST endpoints or explicit setup flows.
 */
export async function ensureTherapistAccount(emailOrRequest: string | NextRequest, name?: string) {
  let email: string
  let userName: string | undefined

  if (typeof emailOrRequest === 'string') {
    email = emailOrRequest
    userName = name
  } else {
    // Handle NextRequest - extract from session
    const session = await auth()
    if (!session?.user?.email) {
      throw new Response('Unauthorized', { status: 401 })
    }
    email = session.user.email
    userName = session.user.name || session.user.email || 'Therapist'
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: userName || email || 'Therapist',
    },
    create: {
      email,
      name: userName || email || 'Therapist',
      role: 'OWNER',
    },
  })

  let therapist = await prisma.therapist.findUnique({
    where: { userId: user.id },
  })

  if (!therapist) {
    const baseSlug = email?.split('@')[0] || `therapist-${user.id}`
    let slugCandidate = baseSlug
    let suffix = 1

    while (true) {
      try {
        therapist = await prisma.therapist.create({
          data: {
            userId: user.id,
            slug: slugCandidate,
            designation: 'HEILMASSEUR',
            vatStatus: 'KLEINUNTERNEHMER',
          },
        })
        break
      } catch (error: any) {
        const isUniqueViolation =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as any).code === 'P2002'

        if (!isUniqueViolation) {
          throw error
        }

        slugCandidate = `${baseSlug}-${suffix}`
        suffix += 1
      }
    }
  }

  return { therapist, user }
}
