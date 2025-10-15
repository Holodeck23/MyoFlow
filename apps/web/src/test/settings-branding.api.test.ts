import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const mockAuth = vi.hoisted(() => vi.fn())
const mockGetServerSession = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  therapist: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
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

import { GET, PUT } from '../../app/api/settings/invoice-branding/route'

describe('Invoice Branding Settings API', () => {
  const mockTherapist = {
    id: 'therapist-1',
    invoiceLogoUrl: null,
    invoiceDisplayPreference: 'NAME',
    invoiceThankYouMessage: null,
    brandColor: '#0066cc',
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

  describe('GET /api/settings/invoice-branding', () => {
    it('should return current branding settings', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: mockTherapist,
      })

      const request = new Request('http://localhost:3000/api/settings/invoice-branding')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toMatchObject({
        invoiceLogoUrl: null,
        invoiceDisplayPreference: 'NAME',
        invoiceThankYouMessage: null,
        brandColor: '#0066cc',
      })
    })

    it('should return unauthorized if no session', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/settings/invoice-branding')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Unauthorized')
    })

    it('should return 404 if therapist not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: null,
      })

      const request = new Request('http://localhost:3000/api/settings/invoice-branding')
      const response = await GET(request as NextRequest)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Therapist not found')
    })
  })

  describe('PUT /api/settings/invoice-branding', () => {
    beforeEach(() => {
      mockPrisma.user.upsert.mockResolvedValue({
        id: 'user-1',
        Therapist: mockTherapist,
      })
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: mockTherapist,
      })
    })

    it('should update logo URL', async () => {
      const updateData = {
        invoiceLogoUrl: 'https://example.com/logo.png',
      }

      mockPrisma.therapist.update.mockResolvedValue({
        ...mockTherapist,
        ...updateData,
      })

      const request = new Request('http://localhost:3000/api/settings/invoice-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.invoiceLogoUrl).toBe('https://example.com/logo.png')
      expect(mockPrisma.therapist.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'therapist-1' },
          data: { invoiceLogoUrl: 'https://example.com/logo.png' },
        })
      )
    })

    it('should update display preference', async () => {
      const updateData = {
        invoiceDisplayPreference: 'LOGO',
      }

      mockPrisma.therapist.update.mockResolvedValue({
        ...mockTherapist,
        invoiceDisplayPreference: 'LOGO',
      })

      const request = new Request('http://localhost:3000/api/settings/invoice-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.invoiceDisplayPreference).toBe('LOGO')
    })

    it('should update thank you message', async () => {
      const updateData = {
        invoiceThankYouMessage: 'Vielen Dank für Ihr Vertrauen!',
      }

      mockPrisma.therapist.update.mockResolvedValue({
        ...mockTherapist,
        invoiceThankYouMessage: 'Vielen Dank für Ihr Vertrauen!',
      })

      const request = new Request('http://localhost:3000/api/settings/invoice-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.invoiceThankYouMessage).toBe('Vielen Dank für Ihr Vertrauen!')
    })

    it('should update multiple fields at once', async () => {
      const updateData = {
        invoiceLogoUrl: 'https://cdn.example.com/therapist-logo.jpg',
        invoiceDisplayPreference: 'BOTH',
        invoiceThankYouMessage: 'Herzlichen Dank!',
      }

      mockPrisma.therapist.update.mockResolvedValue({
        ...mockTherapist,
        ...updateData,
      })

      const request = new Request('http://localhost:3000/api/settings/invoice-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toMatchObject(updateData)
    })

    it('should reject invalid display preference', async () => {
      const updateData = {
        invoiceDisplayPreference: 'INVALID',
      }

      const request = new Request('http://localhost:3000/api/settings/invoice-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request as NextRequest)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid')
    })

    it('should reject invalid logo URL format', async () => {
      const updateData = {
        invoiceLogoUrl: 'not-a-url',
      }

      const request = new Request('http://localhost:3000/api/settings/invoice-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request as NextRequest)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid branding settings')
      expect(data.details).toBeDefined()
      expect(JSON.stringify(data.details)).toContain('URL')
    })

    it('should allow clearing logo URL', async () => {
      const updateData = {
        invoiceLogoUrl: null,
      }

      mockPrisma.therapist.update.mockResolvedValue({
        ...mockTherapist,
        invoiceLogoUrl: null,
      })

      const request = new Request('http://localhost:3000/api/settings/invoice-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.invoiceLogoUrl).toBeNull()
    })

    it('should allow clearing thank you message', async () => {
      const updateData = {
        invoiceThankYouMessage: null,
      }

      mockPrisma.therapist.update.mockResolvedValue({
        ...mockTherapist,
        invoiceThankYouMessage: null,
      })

      const request = new Request('http://localhost:3000/api/settings/invoice-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request as NextRequest)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.invoiceThankYouMessage).toBeNull()
    })

    it('should reject thank you message over 500 characters', async () => {
      const updateData = {
        invoiceThankYouMessage: 'A'.repeat(501),
      }

      const request = new Request('http://localhost:3000/api/settings/invoice-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request as NextRequest)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid branding settings')
      expect(data.details).toBeDefined()
      expect(JSON.stringify(data.details)).toContain('500')
    })

    it('should return unauthorized if no session', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/settings/invoice-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceLogoUrl: 'https://example.com/logo.png' }),
      })

      const response = await PUT(request as NextRequest)

      expect(response.status).toBe(401)
    })

    it('should return 404 if therapist not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        Therapist: null,
      })

      const request = new Request('http://localhost:3000/api/settings/invoice-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceLogoUrl: 'https://example.com/logo.png' }),
      })

      const response = await PUT(request as NextRequest)

      expect(response.status).toBe(404)
    })

    it('should handle empty request body', async () => {
      const request = new Request('http://localhost:3000/api/settings/invoice-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await PUT(request as NextRequest)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('No fields')
    })

    it('should ignore unknown fields', async () => {
      const updateData = {
        invoiceLogoUrl: 'https://example.com/logo.png',
        unknownField: 'should be ignored',
      }

      mockPrisma.therapist.update.mockResolvedValue({
        ...mockTherapist,
        invoiceLogoUrl: 'https://example.com/logo.png',
      })

      const request = new Request('http://localhost:3000/api/settings/invoice-branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request as NextRequest)

      expect(response.status).toBe(200)

      // Verify only valid fields were passed to update
      expect(mockPrisma.therapist.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'therapist-1' },
          data: { invoiceLogoUrl: 'https://example.com/logo.png' },
        })
      )
    })
  })
})
