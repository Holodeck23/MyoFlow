import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { requireTherapist } from '@/lib/shared-helpers'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const { therapist } = await requireTherapist()

    const services = await prisma.service.findMany({
      where: {
        therapistId: therapist.id,
        active: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}
