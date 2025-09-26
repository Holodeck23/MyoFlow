import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { withAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, adminUser) => {

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
  })
}