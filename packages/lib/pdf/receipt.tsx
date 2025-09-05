import React from 'react'
import { VatStatus } from '@myoflow/db'
import { formatCurrency, VatLineItem } from '../at/receipt'
import { formatDate } from '../i18n/config'

export interface InvoiceData {
  number: string
  date: Date
  therapist: {
    name: string
    address: string
    designation: string
    iban?: string
  }
  client: {
    name: string
    address?: string
  }
  lines: Array<{
    description: string
    quantity: number
    priceCents: number
    totalCents: number
  }>
  vatItems: VatLineItem[]
  totalGrossCents: number
  kleinunternehmer: boolean
  locale: 'de' | 'en'
}

export function InvoiceReceipt({ invoice }: { invoice: InvoiceData }) {
  const { locale } = invoice
  
  const t = {
    invoice: locale === 'de' ? 'Rechnung' : 'Invoice',
    date: locale === 'de' ? 'Datum' : 'Date',
    billTo: locale === 'de' ? 'Rechnung an' : 'Bill To',
    description: locale === 'de' ? 'Beschreibung' : 'Description',
    quantity: locale === 'de' ? 'Menge' : 'Quantity',
    price: locale === 'de' ? 'Preis' : 'Price',
    total: locale === 'de' ? 'Gesamt' : 'Total',
    subtotal: locale === 'de' ? 'Zwischensumme' : 'Subtotal',
    vat: locale === 'de' ? 'MwSt' : 'VAT',
    grandTotal: locale === 'de' ? 'Gesamtsumme' : 'Grand Total',
    paymentDetails: locale === 'de' ? 'Zahlungsdetails' : 'Payment Details',
    iban: 'IBAN',
    kleinunternehmerNote: locale === 'de' 
      ? 'Gemäß § 6 Abs. 1 Z 27 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).'
      : 'No VAT charged according to § 6 Abs. 1 Z 27 UStG (small business regulation).',
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '40px', maxWidth: '210mm', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 10px 0', color: '#333' }}>
          {t.invoice} {invoice.number}
        </h1>
        <p style={{ margin: '0', color: '#666' }}>
          {t.date}: {formatDate(invoice.date, locale)}
        </p>
      </div>

      {/* Addresses */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div style={{ flex: 1 }}>
          <strong>{invoice.therapist.name}</strong><br />
          <div dangerouslySetInnerHTML={{ __html: invoice.therapist.address.replace(/\n/g, '<br />') }} />
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
            {invoice.therapist.designation}
          </p>
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <strong>{t.billTo}:</strong><br />
          <strong>{invoice.client.name}</strong><br />
          {invoice.client.address && (
            <div dangerouslySetInnerHTML={{ __html: invoice.client.address.replace(/\n/g, '<br />') }} />
          )}
        </div>
      </div>

      {/* Line items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333' }}>
            <th style={{ textAlign: 'left', padding: '10px 0' }}>{t.description}</th>
            <th style={{ textAlign: 'center', padding: '10px 0', width: '80px' }}>{t.quantity}</th>
            <th style={{ textAlign: 'right', padding: '10px 0', width: '100px' }}>{t.price}</th>
            <th style={{ textAlign: 'right', padding: '10px 0', width: '100px' }}>{t.total}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px 0' }}>{line.description}</td>
              <td style={{ textAlign: 'center', padding: '10px 0' }}>{line.quantity}</td>
              <td style={{ textAlign: 'right', padding: '10px 0' }}>
                {formatCurrency(line.priceCents)}
              </td>
              <td style={{ textAlign: 'right', padding: '10px 0' }}>
                {formatCurrency(line.totalCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ marginLeft: 'auto', width: '300px' }}>
        {!invoice.kleinunternehmer && invoice.vatItems.map((vatItem, index) => (
          <div key={index}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <span>{t.subtotal} ({vatItem.vatRate}):</span>
              <span>{formatCurrency(vatItem.netCents)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <span>{t.vat} ({(getVatRate(vatItem.vatRate) * 100).toFixed(0)}%):</span>
              <span>{formatCurrency(vatItem.vatCents)}</span>
            </div>
          </div>
        ))}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          padding: '15px 0 5px 0', 
          borderTop: '2px solid #333',
          fontWeight: 'bold',
          fontSize: '18px'
        }}>
          <span>{t.grandTotal}:</span>
          <span>{formatCurrency(invoice.totalGrossCents)}</span>
        </div>
      </div>

      {/* Payment details */}
      {invoice.therapist.iban && (
        <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>{t.paymentDetails}</h3>
          <p style={{ margin: '5px 0' }}>
            <strong>{t.iban}:</strong> {invoice.therapist.iban}
          </p>
        </div>
      )}

      {/* Kleinunternehmer note */}
      {invoice.kleinunternehmer && (
        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px', fontSize: '14px' }}>
          {t.kleinunternehmerNote}
        </div>
      )}
    </div>
  )
}

function getVatRate(vatStatus: VatStatus): number {
  switch (vatStatus) {
    case VatStatus.UST_10: return 0.10
    case VatStatus.UST_13: return 0.13
    case VatStatus.UST_20: return 0.20
    default: return 0.00
  }
}