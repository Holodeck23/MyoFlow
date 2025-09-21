import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { NextRequest } from 'next/server'

/**
 * Shared helper to require an authenticated therapist without side effects.
 * Throws an error if the therapist doesn't exist instead of creating one.
 */
export async function requireTherapist(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    throw new Response('User account not found. Please complete setup first.', { status: 404 })
  }

  const therapist = await prisma.therapist.findFirst({
    where: { userId: user.id }
  })

  if (!therapist) {
    throw new Response('Therapist profile not found. Please complete setup first.', { status: 404 })
  }

  return { therapist, user, session }
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
    const session = await getServerSession(authOptions)
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

  const therapist = await prisma.therapist.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      slug: email?.split('@')[0] || `therapist-${user.id}`,
      designation: 'HEILMASSEUR',
      vatStatus: 'KLEINUNTERNEHMER',
    },
  })

  return { therapist, user }
}