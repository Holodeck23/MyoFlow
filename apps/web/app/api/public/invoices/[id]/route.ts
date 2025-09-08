import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch invoice with related data - no authentication required for public view
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: params.id
      },
      include: {
        Client: true,
        Appointment: {
          include: {
            Service: true,
            Location: true
          }
        },
        Therapist: {
          include: {
            User: true
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Only show SENT or PAID invoices publicly (not DRAFT)
    if (invoice.status === 'DRAFT') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({ invoice }, { status: 200 })
  } catch (error) {
    console.error('Public invoice fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}