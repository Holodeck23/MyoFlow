import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const UpdateServiceRateTemplateSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(255).optional(),
  category: z.enum(['MASSAGE', 'YOGA', 'CONSULTING', 'OTHER']).optional(),
  priceCents: z.number().min(0, 'Price must be positive').optional(),
  vatRate: z.enum(['KLEINUNTERNEHMER', 'UST_10', 'UST_13', 'UST_20']).optional(),
  durationMin: z.number().min(15, 'Duration must be at least 15 minutes').max(480).optional(),
  description: z.string().max(1000).optional(),
  isDefault: z.boolean().optional()
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const therapistId = await getTherapistId(session)
    const body = await request.json()
    
    // Validate input
    const validatedData = UpdateServiceRateTemplateSchema.parse(body)
    
    // Check if template exists and belongs to therapist
    const existingTemplate = await prisma.serviceRateTemplate.findFirst({
      where: {
        id: params.id,
        therapistId
      }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Service rate template not found' }, { status: 404 })
    }
    
    // If setting as default, unset other defaults in the same category
    if (validatedData.isDefault) {
      const category = validatedData.category || existingTemplate.category
      await prisma.serviceRateTemplate.updateMany({
        where: {
          therapistId,
          category,
          id: { not: params.id }
        },
        data: {
          isDefault: false
        }
      })
    }
    
    // Update service rate template
    const template = await prisma.serviceRateTemplate.update({
      where: {
        id: params.id
      },
      data: validatedData
    })

    return NextResponse.json({ success: true, template })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Error updating service rate template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const therapistId = await getTherapistId(session)
    
    // Check if template exists and belongs to therapist
    const existingTemplate = await prisma.serviceRateTemplate.findFirst({
      where: {
        id: params.id,
        therapistId
      }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Service rate template not found' }, { status: 404 })
    }
    
    // Delete service rate template
    await prisma.serviceRateTemplate.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting service rate template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}