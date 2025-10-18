import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest, NextResponse } from 'next/server'

const mockRequireTherapist = vi.hoisted(() => vi.fn())
const mockHandleAuthErrors = vi.hoisted(() =>
  vi.fn(async (handler: () => Promise<NextResponse> | NextResponse) => handler())
)
const mockPrisma = vi.hoisted(() => ({
  invoice: {
    findMany: vi.fn(),
    count: vi.fn()
  },
  exportLog: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn()
  }
}))

vi.mock('@/lib/shared-helpers', () => ({
  requireTherapist: mockRequireTherapist,
  handleAuthErrors: (handler: any) => mockHandleAuthErrors(handler),
  AuthError: class extends Error {}
}))

vi.mock('@myoflow/db', async () => {
  const actual = await vi.importActual<typeof import('@myoflow/db')>('@myoflow/db')
  return {
    ...actual,
    prisma: mockPrisma
  }
})

import { POST as generateExport } from '../../app/api/exports/accounting/generate/route'
import { POST as previewExport } from '../../app/api/exports/accounting/preview/route'
import { GET as historyExport } from '../../app/api/exports/accounting/history/route'
import { GET as downloadExport } from '../../app/api/exports/accounting/download/[exportId]/route'

const baseInvoice = {
  id: 'inv_1',
  number: '2025-001',
  createdAt: new Date('2025-09-05T10:00:00Z'),
  totalGrossCents: 120_00,
  status: 'PAID',
  kleinunternehmer: false,
  lines: [],
  vatBreakdown: {
    '20': { netCents: 100_00, vatCents: 20_00, grossCents: 120_00 }
  },
  Client: {
    name: 'Max Mustermann',
    street: 'Hauptstraße 1',
    postalCode: '1010',
    city: 'Wien'
  },
  Payments: [
    {
      status: 'SETTLED',
      createdAt: new Date('2025-09-08T10:00:00Z')
    }
  ]
}

const draftInvoice = {
  ...baseInvoice,
  id: 'inv_draft',
  number: '',
  status: 'DRAFT'
}

