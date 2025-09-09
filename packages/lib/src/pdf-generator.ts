import puppeteer from 'puppeteer'
import {
  formatEuro,
  formatDate,
  getKleinunternehmerDisclaimer,
  type InvoiceLine,
  type VATBreakdown
} from './austrian-invoicing'

interface InvoiceWithRelations {
  id: string
  number: string
  status: string
  totalGrossCents: number
  lines: InvoiceLine[]
  vatBreakdown: VATBreakdown[]
  kleinunternehmer: boolean
  createdAt: Date
  Client: {
    id: string
    name: string
    email: string | null
    phone: string | null
    street: string | null
    postalCode: string | null
    city: string | null
    country: string | null
    tags: string[]
    createdAt: Date
    therapistId: string
    healthFlagsEnc: string | null
    updatedAt: Date
  } | null
  Appointment: {
    id: string
    start: Date
    Service: {
      id: string
      name: string
      durationMin: number
      category: string
      priceCents: number
      therapistId: string
      vatRate: string
      active: boolean
    }
  } | null
}

interface TherapistInfo {
  name: string
  address: string
  city?: string
  postalCode?: string
  country?: string
  phone: string
  email: string
  uid?: string
  iban?: string
  bic?: string
  businessForm?: string
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
  const showVAT =
    !isKU && invoice.vatBreakdown.some(vat => vat.vatRate > 0)
  
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
          border: 1px solid #d1d5db;
        }
        
        .services-table th,
        .services-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e5e5e5;
          border-right: 1px solid #f3f4f6;
        }
        
        .services-table th {
          background-color: #f8fafc;
          font-weight: bold;
          color: #374151;
          border-bottom: 2px solid #d1d5db;
        }
        
        .services-table td:last-child,
        .services-table th:last-child {
          border-right: none;
        }
        
        .services-table .number-cell {
          text-align: right;
        }
        
        .services-table .description-cell {
          font-weight: 600;
          color: #1f2937;
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
          background-color: #1e40af;
          color: white;
          font-size: 16pt;
          font-weight: bold;
        }
        
        .total-row td {
          border-top: 3px solid #1e40af;
          border-bottom: 3px solid #1e40af;
          padding: 15px 12px;
          color: white;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
          font-size: 10pt;
          color: #6b7280;
        }
        
        .payment-terms {
          margin: 30px 0;
          background-color: #fef7cd;
          padding: 20px;
          border-left: 4px solid #eab308;
          border-radius: 4px;
        }
        
        .payment-terms h3 {
          margin: 0 0 15px 0;
          color: #92400e;
          font-size: 14pt;
        }
        
        .payment-terms .due-date {
          font-size: 16pt;
          font-weight: bold;
          color: #92400e;
          margin: 10px 0;
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
          ${therapistInfo.businessForm ? `<div style="font-size: 10pt; color: #6b7280;">${therapistInfo.businessForm}</div>` : ''}
          <div>${therapistInfo.address || '[Geschäftsadresse erforderlich]'}</div>
          ${therapistInfo.postalCode || therapistInfo.city || therapistInfo.country ?
            `<div>${[therapistInfo.postalCode, therapistInfo.city].filter(Boolean).join(' ')}${therapistInfo.country ? ', ' + therapistInfo.country : ''}</div>`
            : ''}
          <div style="margin-top: 10px;">
            <div>Tel: ${therapistInfo.phone}</div>
            <div>E-Mail: ${therapistInfo.email}</div>
            ${therapistInfo.uid && !therapistInfo.kleinunternehmer ? `<div>UID: ${therapistInfo.uid}</div>` : ''}
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
          <div class="bold">${invoice.Client?.name || 'Kunde'}</div>
          ${invoice.Client && (invoice.Client.street || invoice.Client.postalCode || invoice.Client.city || invoice.Client.country)
            ? `<div>${invoice.Client.street || ''}</div>
               <div>${[invoice.Client.postalCode, invoice.Client.city].filter(Boolean).join(' ')}${invoice.Client.country ? ', ' + invoice.Client.country : ''}</div>`
            : ''}
          ${invoice.Client?.email ? `<div>E-Mail: ${invoice.Client.email}</div>` : ''}
          ${invoice.Client?.phone ? `<div>Tel: ${invoice.Client.phone}</div>` : ''}
        </div>
      </div>

      <div class="invoice-details">
        <div class="details-column">
          <div><span class="bold">Rechnungsdatum:</span> ${formatDate(invoice.createdAt)}</div>
          <div><span class="bold">Leistungsdatum:</span> ${invoice.Appointment ? formatDate(invoice.Appointment.start) : formatDate(invoice.createdAt)}</div>
          ${invoice.Appointment ? `<div><span class="bold">Terminzeit:</span> ${formatDate(invoice.Appointment.start)}</div>` : ''}
        </div>
        <div class="details-column">
          <div><span class="bold">Zahlungsziel:</span> ${formatDate(new Date(invoice.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000))}</div>
          <div><span class="bold">Status:</span> ${getStatusLabel(invoice.status)}</div>
        </div>
      </div>

      <div class="payment-terms">
        <h3>Zahlungsbedingungen</h3>
        <div class="due-date">Zahlungsziel: ${formatDate(new Date(invoice.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000))}</div>
        <div style="margin: 10px 0;">
          <strong>Zahlungsart:</strong> Banküberweisung
        </div>
        <div style="margin: 5px 0;">
          <strong>Zahlungsfrist:</strong> 30 Tage netto ab Rechnungsdatum
        </div>
        <div style="margin: 5px 0; font-size: 10pt; color: #92400e;">
          Bei Zahlungsverzug werden Verzugszinsen gemäß § 456 UGB in Höhe von 9,2% p.a. verrechnet.
        </div>
      </div>

      <table class="services-table">
        <thead>
          <tr>
            <th>Leistung</th>
            <th class="number-cell">Menge</th>
            <th class="number-cell">Einzelpreis</th>
            ${showVAT ? '<th class="number-cell">Netto</th>' : ''}
            ${showVAT ? '<th class="number-cell">USt %</th>' : ''}
            ${showVAT ? '<th class="number-cell">USt Betrag</th>' : ''}
            <th class="number-cell">${showVAT ? 'Brutto' : 'Gesamt'}</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.lines
            .map(
              line => `
            <tr>
              <td class="description-cell">${line.description}</td>
              <td class="number-cell">${line.quantity}</td>
              <td class="number-cell">${formatEuro(line.unitPriceCents / 100)}</td>
              ${showVAT ? `<td class="number-cell">${formatEuro((line.totalCents / (1 + (invoice.vatBreakdown.find(v => v.vatRate > 0)?.vatRate || 0) / 100)) / 100)}</td>` : ''}
              ${showVAT ? `<td class="number-cell">${invoice.vatBreakdown.find(v => v.vatRate > 0)?.vatRate || 0}%</td>` : ''}
              ${showVAT ? `<td class="number-cell">${formatEuro((line.totalCents - (line.totalCents / (1 + (invoice.vatBreakdown.find(v => v.vatRate > 0)?.vatRate || 0) / 100))) / 100)}</td>` : ''}
              <td class="number-cell bold">${formatEuro(line.totalCents / 100)}</td>
            </tr>
          `)
            .join('')}
        </tbody>
      </table>

      <div class="totals-section">
        <table class="totals-table">
          ${showVAT ? invoice.vatBreakdown.map(vat => `
            <tr>
              <td class="label">Nettobetrag (${vat.vatRate}%):</td>
              <td class="amount">${formatEuro(vat.netCents / 100)}</td>
            </tr>
            <tr>
              <td class="label">USt (${vat.vatRate}%):</td>
              <td class="amount">${formatEuro(vat.vatCents / 100)}</td>
            </tr>
          `).join('') : ''}
          <tr class="total-row">
            <td class="label">${showVAT ? 'Bruttobetrag:' : 'Gesamtbetrag:'}</td>
            <td class="amount">${formatEuro(invoice.totalGrossCents / 100)}</td>
          </tr>
        </table>
      </div>

      <div class="payment-info">
        <div class="bold">Zahlungsinformationen:</div>
        ${therapistInfo.iban ? `<div><strong>IBAN:</strong> ${therapistInfo.iban}</div>` : '<div><strong>IBAN:</strong> [Bitte um Kontaktaufnahme für Bankdaten]</div>'}
        ${therapistInfo.bic ? `<div><strong>BIC:</strong> ${therapistInfo.bic}</div>` : ''}
        <div><strong>Verwendungszweck:</strong> Rechnung ${invoice.number}</div>
        <div><strong>Empfänger:</strong> ${therapistInfo.name}</div>
        <div style="margin-top: 10px; font-style: italic; color: #6b7280;">
          Bitte überweisen Sie den Rechnungsbetrag bis zum angegebenen Zahlungsziel.
        </div>
      </div>

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