import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'

// Validation schemas
const UpdateAppointmentSchema = z.object({
  clientId: z.string().cuid().optional(),
  serviceId: z.string().cuid().optional(),
  locationId: z.string().cuid().optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  status: z.enum(['BOOKED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
})

async function getTherapistId(): Promise<string> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  // Find or create user and therapist using email as unique identifier
  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {
      name: session.user.name || session.user.email || 'Unknown User',
    },
    create: {
      email: session.user.email,
      name: session.user.name || session.user.email || 'Unknown User',
    },
  })

  let therapist = await prisma.therapist.findUnique({
    where: { userId: user.id },
  })

  if (!therapist) {
    // Create therapist with Austrian defaults
    therapist = await prisma.therapist.create({
      data: {
        userId: user.id,
        slug: `therapist-${user.id}`,
        designation: 'HEILMASSEUR',
        vatStatus: 'KLEINUNTERNEHMER',
        kleinunternehmer: true,
      },
    })
  }

  return therapist.id
}

// GET /api/appointments/[id] - Get single appointment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const therapistId = await getTherapistId()
    const appointmentId = params.id

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        therapistId,
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
        Reminders: {
          orderBy: {
            scheduledFor: 'asc',
          },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    )
  }
}

// PUT /api/appointments/[id] - Update appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const therapistId = await getTherapistId()
    const appointmentId = params.id
    const body = await request.json()
    
    const validation = UpdateAppointmentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid appointment data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if appointment exists and belongs to therapist
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        therapistId,
      },
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // If updating client, verify it belongs to therapist
    if (data.clientId) {
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
    }

    // If updating service, verify it belongs to therapist and is active
    if (data.serviceId) {
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
    }

    // If updating location, verify it belongs to therapist
    if (data.locationId) {
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
    }

    // Check for conflicts if updating time
    if (data.start || data.end) {
      const startDate = data.start ? new Date(data.start) : existingAppointment.start
      const endDate = data.end ? new Date(data.end) : existingAppointment.end

      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          therapistId,
          id: { not: appointmentId }, // Exclude current appointment
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
    }

    // Update the appointment
    const updateData: any = { ...data }
    if (data.start) updateData.start = new Date(data.start)
    if (data.end) updateData.end = new Date(data.end)

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
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

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}

// DELETE /api/appointments/[id] - Delete appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const therapistId = await getTherapistId()
    const appointmentId = params.id

    // Check if appointment exists and belongs to therapist
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        therapistId,
      },
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Delete associated reminders first
    await prisma.appointmentReminder.deleteMany({
      where: { appointmentId },
    })

    // Delete the appointment
    await prisma.appointment.delete({
      where: { id: appointmentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    )
  }
}