import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@myoflow/db';
import {
  exportToBMD,
  exportToRZL,
  exportToDATEV,
  generateExportFilename,
  validateInvoiceForExport,
  InvoiceForExport
} from '@myoflow/lib';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') as 'BMD' | 'RZL' | 'DATEV';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const includeHeader = searchParams.get('includeHeader') !== 'false';

    // Validation
    if (!format || !['BMD', 'RZL', 'DATEV'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be BMD, RZL, or DATEV' },
        { status: 400 }
      );
    }

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: 'fromDate and toDate parameters are required' },
        { status: 400 }
      );
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    // Set end date to end of day to include all invoices created on that date
    to.setHours(23, 59, 59, 999);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Get therapist
    const therapist = await prisma.therapist.findFirst({
      where: {
        userId: session.user.id
      }
    });

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist profile not found' },
        { status: 404 }
      );
    }

    // Fetch invoices for the date range
    const invoices = await prisma.invoice.findMany({
      where: {
        therapistId: therapist.id,
        createdAt: {
          gte: from,
          lte: to
        },
        status: {
          not: 'DRAFT' // Don't export draft invoices
        }
      },
      include: {
        Client: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (invoices.length === 0) {
      return NextResponse.json(
        { error: 'No invoices found for the specified date range' },
        { status: 404 }
      );
    }

    // Transform to export format
    const invoicesForExport: InvoiceForExport[] = invoices.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      createdAt: invoice.createdAt,
      clientName: invoice.Client?.name || 'Unknown Client',
      clientAddress: [
        invoice.Client?.street,
        invoice.Client?.city,
        invoice.Client?.postalCode
      ].filter(Boolean).join(', ') || '',
      totalGrossCents: invoice.totalGrossCents,
      status: invoice.status as any,
      isKleinunternehmer: therapist.kleinunternehmer,
      lines: invoice.lines,
      vatBreakdown: invoice.vatBreakdown
    }));

    // Validate invoices
    const validationErrors: string[] = [];
    invoicesForExport.forEach((invoice) => {
      const errors = validateInvoiceForExport(invoice);
      if (errors.length > 0) {
        validationErrors.push(`Invoice ${invoice.number}: ${errors.join(', ')}`);
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation errors found',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Generate CSV content based on format
    let csvContent: string;
    let mimeType = 'text/csv';
    
    const options = { includeHeader };

    switch (format) {
      case 'BMD':
        csvContent = exportToBMD(invoicesForExport, options);
        break;
      case 'RZL':
        csvContent = exportToRZL(invoicesForExport, options);
        break;
      case 'DATEV':
        csvContent = exportToDATEV(invoicesForExport, {
          ...options,
          consultantNumber: searchParams.get('consultantNumber') || '',
          clientNumber: searchParams.get('clientNumber') || ''
        });
        mimeType = 'text/csv; charset=iso-8859-1'; // DATEV prefers ISO encoding
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported export format' },
          { status: 400 }
        );
    }

    // Generate filename
    const filename = generateExportFilename(format, from, to);

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}