describe('Accounting export API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireTherapist.mockResolvedValue({
      therapist: { id: 'therapist-1' },
      user: { id: 'user-1' }
    })
    mockPrisma.invoice.findMany.mockResolvedValue([baseInvoice])
    mockPrisma.invoice.count.mockResolvedValue(1)
    mockPrisma.exportLog.create.mockResolvedValue(undefined)
    mockPrisma.exportLog.findMany.mockResolvedValue([])
    mockPrisma.exportLog.findFirst.mockResolvedValue(null)
    mockPrisma.exportLog.update.mockResolvedValue(undefined)
  })

  describe('POST /api/exports/accounting/generate', () => {
    it('returns CSV payload and logs export', async () => {
      const request = new Request('http://localhost/api/exports/accounting/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSystem: 'BMD',
          dateRangeStart: '2025-09-01',
          dateRangeEnd: '2025-09-30',
          statusFilter: ['PAID']
        })
      })

      const response = await generateExport(request as unknown as NextRequest)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('text/csv')
      const body = await response.text()
      expect(body).toContain('Satzart;GKonto;Steuercode')
      expect(mockPrisma.exportLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            therapistId: 'therapist-1',
            invoiceCount: 1,
            targetSystem: 'BMD'
          })
        })
      )
    })

    it('returns validation errors when invoices invalid', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([draftInvoice])

      const request = new Request('http://localhost/api/exports/accounting/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSystem: 'BMD',
          dateRangeStart: '2025-09-01',
          dateRangeEnd: '2025-09-30'
        })
      })

      const response = await generateExport(request as unknown as NextRequest)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation failed')
      expect(data.details.invoiceValidationErrors).toHaveLength(1)
      expect(mockPrisma.exportLog.create).not.toHaveBeenCalled()
    })

    it('returns informational response when no invoices found', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([])
      mockPrisma.invoice.count.mockResolvedValue(0)

      const request = new Request('http://localhost/api/exports/accounting/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSystem: 'BMD',
          dateRangeStart: '2025-09-01',
          dateRangeEnd: '2025-09-30'
        })
      })

      const response = await generateExport(request as unknown as NextRequest)
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(String(data.error)).toContain('No invoices found')
      expect(String(data.error)).toContain('Sent')
      expect(mockPrisma.exportLog.create).not.toHaveBeenCalled()
      expect(mockPrisma.invoice.count).toHaveBeenCalled()
    })
  })

  describe('POST /api/exports/accounting/preview', () => {
    it('returns preview rows and warnings', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([
        {
          ...baseInvoice,
          Client: {
            name: 'Julia Beispiel',
            street: '',
            postalCode: '',
            city: ''
          }
        }
      ])

      const request = new Request('http://localhost/api/exports/accounting/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSystem: 'BMD',
          dateRangeStart: '2025-09-01',
          dateRangeEnd: '2025-09-30'
        })
      })

      const response = await previewExport(request as unknown as NextRequest)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data.data.previewRows)).toBe(true)
      expect(data.data.previewRows[0]).toContain('Rechnungsnummer')
      expect(data.data.warningCount).toBeGreaterThanOrEqual(1)
    })
  })

  describe('GET /api/exports/accounting/history', () => {
    it('returns most recent export history', async () => {
      mockPrisma.exportLog.findMany.mockResolvedValue([
        {
          id: 'log_1',
          therapistId: 'therapist-1',
          configurationId: null,
          exportType: 'ACCOUNTING_EXPORT',
          targetSystem: 'BMD',
          dateRangeStart: new Date('2025-09-01T00:00:00Z'),
          dateRangeEnd: new Date('2025-09-30T23:59:59Z'),
          invoiceCount: 2,
          totalRevenueCents: 240_00,
          exportedAt: new Date('2025-10-01T08:00:00Z'),
          fileSize: 1024,
          fileName: 'MyoFlow-BMD-Export-2025-09-01-2025-09-30.csv',
          downloadCount: 1,
          lastDownloadAt: new Date('2025-10-02T08:00:00Z'),
          Configuration: {
            configurationName: 'Monthly BMD'
          }
        }
      ] as any)

      const response = await historyExport()
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0]).toMatchObject({
        id: 'log_1',
        targetSystem: 'BMD',
        configurationName: 'Monthly BMD'
      })
    })
  })

  describe('GET /api/exports/accounting/download/:exportId', () => {
    it('re-generates CSV and increments download count', async () => {
      mockPrisma.exportLog.findFirst.mockResolvedValue({
        id: 'log_1',
        therapistId: 'therapist-1',
        configurationId: null,
        exportType: 'ACCOUNTING_EXPORT',
        targetSystem: 'BMD',
        dateRangeStart: new Date('2025-09-01T00:00:00Z'),
        dateRangeEnd: new Date('2025-09-30T23:59:59Z'),
        invoiceCount: 1,
        totalRevenueCents: 120_00,
        exportedAt: new Date('2025-10-01T08:00:00Z'),
        fileSize: 1024,
        fileName: 'MyoFlow-BMD-Export-2025-09-01-2025-09-30.csv',
        downloadCount: 0,
        lastDownloadAt: null,
        Configuration: null
      })

      mockPrisma.invoice.findMany.mockResolvedValue([baseInvoice])

      const response = await downloadExport(
        new Request('http://localhost/api/exports/accounting/download/log_1') as unknown as NextRequest,
        { params: { exportId: 'log_1' } }
      )

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('text/csv')
      expect(mockPrisma.exportLog.update).toHaveBeenCalledWith({
        where: { id: 'log_1' },
        data: expect.objectContaining({
          downloadCount: 1,
          invoiceCount: 1
        })
      })
    })

    it('returns 404 when export not found', async () => {
      mockPrisma.exportLog.findFirst.mockResolvedValue(null)

      const response = await downloadExport(
        new Request('http://localhost/api/exports/accounting/download/log_missing') as unknown as NextRequest,
        { params: { exportId: 'log_missing' } }
      )

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Export not found')
    })
  })
})
