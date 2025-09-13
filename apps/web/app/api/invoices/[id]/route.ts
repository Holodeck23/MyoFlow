import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'

// Validation schemas
const UpdateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'VOID']).optional(),
  lines: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPriceCents: z.number().positive(),
    vatRate: z.enum(['KLEINUNTERNEHMER', 'UST_10', 'UST_13', 'UST_20'])
  })).optional(),
})

async function getTherapistId(): Promise<string> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
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

  let therapist = await prisma.therapist.findUnique({
    where: { userId: user.id },
  })

  if (!therapist) {
    therapist = await prisma.therapist.create({
      data: {
        userId: user.id,
        slug: session.user.email?.split('@')[0] || 'therapist',
        designation: 'HEILMASSEUR',
        vatStatus: 'KLEINUNTERNEHMER',
        kleinunternehmer: true,
      },
    })
  }

  return therapist.id
}

// GET /api/invoices/[id] - Get single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const therapistId = await getTherapistId()
    const invoiceId = params.id

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        therapistId,
      },
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            street: true,
            postalCode: true,
            city: true,
            country: true,
          },
        },
        Appointment: {
          select: {
            id: true,
            start: true,
            end: true,
            Service: {
              select: {
                id: true,
                name: true,
                category: true,
                durationMin: true,
              },
            },
            Location: {
              select: {
                id: true,
                name: true,
                type: true,
                address: true,
              },
            },
          },
        },
        Therapist: {
          select: {
            id: true,
            designation: true,
            kleinunternehmer: true,
            vatStatus: true,
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        Payments: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const therapistId = await getTherapistId()
    const invoiceId = params.id
    const body = await request.json()
    
    const validation = UpdateInvoiceSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid invoice data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if invoice exists and belongs to therapist
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        therapistId,
      },
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Prevent editing paid or void invoices
    if (existingInvoice.status === 'PAID' && data.lines) {
      return NextResponse.json(
        { error: 'Cannot modify lines of paid invoice' },
        { status: 400 }
      )
    }

    if (existingInvoice.status === 'VOID') {
      return NextResponse.json(
        { error: 'Cannot modify void invoice' },
        { status: 400 }
      )
    }

    const updateData: any = {}

    // Update status
    if (data.status !== undefined) {
      updateData.status = data.status
    }

    // Update lines and recalculate totals if provided
    if (data.lines) {
      const invoiceLines = data.lines.map(line => ({
        description: line.description,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        vatRate: line.vatRate,
        totalCents: line.unitPriceCents * line.quantity
      }))

      // Calculate new totals
      const totalGrossCents = invoiceLines.reduce((sum, line) => sum + line.totalCents, 0)
      
      // Simple VAT breakdown calculation
      const vatBreakdown = invoiceLines.reduce((breakdown: any[], line) => {
        const vatRate = line.vatRate === 'KLEINUNTERNEHMER' ? 0 : 
                       line.vatRate === 'UST_10' ? 0.10 :
                       line.vatRate === 'UST_13' ? 0.13 : 
                       line.vatRate === 'UST_20' ? 0.20 : 0
        
        const netAmount = Math.round(line.totalCents / (1 + vatRate))
        const vatAmount = line.totalCents - netAmount
        
        const existingEntry = breakdown.find(b => b.vatRate === vatRate * 100)
        if (existingEntry) {
          existingEntry.netCents += netAmount
          existingEntry.vatCents += vatAmount
          existingEntry.grossCents += line.totalCents
        } else {
          breakdown.push({
            netCents: netAmount,
            vatCents: vatAmount,
            grossCents: line.totalCents,
            vatRate: vatRate * 100
          })
        }
        
        return breakdown
      }, [])

      updateData.lines = invoiceLines
      updateData.totalGrossCents = totalGrossCents
      updateData.vatBreakdown = vatBreakdown
    }

    // Update the invoice
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
        Therapist: {
          select: {
            designation: true,
            kleinunternehmer: true,
            User: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const therapistId = await getTherapistId()
    const invoiceId = params.id

    // Check if invoice exists and belongs to therapist
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        therapistId,
      },
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of sent or paid invoices for compliance
    if (existingInvoice.status === 'SENT' || existingInvoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot delete sent or paid invoices. Mark as void instead.' },
        { status: 400 }
      )
    }

    // Delete associated payments first
    await prisma.payment.deleteMany({
      where: { invoiceId },
    })

    // Delete the invoice
    await prisma.invoice.delete({
      where: { id: invoiceId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}