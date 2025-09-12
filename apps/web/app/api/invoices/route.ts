import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import { 
  generateInvoiceNumber, 
  createInvoiceLineFromService,
  calculateInvoiceTotals,
  validateInvoiceData,
  type AustrianInvoiceData,
  type InvoiceLine
} from '@myoflow/lib/src/austrian-invoicing'

// Validation schemas
const CreateInvoiceSchema = z.object({
  appointmentId: z.string().cuid().optional(),
  clientId: z.string().cuid(),
  lines: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPriceCents: z.number().positive(), 
    vatRate: z.enum(['KLEINUNTERNEHMER', 'UST_10', 'UST_13', 'UST_20'])
  })),
  serviceDate: z.string().datetime().optional(),
  notes: z.string().optional()
})

const InvoiceQuerySchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'VOID']).optional(),
  clientId: z.string().cuid().optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional()
})

async function getTherapistId(): Promise<string> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  // Find existing user by email (the reliable identifier)
  let user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    throw new Error('User not found in database')
  }

  // Find or create therapist profile
  const therapist = await prisma.therapist.upsert({
    where: { userId: user.id },
    update: {}, // Don't overwrite existing data
    create: {
      userId: user.id,
      slug: `therapist-${user.id}`,
      designation: 'HEILMASSEUR',
      vatStatus: 'KLEINUNTERNEHMER',
      kleinunternehmer: true,
    },
  })

  return therapist.id
}

async function getNextInvoiceNumber(therapistId: string): Promise<string> {
  const currentYear = new Date().getFullYear()
  
  // Get the highest invoice number for current year
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      therapistId,
      number: {
        startsWith: `${currentYear}-`
      }
    },
    orderBy: {
      number: 'desc'
    }
  })

  let sequenceNumber = 1
  if (lastInvoice) {
    const match = lastInvoice.number.match(/^\d{4}-(\d{3})$/)
    if (match) {
      sequenceNumber = parseInt(match[1]) + 1
    }
  }

  return generateInvoiceNumber(currentYear, sequenceNumber)
}

// GET /api/invoices - List invoices
export async function GET(request: NextRequest) {
  try {
    const therapistId = await getTherapistId()
    const { searchParams } = new URL(request.url)
    
    const query = InvoiceQuerySchema.safeParse({
      status: searchParams.get('status') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      start: searchParams.get('start') || undefined,
      end: searchParams.get('end') || undefined,
    })

    if (!query.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: query.error.issues },
        { status: 400 }
      )
    }

    const where: any = {
      therapistId,
    }

    // Add filters
    if (query.data.status) {
      where.status = query.data.status
    }
    
    if (query.data.clientId) {
      where.clientId = query.data.clientId
    }
    
    if (query.data.start || query.data.end) {
      where.createdAt = {}
      if (query.data.start) {
        where.createdAt.gte = new Date(query.data.start)
      }
      if (query.data.end) {
        where.createdAt.lte = new Date(query.data.end)
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Appointment: {
          select: {
            id: true,
            start: true,
            Service: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Create invoice
export async function POST(request: NextRequest) {
  try {
    const therapistId = await getTherapistId()
    const body = await request.json()
    
    const validation = CreateInvoiceSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid invoice data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Get therapist details for invoice
    const therapist = await prisma.therapist.findUnique({
      where: { id: therapistId },
      include: {
        User: true,
      },
    })

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Verify client belongs to therapist
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        therapistId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or access denied' },
        { status: 404 }
      )
    }

    // If appointment provided, verify it exists and belongs to therapist
    let appointment = null
    if (data.appointmentId) {
      appointment = await prisma.appointment.findFirst({
        where: {
          id: data.appointmentId,
          therapistId,
        },
        include: {
          Service: true,
        },
      })

      if (!appointment) {
        return NextResponse.json(
          { error: 'Appointment not found or access denied' },
          { status: 404 }
        )
      }

      // Check if appointment already has an invoice
      const existingInvoice = await prisma.invoice.findUnique({
        where: { appointmentId: data.appointmentId },
      })

      if (existingInvoice) {
        return NextResponse.json(
          { error: 'Appointment already has an invoice' },
          { status: 409 }
        )
      }
    }

    // Calculate totals
    const invoiceLines: InvoiceLine[] = data.lines.map(line => ({
      description: line.description,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      vatRate: line.vatRate,
      totalCents: line.unitPriceCents * line.quantity
    }))

    const totals = calculateInvoiceTotals(invoiceLines)
    const invoiceNumber = await getNextInvoiceNumber(therapistId)

    // Create Austrian invoice data for validation
    const invoiceData: AustrianInvoiceData = {
      number: invoiceNumber,
      date: new Date(),
      serviceDate: data.serviceDate ? new Date(data.serviceDate) : undefined,
      therapist: {
        name: therapist.User.name || 'Unknown Therapist',
        address: therapist.businessAddress || '',
        kleinunternehmer: therapist.kleinunternehmer,
        uid: therapist.uidNumber || undefined,
      },
      client: {
        name: client.name,
        email: client.email || undefined,
        address: [
          client.street,
          [client.postalCode, client.city].filter(Boolean).join(' '),
          client.country,
        ]
          .filter(Boolean)
          .join(', ') || undefined,
      },
      lines: invoiceLines,
      ...totals,
      kleinunternehmer: therapist.kleinunternehmer,
    }

    // Validate invoice data
    const validation_result = validateInvoiceData(invoiceData)
    if (!validation_result.valid) {
      return NextResponse.json(
        { error: 'Invalid invoice data', details: validation_result.errors },
        { status: 400 }
      )
    }

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        therapistId,
        clientId: data.clientId,
        appointmentId: data.appointmentId,
        number: invoiceNumber,
        status: 'DRAFT',
        lines: invoiceLines as any,
        totalGrossCents: totals.totalGrossCents,
        vatBreakdown: totals.vatBreakdown as any,
        kleinunternehmer: therapist.kleinunternehmer,
      },
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Appointment: {
          select: {
            id: true,
            start: true,
            Service: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}