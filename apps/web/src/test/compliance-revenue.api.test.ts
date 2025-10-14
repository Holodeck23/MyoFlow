import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const mockAuth = vi.hoisted(() => vi.fn())
const mockGetServerSession = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  therapist: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  invoice: {
    aggregate: vi.fn(),
  },
}))

vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: mockAuth,
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
  getServerSession: mockGetServerSession,
}))

vi.mock('../../lib/auth', () => ({
  auth: mockAuth,
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('@myoflow/db', () => ({
  prisma: mockPrisma,
  PrismaClient: vi.fn(() => mockPrisma),
}))

// Mock formatAustrianCurrency from lib to avoid import issues
vi.mock('@myoflow/lib', async () => {
  const actual = await vi.importActual('@myoflow/lib')
  return {
    ...actual,
    formatAustrianCurrency: (cents: number) =>
      new Intl.NumberFormat('de-AT', {
        style: 'currency',
        currency: 'EUR',
      }).format(cents / 100),
  }
})

import { GET } from '../../app/api/compliance/revenue-status/route'

describe('Revenue Status API', () => {
  const KLEINUNTERNEHMER_THRESHOLD_CENTS = 5500000 // €55,000
  const WARNING_THRESHOLD_CENTS = 4950000 // 90% of €55,000 = €49,500

  beforeEach(() => {
    vi.clearAllMocks()

    const mockSession = {
      user: {
        email: 'therapist@example.com',
        name: 'Test Therapist',
      },
    }

    mockAuth.mockResolvedValue(mockSession)
  })

  describe('GET /api/compliance/revenue-status', () => {
    it('should return unauthorized if no session', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/compliance/revenue-status')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return safe status for low revenue (< 90% threshold)', async () => {
      const currentYearRevenue = 3000000 // €30,000

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: {
          id: 'therapist-1',
          annualGrossCents: currentYearRevenue,
          annualGrossCachedAt: new Date(),
        },
      })

      mockPrisma.invoice.aggregate.mockResolvedValue({
        _sum: {
          totalGrossCents: currentYearRevenue,
        },
      })

      const request = new Request('http://localhost:3000/api/compliance/revenue-status')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toMatchObject({
        currentRevenueCents: currentYearRevenue,
        thresholdCents: KLEINUNTERNEHMER_THRESHOLD_CENTS,
        percentageUsed: expect.any(Number),
        status: 'SAFE',
        alert: false,
      })

      expect(data.percentageUsed).toBeCloseTo(54.5, 1) // 30k/55k = 54.5%
    })

    it('should return warning status when approaching threshold (90-100%)', async () => {
      const currentYearRevenue = 5000000 // €50,000

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: {
          id: 'therapist-1',
          annualGrossCents: currentYearRevenue,
          annualGrossCachedAt: new Date(),
        },
      })

      mockPrisma.invoice.aggregate.mockResolvedValue({
        _sum: {
          totalGrossCents: currentYearRevenue,
        },
      })

      const request = new Request('http://localhost:3000/api/compliance/revenue-status')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toMatchObject({
        currentRevenueCents: currentYearRevenue,
        thresholdCents: KLEINUNTERNEHMER_THRESHOLD_CENTS,
        status: 'WARNING',
        alert: true,
      })
      expect(data.message).toContain('Kleinunternehmergrenze')

      expect(data.percentageUsed).toBeCloseTo(90.9, 1) // 50k/55k = 90.9%
    })

    it('should return exceeded status when over threshold (100-110%)', async () => {
      const currentYearRevenue = 5600000 // €56,000

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: {
          id: 'therapist-1',
          annualGrossCents: currentYearRevenue,
          annualGrossCachedAt: new Date(),
        },
      })

      mockPrisma.invoice.aggregate.mockResolvedValue({
        _sum: {
          totalGrossCents: currentYearRevenue,
        },
      })

      const request = new Request('http://localhost:3000/api/compliance/revenue-status')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toMatchObject({
        currentRevenueCents: currentYearRevenue,
        thresholdCents: KLEINUNTERNEHMER_THRESHOLD_CENTS,
        status: 'EXCEEDED',
        alert: true,
      })
      expect(data.message).toContain('Kleinunternehmergrenze')

      expect(data.percentageUsed).toBeCloseTo(101.8, 1) // 56k/55k = 101.8%
    })

    it('should return critical status when over 10% tolerance (>110%)', async () => {
      const currentYearRevenue = 6200000 // €62,000

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: {
          id: 'therapist-1',
          annualGrossCents: currentYearRevenue,
          annualGrossCachedAt: new Date(),
        },
      })

      mockPrisma.invoice.aggregate.mockResolvedValue({
        _sum: {
          totalGrossCents: currentYearRevenue,
        },
      })

      const request = new Request('http://localhost:3000/api/compliance/revenue-status')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toMatchObject({
        currentRevenueCents: currentYearRevenue,
        thresholdCents: KLEINUNTERNEHMER_THRESHOLD_CENTS,
        status: 'CRITICAL',
        alert: true,
      })
      expect(data.message).toContain('Toleranzgrenze')

      expect(data.percentageUsed).toBeCloseTo(112.7, 1) // 62k/55k = 112.7%
    })

    it('should calculate revenue from current year invoices when cache is stale', async () => {
      const staleDate = new Date('2024-01-01')
      const oldCachedRevenue = 1000000 // €10,000 (stale)
      const actualRevenue = 4000000 // €40,000 (actual)

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: {
          id: 'therapist-1',
          annualGrossCents: oldCachedRevenue,
          annualGrossCachedAt: staleDate, // Stale cache
        },
      })

      mockPrisma.invoice.aggregate.mockResolvedValue({
        _sum: {
          totalGrossCents: actualRevenue,
        },
      })

      mockPrisma.therapist.update.mockResolvedValue({
        id: 'therapist-1',
        annualGrossCents: actualRevenue,
        annualGrossCachedAt: new Date(),
      })

      const request = new Request('http://localhost:3000/api/compliance/revenue-status')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.currentRevenueCents).toBe(actualRevenue)
      expect(mockPrisma.invoice.aggregate).toHaveBeenCalled()
      expect(mockPrisma.therapist.update).toHaveBeenCalledWith({
        where: { id: 'therapist-1' },
        data: {
          annualGrossCents: actualRevenue,
          annualGrossCachedAt: expect.any(Date),
        },
      })
    })

    it('should use cached revenue when cache is fresh (< 24 hours)', async () => {
      const freshDate = new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      const cachedRevenue = 3500000 // €35,000

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: {
          id: 'therapist-1',
          annualGrossCents: cachedRevenue,
          annualGrossCachedAt: freshDate,
        },
      })

      const request = new Request('http://localhost:3000/api/compliance/revenue-status')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.currentRevenueCents).toBe(cachedRevenue)
      expect(data.isCached).toBe(true)
      expect(mockPrisma.invoice.aggregate).not.toHaveBeenCalled()
      expect(mockPrisma.therapist.update).not.toHaveBeenCalled()
    })

    it('should handle zero revenue correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: {
          id: 'therapist-1',
          annualGrossCents: 0,
          annualGrossCachedAt: new Date(),
        },
      })

      mockPrisma.invoice.aggregate.mockResolvedValue({
        _sum: {
          totalGrossCents: 0,
        },
      })

      const request = new Request('http://localhost:3000/api/compliance/revenue-status')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toMatchObject({
        currentRevenueCents: 0,
        thresholdCents: KLEINUNTERNEHMER_THRESHOLD_CENTS,
        percentageUsed: 0,
        status: 'SAFE',
        alert: false,
      })
    })

    it('should include remaining amount in response', async () => {
      const currentYearRevenue = 3000000 // €30,000

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: {
          id: 'therapist-1',
          annualGrossCents: currentYearRevenue,
          annualGrossCachedAt: new Date(),
        },
      })

      const request = new Request('http://localhost:3000/api/compliance/revenue-status')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.remainingCents).toBe(2500000) // €55k - €30k = €25k
    })

    it('should include formatted currency amounts', async () => {
      const currentYearRevenue = 4200000 // €42,000

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: {
          id: 'therapist-1',
          annualGrossCents: currentYearRevenue,
          annualGrossCachedAt: new Date(),
        },
      })

      const request = new Request('http://localhost:3000/api/compliance/revenue-status')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.formatted).toBeDefined()
      expect(data.formatted.currentRevenue).toContain('42')
      expect(data.formatted.threshold).toContain('55')
      expect(data.formatted.remaining).toContain('13')
    })

    it('should return 404 if therapist not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: null,
      })

      const request = new Request('http://localhost:3000/api/compliance/revenue-status')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Therapist not found')
    })
  })

  describe('Revenue Calculation Logic', () => {
    it('should only count PAID and SENT invoices for revenue', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: {
          id: 'therapist-1',
          annualGrossCents: 0,
          annualGrossCachedAt: null,
        },
      })

      mockPrisma.invoice.aggregate.mockResolvedValue({
        _sum: {
          totalGrossCents: 3000000,
        },
      })

      const request = new Request('http://localhost:3000/api/compliance/revenue-status')
      await GET(request as NextRequest)

      // Verify the query filters for PAID and SENT status
      expect(mockPrisma.invoice.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: expect.objectContaining({
              in: ['PAID', 'SENT'],
            }),
          }),
        })
      )
    })

    it('should filter invoices by current year', async () => {
      const currentYear = new Date().getFullYear()
      const yearStart = new Date(currentYear, 0, 1) // Jan 1
      const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999) // Dec 31

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: {
          id: 'therapist-1',
          annualGrossCents: 0,
          annualGrossCachedAt: null,
        },
      })

      mockPrisma.invoice.aggregate.mockResolvedValue({
        _sum: {
          totalGrossCents: 2000000,
        },
      })

      const request = new Request('http://localhost:3000/api/compliance/revenue-status')
      await GET(request as NextRequest)

      // Verify the query filters by current year
      expect(mockPrisma.invoice.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      )
    })
  })
})
