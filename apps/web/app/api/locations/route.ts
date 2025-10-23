import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { requireTherapist } from '@/lib/shared-helpers'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const { therapist } = await requireTherapist()

    const locations = await prisma.location.findMany({
      where: {
        therapistId: therapist.id
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}
