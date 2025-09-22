import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'

const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100, 'Name too long'),
  category: z.enum(['MASSAGE', 'YOGA', 'CONSULTING', 'OTHER']),
  priceCents: z.number().min(0, 'Price must be positive'),
  vatRate: z.enum(['KLEINUNTERNEHMER', 'UST_10', 'UST_13', 'UST_20']),
  durationMin: z.number().min(15, 'Duration must be at least 15 minutes').max(480, 'Duration cannot exceed 8 hours'),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().default(false),
})

const UpdateTemplateSchema = CreateTemplateSchema.partial()

const QuerySchema = z.object({
  category: z.enum(['MASSAGE', 'YOGA', 'CONSULTING', 'OTHER']).optional(),
  isActive: z.string().transform(val => val === 'true').default('true'),
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
    const { searchParams } = new URL(request.url)
    const query = QuerySchema.parse(Object.fromEntries(searchParams))

    const whereClause: any = {
      therapistId,
      isActive: query.isActive,
    }

    if (query.category) {
      whereClause.category = query.category
    }

    const templates = await prisma.serviceRateTemplate.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
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

    // Generate category summary
    const categorySummary: Record<string, { count: number; defaultTemplate?: string }> = {}
    
    templates.forEach(template => {
      if (!categorySummary[template.category]) {
        categorySummary[template.category] = { count: 0 }
      }
      
      categorySummary[template.category].count++
      
      if (template.isDefault) {
        categorySummary[template.category].defaultTemplate = template.id
      }
    })

    return NextResponse.json({
      templates,
      categorySummary,
    })

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
    const validatedData = CreateTemplateSchema.parse(body)

    // If setting as default, unset other defaults in the same category
    if (validatedData.isDefault) {
      await prisma.serviceRateTemplate.updateMany({
        where: {
          therapistId,
          category: validatedData.category,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const template = await prisma.serviceRateTemplate.create({
      data: {
        therapistId,
        ...validatedData,
      },
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
      template,
    })

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