import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ExportPreviewModal } from '../../app/dashboard/settings/components/ExportPreviewModal'

describe('ExportPreviewModal', () => {
  it('renders warning list and preview rows', () => {
    const data = {
      invoiceCount: 3,
      totalRevenueCents: 45000,
      dateRangeStart: '2025-09-01',
      dateRangeEnd: '2025-09-30',
      targetSystem: 'BMD',
      previewRows: [
        'Rechnungsnummer;Rechnungsdatum;Kunde',
        '2025-001;01.09.2025;Max Mustermann'
      ],
      validationWarnings: [
        {
          invoiceId: 'inv-1',
          invoiceNumber: '2025-001',
          message: 'Client address is missing',
          type: 'MISSING_CLIENT_ADDRESS'
        }
      ],
      warningCount: 1,
      excludedDraftCount: 0
    }

    const markup = renderToStaticMarkup(
      <ExportPreviewModal data={data} onClose={vi.fn()} onConfirm={vi.fn()} />
    )

    expect(markup).toContain('Preview Export')
    expect(markup).toContain('Client address is missing')
    expect(markup).toContain('Rechnungsnummer;Rechnungsdatum;Kunde')
    expect(markup).toContain('Download CSV')
  })
})
