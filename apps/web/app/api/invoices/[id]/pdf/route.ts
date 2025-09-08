import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { generateInvoicePDF } from '@myoflow/lib'


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
      address: therapist.businessAddress || 'Business Address not set',
      city: 'Wien',
      postalCode: '1010',
      country: 'Österreich',
      phone: therapist.businessPhone || '+43 1 234 5678',
      email: therapist.businessEmail || user.email,
      uid: therapist.uidNumber || 'ATU12345678',
      iban: therapist.iban || 'AT61 1904 3002 3457 3201',
      kleinunternehmer: therapist.kleinunternehmer ?? (therapist.vatStatus === 'KLEINUNTERNEHMER'),
      designation: therapist.designation || 'HEILMASSEUR',
      vatStatus: therapist.vatStatus || 'KLEINUNTERNEHMER'
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice, therapistInfo)

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
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' }, 
      { status: 500 }
    )
  }
}