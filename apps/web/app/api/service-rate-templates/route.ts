import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const ServiceRateTemplateSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(255),
  category: z.enum(['MASSAGE', 'YOGA', 'CONSULTING', 'OTHER']),
  priceCents: z.number().min(0, 'Price must be positive'),
  vatRate: z.enum(['KLEINUNTERNEHMER', 'UST_10', 'UST_13', 'UST_20']),
  durationMin: z.number().min(15, 'Duration must be at least 15 minutes').max(480),
  description: z.string().max(1000).optional(),
  isDefault: z.boolean().default(false)
})

async function getTherapistId(session: any): Promise<string> {
  if (!session?.user?.email) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {
      name: session.user.name || session.user.email || 'Unknown User',
    },
    create: {
      email: session.user.email,
      name: session.user.name || session.user.email || 'Unknown User',
    },
  })

  let therapist = await prisma.therapist.findFirst({
    where: { userId: user.id }
  })

  if (!therapist) {
    therapist = await prisma.therapist.create({
      data: {
        userId: user.id,
        slug: session.user.email?.split('@')[0] || 'therapist',
        designation: 'HEILMASSEUR',
        vatStatus: 'KLEINUNTERNEHMER'
      }
    })
  }

  return therapist.id
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const therapistId = await getTherapistId(session)
    
    // Get service rate templates
    const templates = await prisma.serviceRateTemplate.findMany({
      where: { therapistId },
      orderBy: [
        { category: 'asc' },
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ templates })

  } catch (error) {
    console.error('Error fetching service rate templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const therapistId = await getTherapistId(session)
    const body = await request.json()
    
    // Validate input
    const validatedData = ServiceRateTemplateSchema.parse(body)
    
    // If this is set as default, unset other defaults in the same category
    if (validatedData.isDefault) {
      await prisma.serviceRateTemplate.updateMany({
        where: {
          therapistId,
          category: validatedData.category
        },
        data: {
          isDefault: false
        }
      })
    }
    
    // Create new service rate template
    const template = await prisma.serviceRateTemplate.create({
      data: {
        ...validatedData,
        therapistId
      }
    })

    return NextResponse.json({ success: true, template })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error creating service rate template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}