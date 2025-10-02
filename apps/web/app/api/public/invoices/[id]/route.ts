import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { verifyPublicInvoiceToken } from '@myoflow/lib/security'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require signed token for access
    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ error: 'Access token required' }, { status: 401 })
    }

    const tokenPayload = verifyPublicInvoiceToken(token)
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Verify token matches requested invoice
    if (tokenPayload.invoiceId !== params.id) {
      return NextResponse.json({ error: 'Token does not match invoice' }, { status: 403 })
    }

    // Fetch invoice with minimal data for public view
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: params.id,
        therapistId: tokenPayload.therapistId, // Tenant scoping
      },
      include: {
        Client: {
          select: {
            name: true,
            // Exclude PII like email, phone, address
          }
        },
        Appointment: {
          include: {
            Service: {
              select: {
                name: true,
                durationMin: true,
                // Exclude pricing data
              }
            },
            Location: {
              select: {
                name: true,
                address: true,
                // Public location info only
              }
            }
          }
        },
        Therapist: {
          select: {
            businessName: true,
            // Exclude personal contact details
            User: {
              select: {
                name: true,
                // Exclude email and other PII
              }
            }
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