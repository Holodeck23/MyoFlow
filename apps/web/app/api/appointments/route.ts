import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'

// Validation schemas
const CreateAppointmentSchema = z.object({
  clientId: z.string().cuid(),
  serviceId: z.string().cuid(),
  locationId: z.string().cuid(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  notes: z.string().optional(),
  recurrenceType: z.enum(['NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']).default('NONE'),
  recurrenceEnd: z.string().datetime().optional(),
})

const AppointmentQuerySchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  clientId: z.string().cuid().optional(),
  status: z.enum(['BOOKED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
})

async function getTherapistId(session: any): Promise<string> {
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  // Find existing user by email (the reliable identifier)
  let user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    throw new Error('User not found in database')
  }

  // Find or create therapist profile
  let therapist = await prisma.therapist.upsert({
    where: { userId: user.id },
    update: {}, // Don't overwrite existing data on subsequent calls
    create: {
      userId: user.id,
      slug: `therapist-${user.id}`,
      designation: 'HEILMASSEUR',
      vatStatus: 'KLEINUNTERNEHMER',
      kleinunternehmer: true,
    },
  })

  return therapist.id
}

// GET /api/appointments - List appointments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const therapistId = await getTherapistId(session)
    const { searchParams } = new URL(request.url)
    
    const query = AppointmentQuerySchema.safeParse({
      start: searchParams.get('start') || undefined,
      end: searchParams.get('end') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      status: searchParams.get('status') || undefined,
    })

    if (!query.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: query.error.issues },
        { status: 400 }
      )
    }

    const where: any = {
      therapistId,
    }

    // Add date range filter
    if (query.data.start || query.data.end) {
      where.start = {}
      if (query.data.start) {
        where.start.gte = new Date(query.data.start)
      }
      if (query.data.end) {
        where.start.lte = new Date(query.data.end)
      }
    }

    // Add client filter
    if (query.data.clientId) {
      where.clientId = query.data.clientId
    }

    // Add status filter
    if (query.data.status) {
      where.status = query.data.status
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        Service: {
          select: {
            id: true,
            name: true,
            durationMin: true,
            priceCents: true,
            category: true,
          },
        },
        Location: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
          },
        },
      },
      orderBy: {
        start: 'asc',
      },
    })

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

// POST /api/appointments - Create appointment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const therapistId = await getTherapistId(session)
    const body = await request.json()
    
    const validation = CreateAppointmentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid appointment data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verify client belongs to therapist
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        therapistId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or access denied' },
        { status: 404 }
      )
    }

    // Verify service belongs to therapist
    const service = await prisma.service.findFirst({
      where: {
        id: data.serviceId,
        therapistId,
        active: true,
      },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found or inactive' },
        { status: 404 }
      )
    }

    // Verify location belongs to therapist
    const location = await prisma.location.findFirst({
      where: {
        id: data.locationId,
        therapistId,
      },
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found or access denied' },
        { status: 404 }
      )
    }

    // Check for appointment conflicts
    const startDate = new Date(data.start)
    const endDate = new Date(data.end)

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        therapistId,
        status: {
          in: ['BOOKED', 'COMPLETED'],
        },
        OR: [
          {
            start: {
              lt: endDate,
            },
            end: {
              gt: startDate,
            },
          },
        ],
      },
    })

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'Appointment time conflicts with existing appointment' },
        { status: 409 }
      )
    }

    // Create the appointment
    const recurrenceId = data.recurrenceType !== 'NONE' ? `rec-${Date.now()}` : null

    const appointment = await prisma.appointment.create({
      data: {
        therapistId,
        clientId: data.clientId,
        serviceId: data.serviceId,
        locationId: data.locationId,
        start: startDate,
        end: endDate,
        notes: data.notes,
        recurrenceType: data.recurrenceType,
        recurrenceId,
        recurrenceEnd: data.recurrenceEnd ? new Date(data.recurrenceEnd) : null,
      },
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        Service: {
          select: {
            id: true,
            name: true,
            durationMin: true,
            priceCents: true,
            category: true,
          },
        },
        Location: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
          },
        },
      },
    })

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}