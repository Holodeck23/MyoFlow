import { VatStatus } from '@myoflow/db'

export const KLEINUNTERNEHMER_LIMIT = 5500000 // 55,000€ in cents

export interface InvoiceLine {
  description: string
  quantity: number
  priceCents: number
  vatRate: VatStatus
}

export interface VatLineItem {
  vatRate: VatStatus
  netCents: number
  vatCents: number
  grossCents: number
}

export function getVatRate(vatStatus: VatStatus): number {
  switch (vatStatus) {
    case VatStatus.UST_10:
      return 0.10
    case VatStatus.UST_13:
      return 0.13
    case VatStatus.UST_20:
      return 0.20
    case VatStatus.KLEINUNTERNEHMER:
      return 0.00
    default:
      return 0.00
  }
}

export function vatLineItems(lines: InvoiceLine[], kleinunternehmer: boolean): VatLineItem[] {
  const vatGroups = new Map<VatStatus, VatLineItem>()
  
  for (const line of lines) {
    const grossCents = line.quantity * line.priceCents
    const vatRate = kleinunternehmer ? 0 : getVatRate(line.vatRate)
    const netCents = Math.round(grossCents / (1 + vatRate))
    const vatCents = grossCents - netCents
    
    const existing = vatGroups.get(line.vatRate)
    if (existing) {
      existing.netCents += netCents
      existing.vatCents += vatCents
      existing.grossCents += grossCents
    } else {
      vatGroups.set(line.vatRate, {
        vatRate: line.vatRate,
        netCents,
        vatCents,
        grossCents,
      })
    }
  }
  
  return Array.from(vatGroups.values())
}

export function kleinunternehmerFooter(): string {
  return 'Gemäß § 6 Abs. 1 Z 27 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).'
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('de-AT', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

export function calculateInvoiceTotals(lines: InvoiceLine[], kleinunternehmer: boolean) {
  const vatItems = vatLineItems(lines, kleinunternehmer)
  
  const totalNetCents = vatItems.reduce((sum, item) => sum + item.netCents, 0)
  const totalVatCents = vatItems.reduce((sum, item) => sum + item.vatCents, 0)
  const totalGrossCents = vatItems.reduce((sum, item) => sum + item.grossCents, 0)
  
  return {
    vatItems,
    totalNetCents,
    totalVatCents,
    totalGrossCents,
  }
}