import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
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
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the therapist user and therapist profile with branding settings
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

    // Validate required therapist contact information before PDF generation
    const therapist = user.Therapist

    // Check for required fields - prevent placeholder data in PDFs
    const missingFields: string[] = []
    if (!therapist.businessEmail) missingFields.push('business email')
    if (!therapist.businessPhone) missingFields.push('business phone')
    if (!therapist.businessAddress) missingFields.push('business address')
    if (!therapist.businessName && !user.name) missingFields.push('business name')

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Therapist contact information incomplete. Please complete your profile before generating invoices.',
        missingFields,
        profileUrl: '/settings/profile'
      }, { status: 400 })
    }

    const therapistInfo = {
      name: therapist.businessName || user.name!,
      address: therapist.businessAddress!,
      city: 'Wien',
      postalCode: '1060',
      country: 'Österreich',
      phone: therapist.businessPhone!,
      email: therapist.businessEmail!,
      uid: therapist.uidNumber || undefined,
      iban: therapist.iban || undefined,
      bic: undefined, // BIC will be omitted when unknown to avoid SEPA conflicts
      businessForm: 'eingetragenes Einzelunternehmen',
      kleinunternehmer: therapist.kleinunternehmer ?? (therapist.vatStatus === 'KLEINUNTERNEHMER'),
      // Branding settings
      invoiceLogoUrl: therapist.invoiceLogoUrl || undefined,
      invoiceDisplayPreference: therapist.invoiceDisplayPreference || undefined,
      invoiceThankYouMessage: therapist.invoiceThankYouMessage || undefined,
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