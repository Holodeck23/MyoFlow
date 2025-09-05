import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@myoflow/db'
import { canAccessFinancials } from '@myoflow/lib'
import puppeteer from 'puppeteer'
import { renderToString } from 'react-dom/server'
import { InvoiceReceipt } from '@myoflow/lib/pdf/receipt'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check permissions
    if (!canAccessFinancials({ id: session.user.id, role: session.user.role })) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Fetch invoice with related data
    const invoice = await prisma.invoice.findUnique({
      where: { 
        id: params.id,
        therapistId: session.user.therapistId,
      },
      include: {
        Therapist: {
          include: {
            User: true,
          },
        },
        Client: true,
      },
    })

    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 })
    }

    // Check ETag for caching
    const etag = `"${invoice.id}-${invoice.updatedAt?.getTime() || invoice.createdAt.getTime()}"`
    const ifNoneMatch = request.headers.get('if-none-match')
    
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 })
    }

    // Prepare invoice data for PDF generation
    const invoiceData = {
      number: invoice.number,
      date: invoice.createdAt,
      therapist: {
        name: invoice.Therapist.User.name || 'Unknown',
        address: 'Address from settings', // TODO-CLAUDE: Get from settings
        designation: invoice.Therapist.designation,
        iban: invoice.Therapist.iban,
      },
      client: {
        name: invoice.Client?.name || 'Guest',
        address: undefined, // TODO-CLAUDE: Get client address
      },
      lines: invoice.lines as any[],
      vatItems: invoice.vatBreakdown as any[],
      totalGrossCents: invoice.totalGrossCents,
      kleinunternehmer: invoice.kleinunternehmer,
      locale: 'de' as const,
    }

    // Generate PDF using Puppeteer
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoice.number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; line-height: 1.4; }
            @page { size: A4; margin: 2cm; }
          </style>
        </head>
        <body>
          ${renderToString(InvoiceReceipt({ invoice: invoiceData }))}
        </body>
      </html>
    `

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm',
      },
    })
    
    await browser.close()

    // Return PDF with caching headers
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoice.number}.pdf"`,
        'ETag': etag,
        'Last-Modified': (invoice.updatedAt || invoice.createdAt).toUTCString(),
        'Cache-Control': 'private, max-age=300', // 5 minutes
      },
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}