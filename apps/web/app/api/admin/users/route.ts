import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@myoflow/db'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await auth()

    // Verify admin authentication
    if (!session?.user?.role || !['SUPER_ADMIN', 'SUPPORT', 'FINANCE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all users with their therapist data
    const users = await prisma.user.findMany({
      include: {
        Therapist: {
          select: {
            id: true,
            slug: true,
            designation: true,
            businessName: true,
            businessEmail: true,
            createdAt: true,
            profileCompletedAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data for the admin interface
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
      therapist: user.Therapist ? {
        id: user.Therapist.id,
        slug: user.Therapist.slug,
        designation: user.Therapist.designation,
        businessName: user.Therapist.businessName,
        businessEmail: user.Therapist.businessEmail,
        profileCompletedAt: user.Therapist.profileCompletedAt,
      } : null
    }))

    return NextResponse.json({ users: transformedUsers })
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}