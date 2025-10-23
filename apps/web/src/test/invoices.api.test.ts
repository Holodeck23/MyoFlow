import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const mockAuth = vi.hoisted(() => vi.fn())
const mockEnsureTherapistAccount = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  invoice: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  therapist: {
    findUnique: vi.fn(),
  },
  client: {
    findFirst: vi.fn(),
  },
  appointment: {
    findFirst: vi.fn(),
  },
}))

vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: mockAuth,
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
  getServerSession: vi.fn(),
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

vi.mock('@/lib/shared-helpers', () => ({
  ensureTherapistAccount: mockEnsureTherapistAccount,
  requireTherapist: vi.fn(),
}))

import { POST } from '../../app/api/invoices/route'

describe('Invoice API service date validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const mockSession = {
      user: {
        email: 'therapist@example.com',
        name: 'Test Therapist',
      },
    }

    mockAuth.mockResolvedValue(mockSession)
    mockEnsureTherapistAccount.mockResolvedValue({
      therapist: {
        id: 'therapist-1',
        kleinunternehmer: true,
        businessAddress: 'Landstraße 1, 4020 Linz',
        uidNumber: null,
        User: {
          name: 'Therapist One',
        },
      },
      user: {
        id: 'user-1',
        name: 'Therapist One',
      },
    })

    mockPrisma.therapist.findUnique.mockResolvedValue({
      id: 'therapist-1',
      kleinunternehmer: true,
      businessAddress: 'Landstraße 1, 4020 Linz',
      uidNumber: null,
      User: {
        name: 'Therapist One',
      },
    })

    mockPrisma.client.findFirst.mockResolvedValue({
      id: 'cjld2cjxh0000qzrmn831i7rn',
      name: 'Client One',
      email: 'client@example.com',
      street: 'Ringstraße 5',
      postalCode: '1010',
      city: 'Wien',
      country: 'Austria',
    })

    mockPrisma.invoice.findFirst.mockResolvedValue(null)
    mockPrisma.invoice.create.mockResolvedValue({
      id: 'invoice-1',
      therapistId: 'therapist-1',
      clientId: 'cjld2cjxh0000qzrmn831i7rn',
      appointmentId: null,
      number: '2025-001',
      status: 'DRAFT',
      lines: [],
      totalGrossCents: 8000,
      vatBreakdown: {},
      kleinunternehmer: true,
      Client: {
        id: 'cjld2cjxh0000qzrmn831i7rn',
        name: 'Client One',
        email: 'client@example.com',
      },
      Appointment: null,
    })

    mockPrisma.appointment.findFirst.mockResolvedValue(null)
  })

  it('rejects invoices with future service date', async () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 2)

    const request = new Request('http://localhost:3000/api/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: 'cjld2cjxh0000qzrmn831i7rn',
        lines: [
          {
            description: 'Therapieeinheit',
            quantity: 1,
            unitPriceCents: 8000,
            vatRate: 'KLEINUNTERNEHMER',
          },
        ],
        serviceDate: futureDate.toISOString(),
      }),
    })

    const response = await POST(request as unknown as NextRequest)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('future')
    expect(mockPrisma.invoice.create).not.toHaveBeenCalled()
  })
})
