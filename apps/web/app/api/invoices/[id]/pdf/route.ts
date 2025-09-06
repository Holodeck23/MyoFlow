import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { generateInvoicePDF } from '@myoflow/lib'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the therapist user
    const therapist = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!therapist) {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
    }

    // Fetch invoice with related data
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        therapistId: therapist.id
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

    // Get therapist profile information (for now use placeholder data)
    const therapistInfo = {
      name: therapist.name || 'Dr. Therapist',
      address: 'Therapist Address 123',
      city: 'Wien',
      postalCode: '1010',
      country: 'Österreich',
      phone: '+43 1 234 5678',
      email: therapist.email,
      uid: 'ATU12345678', // Austrian tax number
      iban: 'AT61 1904 3002 3457 3201',
      kleinunternehmer: true // Default to Kleinunternehmer for now
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
  } finally {
    await prisma.$disconnect()
  }
}