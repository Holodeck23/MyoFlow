import puppeteer from 'puppeteer'
import { Invoice } from './types'
import { formatEuro, formatDate, getKleinunternehmerDisclaimer } from './austrian-invoicing'

interface InvoiceWithRelations extends Invoice {
  Client: {
    id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    postalCode: string | null
    country: string | null
  }
  Appointment: {
    id: string
    start: Date
    Service: {
      name: string
      duration: number
    }
  } | null
}

interface TherapistInfo {
  name: string
  address: string
  city: string
  postalCode: string
  country: string
  phone: string
  email: string
  uid?: string
  iban?: string
  kleinunternehmer: boolean
}

export async function generateInvoicePDF(
  invoice: InvoiceWithRelations,
  therapistInfo: TherapistInfo
): Promise<Buffer> {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    await page.setContent(generateInvoiceHTML(invoice, therapistInfo), {
      waitUntil: 'networkidle0'
    })

    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    })

    return pdf
  } finally {
    await browser.close()
  }
}

function generateInvoiceHTML(
  invoice: InvoiceWithRelations,
  therapistInfo: TherapistInfo
): string {
  const isKU = therapistInfo.kleinunternehmer
  const showVAT = !isKU && invoice.vatRate > 0
  
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rechnung ${invoice.number}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          margin: 0;
          padding: 0;
          color: #333;
        }
        
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          border-bottom: 2px solid #e5e5e5;
          padding-bottom: 20px;
        }
        
        .therapist-info {
          flex: 1;
        }
        
        .invoice-title {
          flex: 1;
          text-align: right;
        }
        
        .invoice-title h1 {
          font-size: 24pt;
          color: #1f2937;
          margin: 0;
          font-weight: bold;
        }
        
        .invoice-number {
          font-size: 14pt;
          color: #6b7280;
          margin-top: 5px;
        }
        
        .client-section {
          margin: 30px 0;
        }
        
        .client-info {
          background-color: #f9fafb;
          padding: 15px;
          border-left: 4px solid #3b82f6;
          margin-bottom: 20px;
        }
        
        .invoice-details {
          display: flex;
          justify-content: space-between;
          margin: 30px 0;
        }
        
        .details-column {
          flex: 1;
        }
        
        .details-column + .details-column {
          margin-left: 40px;
        }
        
        .services-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          background: white;
        }
        
        .services-table th,
        .services-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e5e5;
        }
        
        .services-table th {
          background-color: #f3f4f6;
          font-weight: bold;
          color: #374151;
        }
        
        .services-table .number-cell {
          text-align: right;
        }
        
        .totals-section {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
        }
        
        .totals-table {
          width: 300px;
          border-collapse: collapse;
        }
        
        .totals-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #e5e5e5;
        }
        
        .totals-table .label {
          text-align: left;
          font-weight: bold;
        }
        
        .totals-table .amount {
          text-align: right;
          font-weight: bold;
        }
        
        .total-row {
          background-color: #f3f4f6;
          font-size: 14pt;
        }
        
        .total-row td {
          border-top: 2px solid #374151;
          border-bottom: 2px solid #374151;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
          font-size: 10pt;
          color: #6b7280;
        }
        
        .payment-info {
          margin: 20px 0;
          background-color: #f0f9ff;
          padding: 15px;
          border-left: 4px solid #0ea5e9;
        }
        
        .legal-notice {
          margin-top: 20px;
          font-size: 9pt;
          color: #9ca3af;
          font-style: italic;
        }
        
        .bold {
          font-weight: bold;
        }
        
        .text-right {
          text-align: right;
        }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <div class="therapist-info">
          <div class="bold" style="font-size: 14pt; color: #1f2937;">${therapistInfo.name}</div>
          <div>${therapistInfo.address}</div>
          <div>${therapistInfo.postalCode} ${therapistInfo.city}, ${therapistInfo.country}</div>
          <div style="margin-top: 10px;">
            <div>Tel: ${therapistInfo.phone}</div>
            <div>E-Mail: ${therapistInfo.email}</div>
            ${therapistInfo.uid ? `<div>UID: ${therapistInfo.uid}</div>` : ''}
          </div>
        </div>
        
        <div class="invoice-title">
          <h1>RECHNUNG</h1>
          <div class="invoice-number">Nr. ${invoice.number}</div>
        </div>
      </div>

      <div class="client-section">
        <div style="font-weight: bold; margin-bottom: 10px;">Rechnungsempfänger:</div>
        <div class="client-info">
          <div class="bold">${invoice.Client.name}</div>
          ${invoice.Client.address ? `<div>${invoice.Client.address}</div>` : ''}
          ${invoice.Client.postalCode && invoice.Client.city ? 
            `<div>${invoice.Client.postalCode} ${invoice.Client.city}${invoice.Client.country ? `, ${invoice.Client.country}` : ''}</div>` : ''}
          ${invoice.Client.email ? `<div>E-Mail: ${invoice.Client.email}</div>` : ''}
          ${invoice.Client.phone ? `<div>Tel: ${invoice.Client.phone}</div>` : ''}
        </div>
      </div>

      <div class="invoice-details">
        <div class="details-column">
          <div><span class="bold">Rechnungsdatum:</span> ${formatDate(invoice.date)}</div>
          <div><span class="bold">Leistungsdatum:</span> ${formatDate(invoice.serviceDate)}</div>
          ${invoice.Appointment ? `<div><span class="bold">Terminzeit:</span> ${formatDate(invoice.Appointment.start)}</div>` : ''}
        </div>
        <div class="details-column">
          <div><span class="bold">Zahlungsziel:</span> ${formatDate(invoice.dueDate)}</div>
          <div><span class="bold">Status:</span> ${getStatusLabel(invoice.status)}</div>
        </div>
      </div>

      <table class="services-table">
        <thead>
          <tr>
            <th>Leistung</th>
            <th>Beschreibung</th>
            <th class="number-cell">Menge</th>
            <th class="number-cell">Einzelpreis</th>
            ${showVAT ? '<th class="number-cell">Netto</th>' : ''}
            ${showVAT ? '<th class="number-cell">USt %</th>' : ''}
            ${showVAT ? '<th class="number-cell">USt Betrag</th>' : ''}
            <th class="number-cell">${showVAT ? 'Brutto' : 'Gesamt'}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${invoice.Appointment?.Service.name || 'Therapieleistung'}</td>
            <td>${invoice.description}</td>
            <td class="number-cell">${invoice.quantity}</td>
            <td class="number-cell">${formatEuro(invoice.unitPrice)}</td>
            ${showVAT ? `<td class="number-cell">${formatEuro(invoice.subtotal)}</td>` : ''}
            ${showVAT ? `<td class="number-cell">${invoice.vatRate}%</td>` : ''}
            ${showVAT ? `<td class="number-cell">${formatEuro(invoice.vatAmount)}</td>` : ''}
            <td class="number-cell bold">${formatEuro(invoice.total)}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals-section">
        <table class="totals-table">
          ${showVAT ? `
            <tr>
              <td class="label">Nettobetrag:</td>
              <td class="amount">${formatEuro(invoice.subtotal)}</td>
            </tr>
            <tr>
              <td class="label">USt (${invoice.vatRate}%):</td>
              <td class="amount">${formatEuro(invoice.vatAmount)}</td>
            </tr>
          ` : ''}
          <tr class="total-row">
            <td class="label">${showVAT ? 'Bruttobetrag:' : 'Gesamtbetrag:'}</td>
            <td class="amount">${formatEuro(invoice.total)}</td>
          </tr>
        </table>
      </div>

      ${therapistInfo.iban ? `
        <div class="payment-info">
          <div class="bold">Zahlungsinformationen:</div>
          <div>IBAN: ${therapistInfo.iban}</div>
          <div>Verwendungszweck: Rechnung ${invoice.number}</div>
          <div>Zahlungsziel: ${formatDate(invoice.dueDate)}</div>
        </div>
      ` : ''}

      <div class="footer">
        ${isKU ? `
          <div class="legal-notice">
            ${getKleinunternehmerDisclaimer()}
          </div>
        ` : ''}
        
        <div class="legal-notice" style="margin-top: 15px;">
          <div>Diese Rechnung wurde elektronisch erstellt und ist ohne Unterschrift gültig.</div>
          <div style="margin-top: 10px;">
            <strong>Wichtiger Hinweis:</strong> Als Therapieleistung handelt es sich um eine Dienstleistung im Bereich 
            der Gesundheitsförderung. Diese Leistung ersetzt keine ärztliche Behandlung oder medizinische Therapie.
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'DRAFT': return 'Entwurf'
    case 'SENT': return 'Versendet'
    case 'PAID': return 'Bezahlt'
    case 'VOID': return 'Storniert'
    default: return status
  }
}