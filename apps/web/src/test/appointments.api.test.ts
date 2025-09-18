import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const mockGetServerSession = vi.hoisted(() => vi.fn())
const mockPrisma = vi.hoisted(() => ({
  user: {
    upsert: vi.fn(),
  },
  therapist: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  client: {
    findFirst: vi.fn(),
  },
  service: {
    findFirst: vi.fn(),
  },
  location: {
    findFirst: vi.fn(),
  },
  appointment: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  appointmentReminder: {
    deleteMany: vi.fn(),
  },
}))

vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}))

vi.mock('@myoflow/db', () => ({
  prisma: mockPrisma,
}))

import { POST } from '../../app/api/appointments/route'
import { PUT } from '../../app/api/appointments/[id]/route'

describe('Appointment API time validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetServerSession.mockResolvedValue({
      user: {
        email: 'therapist@example.com',
        name: 'Therapist',
      },
    })

    mockPrisma.user.upsert.mockResolvedValue({ id: 'user-1' })
    mockPrisma.therapist.findUnique.mockResolvedValue({ id: 'therapist-1' })
    mockPrisma.therapist.create.mockResolvedValue({ id: 'therapist-1' })
    mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-1' })
    mockPrisma.service.findFirst.mockResolvedValue({ id: 'service-1' })
    mockPrisma.location.findFirst.mockResolvedValue({ id: 'location-1' })
    mockPrisma.appointment.findFirst.mockResolvedValue(null)
    const baseAppointment = {
      id: 'appointment-1',
      therapistId: 'therapist-1',
      clientId: 'client-1',
      serviceId: 'service-1',
      locationId: 'location-1',
      start: new Date('2025-01-01T09:00:00.000Z'),
      end: new Date('2025-01-01T10:00:00.000Z'),
      status: 'BOOKED',
      notes: null,
      recurrenceEnd: null,
      recurrenceId: null,
      recurrenceType: 'NONE',
      estimatedTravelTimeMin: null,
      travelDistanceKm: null,
      travelCostCents: null,
      requiresTravelBuffer: false,
    }
    mockPrisma.appointment.create.mockResolvedValue(baseAppointment)
    mockPrisma.appointment.update.mockResolvedValue({
      ...baseAppointment,
      start: new Date('2025-01-01T10:30:00.000Z'),
      end: new Date('2025-01-01T11:30:00.000Z'),
    })
  })

  it('rejects appointment creation when end is not after start', async () => {
    const request = {
      json: async () => ({
        clientId: 'cjld2cjxh0000qzrmn831i7rn',
        serviceId: 'cjld2cjxh0000qzrmn831i7rp',
        locationId: 'cjld2cjxh0000qzrmn831i7rq',
        start: '2025-01-01T10:00:00.000Z',
        end: '2025-01-01T09:30:00.000Z',
      }),
      url: 'http://localhost/api/appointments',
    } as unknown as NextRequest

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('after start time')
    expect(mockPrisma.client.findFirst).not.toHaveBeenCalled()
    expect(mockPrisma.appointment.create).not.toHaveBeenCalled()
  })

  it('rejects appointment update when new end is not after start', async () => {
    const existingAppointment = {
      id: 'appointment-1',
      therapistId: 'therapist-1',
      clientId: 'client-1',
      serviceId: 'service-1',
      locationId: 'location-1',
      start: new Date('2025-01-01T09:00:00.000Z'),
      end: new Date('2025-01-01T10:00:00.000Z'),
      status: 'BOOKED',
      notes: null,
      recurrenceEnd: null,
      recurrenceId: null,
      recurrenceType: 'NONE',
      estimatedTravelTimeMin: null,
      travelDistanceKm: null,
      travelCostCents: null,
      requiresTravelBuffer: false,
    }

    mockPrisma.appointment.findFirst
      .mockResolvedValueOnce(existingAppointment)
      .mockResolvedValueOnce(null)

    const request = {
      json: async () => ({
        start: '2025-01-01T10:30:00.000Z',
        end: '2025-01-01T10:00:00.000Z',
      }),
      url: 'http://localhost/api/appointments/appointment-1',
    } as unknown as NextRequest

    const response = await PUT(request, { params: { id: 'appointment-1' } })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('after start time')
    expect(mockPrisma.appointment.update).not.toHaveBeenCalled()
  })
})
