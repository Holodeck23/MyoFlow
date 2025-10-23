import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuth = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  user: {
    upsert: vi.fn()
  },
  therapist: {
    findUnique: vi.fn(),
    create: vi.fn()
  },
  service: {
    count: vi.fn(),
    create: vi.fn()
  },
  location: {
    count: vi.fn(),
    create: vi.fn()
  }
}))

vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: mockAuth,
    signIn: vi.fn(),
    signOut: vi.fn()
  }))
}))

vi.mock('../lib/auth', () => ({
  auth: mockAuth,
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn()
}))

vi.mock('@myoflow/db', () => ({
  prisma: mockPrisma,
  PrismaClient: vi.fn(() => mockPrisma),
  ServiceCategory: { MASSAGE: 'MASSAGE' },
  VatStatus: { KLEINUNTERNEHMER: 'KLEINUNTERNEHMER' },
  LocationType: { CLINIC: 'CLINIC' }
}))

import { ensureTherapistAccount } from '../lib/shared-helpers'

describe('ensureTherapistAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.user.upsert.mockResolvedValue({
      id: 'user-1',
      email: 'therapist@example.com'
    })
    mockPrisma.therapist.findUnique.mockResolvedValue({
      id: 'therapist-1',
      userId: 'user-1'
    })
    mockPrisma.service.count.mockResolvedValue(1)
    mockPrisma.location.count.mockResolvedValue(1)
  })

  it('creates default service and location when missing', async () => {
    mockPrisma.service.count.mockResolvedValue(0)
    mockPrisma.location.count.mockResolvedValue(0)

    await ensureTherapistAccount('therapist@example.com', 'Test Therapist')

    expect(mockPrisma.service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          therapistId: 'therapist-1',
          name: 'Klassische Massage 60min'
        })
      })
    )
    expect(mockPrisma.location.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          therapistId: 'therapist-1',
          name: 'Praxis Linz'
        })
      })
    )
  })

  it('does not recreate defaults when entries exist', async () => {
    await ensureTherapistAccount('therapist@example.com', 'Test Therapist')

    expect(mockPrisma.service.create).not.toHaveBeenCalled()
    expect(mockPrisma.location.create).not.toHaveBeenCalled()
  })
})
