import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { generateInvoicePDF } from '@myoflow/lib/src/pdf-generator'
import {
  type InvoiceLine,
  type VATBreakdown
} from '@myoflow/lib'


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the therapist user and therapist profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        Therapist: true
      }
    })

    if (!user || !user.Therapist) {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
    }

    // Fetch invoice with related data
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        therapistId: user.Therapist.id
      },
      include: {
        Client: true,
        Appointment: {
          include: {
            Service: true
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Get therapist profile information from settings
    const therapist = user.Therapist
    const therapistInfo = {
      name: therapist.businessName || user.name || 'Dr. Therapist',
      address: therapist.businessAddress || 'Mariahilfer Straße 123',
      city: 'Wien',
      postalCode: '1060',
      country: 'Österreich',
      phone: therapist.businessPhone || '+43 664 123 4567',
      email: therapist.businessEmail || user.email,
      uid: therapist.uidNumber || undefined,
      iban: therapist.iban || 'AT61 1904 3002 3457 3201',
      bic: undefined, // BIC will be omitted when unknown to avoid SEPA conflicts
      businessForm: 'eingetragenes Einzelunternehmen',
      kleinunternehmer: therapist.kleinunternehmer ?? (therapist.vatStatus === 'KLEINUNTERNEHMER')
    }

    // Cast JSON fields to typed arrays for PDF generation
    const invoiceForPDF: Parameters<typeof generateInvoicePDF>[0] = {
      ...invoice,
      lines: (invoice.lines as unknown as InvoiceLine[]) || [],
      vatBreakdown: (invoice.vatBreakdown as unknown as VATBreakdown[]) || []
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceForPDF, therapistInfo)

    // Return PDF with proper headers
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Rechnung-${invoice.number}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' }, 
      { status: 500 }
    )
  }
}