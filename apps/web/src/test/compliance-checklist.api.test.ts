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

// Mock the compliance checklist functions to avoid circular dependencies
vi.mock('@myoflow/lib', async () => {
  const actual = await vi.importActual('@myoflow/lib')
  return {
    ...actual,
  }
})

import { GET } from '../../app/api/compliance/checklist/route'

describe('Compliance Checklist API', () => {
  const completeTherapist = {
    id: 'therapist-1',
    businessName: 'Test Praxis',
    businessAddress: 'Teststraße 1',
    businessEmail: 'test@example.com',
    businessPhone: '+43 1 234 5678',
    iban: 'AT611904300234573201',
    uidNumber: 'ATU12345678',
    taxValidationCompleted: true,
    taxValidatedAt: new Date('2025-10-01'),
    annualGrossCents: 3000000, // €30k
    annualGrossCachedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()

    const mockSession = {
      user: {
        email: 'therapist@example.com',
        name: 'Test Therapist',
      },
    }

    mockAuth.mockResolvedValue(mockSession)
    mockGetServerSession.mockResolvedValue(mockSession)
  })

  describe('GET /api/compliance/checklist', () => {
    it('should return complete checklist for fully validated therapist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test Therapist',
        Therapist: completeTherapist,
      })

      const request = new Request('http://localhost:3000/api/compliance/checklist')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toMatchObject({
        overallScore: expect.any(Number),
        taxValidation: {
          completed: true,
          validatedAt: expect.any(String),
        },
        profileComplete: true,
        revenueStatus: 'SAFE',
        checklist: expect.arrayContaining([
          expect.objectContaining({
            category: expect.any(String),
            status: expect.any(String),
          }),
        ]),
      })

      expect(data.overallScore).toBeGreaterThanOrEqual(80)
    })

    it('should return incomplete status for new therapist', async () => {
      const incompleteTherapist = {
        id: 'therapist-2',
        businessName: null,
        businessAddress: null,
        businessEmail: null,
        businessPhone: null,
        iban: null,
        uidNumber: null,
        taxValidationCompleted: false,
        taxValidatedAt: null,
        annualGrossCents: 0,
        annualGrossCachedAt: null,
      }

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        name: 'New Therapist',
        Therapist: incompleteTherapist,
      })

      const request = new Request('http://localhost:3000/api/compliance/checklist')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.profileComplete).toBe(false)
      expect(data.taxValidation.completed).toBe(false)
      expect(data.overallScore).toBeLessThan(50)
    })

    it('should include profile completeness check items', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test Therapist',
        Therapist: completeTherapist,
      })

      const request = new Request('http://localhost:3000/api/compliance/checklist')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      const profileChecks = data.checklist.filter(
        (item: any) => item.category === 'PROFILE'
      )

      expect(profileChecks.length).toBeGreaterThan(0)
      expect(profileChecks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'PROFILE',
            item: expect.any(String),
            status: expect.stringMatching(/COMPLETE|INCOMPLETE/),
          }),
        ])
      )
    })

    it('should include tax validation status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test Therapist',
        Therapist: completeTherapist,
      })

      const request = new Request('http://localhost:3000/api/compliance/checklist')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.taxValidation).toMatchObject({
        completed: true,
        validatedAt: expect.any(String),
        message: expect.any(String),
      })
    })

    it('should include revenue status summary', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test Therapist',
        Therapist: completeTherapist,
      })

      const request = new Request('http://localhost:3000/api/compliance/checklist')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.revenueStatus).toMatch(/SAFE|WARNING|EXCEEDED|CRITICAL/)
      expect(data.revenuePercentage).toBeGreaterThanOrEqual(0)
      expect(data.revenuePercentage).toBeLessThanOrEqual(200)
    })

    it('should flag profile as incomplete if missing required fields', async () => {
      const partialTherapist = {
        ...completeTherapist,
        businessEmail: null, // Missing required field
        businessPhone: null, // Missing required field
      }

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test Therapist',
        Therapist: partialTherapist,
      })

      const request = new Request('http://localhost:3000/api/compliance/checklist')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.profileComplete).toBe(false)

      const missingItems = data.checklist.filter(
        (item: any) => item.status === 'INCOMPLETE'
      )
      expect(missingItems.length).toBeGreaterThan(0)
    })

    it('should calculate score based on completed items', async () => {
      const partialTherapist = {
        ...completeTherapist,
        taxValidationCompleted: false,
        taxValidatedAt: null,
        iban: null,
      }

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test Therapist',
        Therapist: partialTherapist,
      })

      const request = new Request('http://localhost:3000/api/compliance/checklist')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      // Score should be between 0-100
      expect(data.overallScore).toBeGreaterThanOrEqual(0)
      expect(data.overallScore).toBeLessThanOrEqual(100)

      // With some incomplete items, score should be partial
      expect(data.overallScore).toBeGreaterThan(30)
      expect(data.overallScore).toBeLessThan(80)
    })

    it('should return warning alerts for approaching threshold', async () => {
      const highRevenueTherapist = {
        ...completeTherapist,
        annualGrossCents: 5000000, // €50k (approaching €55k threshold)
      }

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test Therapist',
        Therapist: highRevenueTherapist,
      })

      const request = new Request('http://localhost:3000/api/compliance/checklist')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.revenueStatus).toBe('WARNING')
      expect(data.alerts).toBeDefined()
      expect(data.alerts.length).toBeGreaterThan(0)
    })

    it('should highlight validation as pending if not completed', async () => {
      const unvalidatedTherapist = {
        ...completeTherapist,
        taxValidationCompleted: false,
        taxValidatedAt: null,
      }

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test Therapist',
        Therapist: unvalidatedTherapist,
      })

      const request = new Request('http://localhost:3000/api/compliance/checklist')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.taxValidation.completed).toBe(false)
      expect(data.taxValidation.validatedAt).toBeNull()
      expect(data.taxValidation.message).toContain('pending')
    })

    it('should return unauthorized if no session', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/compliance/checklist')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 404 if therapist not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: null,
      })

      const request = new Request('http://localhost:3000/api/compliance/checklist')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Therapist not found')
    })

    it('should include action items for incomplete checklist', async () => {
      const incompleteTherapist = {
        ...completeTherapist,
        businessEmail: null,
        iban: null,
        taxValidationCompleted: false,
      }

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test Therapist',
        Therapist: incompleteTherapist,
      })

      const request = new Request('http://localhost:3000/api/compliance/checklist')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.actionItems).toBeDefined()
      expect(Array.isArray(data.actionItems)).toBe(true)

      // Action items only include required incomplete items
      const incompleteRequiredItems = data.checklist.filter(
        (item: any) => item.status === 'INCOMPLETE' && item.required
      )
      expect(data.actionItems.length).toBe(incompleteRequiredItems.length)
    })

    it('should include completion percentage for each category', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test Therapist',
        Therapist: completeTherapist,
      })

      const request = new Request('http://localhost:3000/api/compliance/checklist')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.categoryScores).toBeDefined()
      expect(data.categoryScores.PROFILE).toBeGreaterThanOrEqual(0)
      expect(data.categoryScores.PROFILE).toBeLessThanOrEqual(100)
      expect(data.categoryScores.TAX).toBeGreaterThanOrEqual(0)
      expect(data.categoryScores.TAX).toBeLessThanOrEqual(100)
    })
  })
})
