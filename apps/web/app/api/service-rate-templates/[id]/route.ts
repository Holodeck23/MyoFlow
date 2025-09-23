import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'

const UpdateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100, 'Name too long').optional(),
  category: z.enum(['MASSAGE', 'YOGA', 'CONSULTING', 'OTHER']).optional(),
  priceCents: z.number().min(100, 'Price must be at least €1.00').max(50000, 'Price cannot exceed €500.00').optional(),
  vatRate: z.enum(['KLEINUNTERNEHMER', 'UST_10', 'UST_13', 'UST_20']).optional(),
  durationMin: z.number().min(15, 'Duration must be at least 15 minutes').max(480, 'Duration cannot exceed 8 hours').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  isDefault: z.boolean().optional(),
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
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const therapistId = await getTherapistId(session)
    const templateId = params.id
    const body = await request.json()
    const validatedData = UpdateTemplateSchema.parse(body)

    // Verify template ownership
    const existingTemplate = await prisma.serviceRateTemplate.findFirst({
      where: {
        id: templateId,
        therapistId,
      },
    })

    if (!existingTemplate) {
      return NextResponse.json({ 
        error: 'Template not found or not authorized' 
      }, { status: 404 })
    }

    // If setting as default, unset other defaults in the same category
    if (validatedData.isDefault) {
      const targetCategory = validatedData.category || existingTemplate.category
      await prisma.serviceRateTemplate.updateMany({
        where: {
          therapistId,
          category: targetCategory,
          isDefault: true,
          id: { not: templateId }, // Don't unset the current template
        },
        data: {
          isDefault: false,
        },
      })
    }

    const updatedTemplate = await prisma.serviceRateTemplate.update({
      where: { id: templateId },
      data: validatedData,
      select: {
        id: true,
        therapistId: true,
        name: true,
        category: true,
        durationMin: true,
        priceCents: true,
        vatRate: true,
        description: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
    })

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
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const therapistId = await getTherapistId(session)
    const templateId = params.id

    // Verify template ownership
    const existingTemplate = await prisma.serviceRateTemplate.findFirst({
      where: {
        id: templateId,
        therapistId,
      },
    })

    if (!existingTemplate) {
      return NextResponse.json({ 
        error: 'Template not found or not authorized' 
      }, { status: 404 })
    }

    // Soft delete - set active to false to preserve historical data
    await prisma.serviceRateTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Service rate template deactivated successfully',
    })

  } catch (error) {
    console.error('Error deleting service rate template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}