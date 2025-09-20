import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@myoflow/db'
import { z } from 'zod'

const updateSchema = z.object({
  language: z.enum(['EN', 'DE']).optional(),
  timezone: z.string().max(50).optional(),
  currency: z.enum(['EUR', 'USD', 'CHF']).optional(),
  dateFormat: z.enum(['DD.MM.YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
  appointmentReminderDays: z.number().int().min(0).max(30).optional(),
  enableEmailNotifications: z.boolean().optional(),
  enableSmsNotifications: z.boolean().optional(),
  enableComplianceAlerts: z.boolean().optional(),
  enableTravelAlerts: z.boolean().optional(),
})

async function authenticate(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    throw new Response('Unauthorized', { status: 401 })
  }

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {
      name: session.user.name || session.user.email || 'Therapist',
    },
    create: {
      email: session.user.email,
      name: session.user.name || session.user.email || 'Therapist',
      role: 'OWNER',
    },
  })

  const therapist = await prisma.therapist.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      slug: session.user.email?.split('@')[0] || `therapist-${user.id}`,
      designation: 'HEILMASSEUR',
      vatStatus: 'KLEINUNTERNEHMER',
    },
  })

  return therapist.id
}

export async function GET(request: NextRequest) {
  try {
    const therapistId = await authenticate(request)

    const preferences = await prisma.userPreferences.findUnique({
      where: { therapistId },
    })

    if (!preferences) {
      // Create default preferences
      const defaults = await prisma.userPreferences.create({
        data: {
          therapistId,
          language: 'DE',
          timezone: 'Europe/Vienna',
          currency: 'EUR',
          dateFormat: 'DD.MM.YYYY',
          appointmentReminderDays: 1,
          enableEmailNotifications: true,
          enableSmsNotifications: false,
          enableComplianceAlerts: true,
          enableTravelAlerts: true,
        },
      })
      return NextResponse.json(defaults)
    }

    return NextResponse.json(preferences)
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    console.error('System settings fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch system settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const therapistId = await authenticate(request)
    const payload = await request.json()
    const parsed = updateSchema.parse(payload)

    // Ensure preferences exist
    await prisma.userPreferences.upsert({
      where: { therapistId },
      update: {},
      create: {
        therapistId,
        language: 'DE',
        timezone: 'Europe/Vienna',
        currency: 'EUR',
        dateFormat: 'DD.MM.YYYY',
        appointmentReminderDays: 1,
        enableEmailNotifications: true,
        enableSmsNotifications: false,
        enableComplianceAlerts: true,
        enableTravelAlerts: true,
      },
    })

    const updateData: any = {}

    // Map fields that can be updated directly
    if (parsed.language !== undefined) updateData.language = parsed.language
    if (parsed.timezone !== undefined) updateData.timezone = parsed.timezone
    if (parsed.currency !== undefined) updateData.currency = parsed.currency
    if (parsed.dateFormat !== undefined) updateData.dateFormat = parsed.dateFormat
    if (parsed.appointmentReminderDays !== undefined) updateData.appointmentReminderDays = parsed.appointmentReminderDays
    if (parsed.enableEmailNotifications !== undefined) updateData.enableEmailNotifications = parsed.enableEmailNotifications
    if (parsed.enableSmsNotifications !== undefined) updateData.enableSmsNotifications = parsed.enableSmsNotifications
    if (parsed.enableComplianceAlerts !== undefined) updateData.enableComplianceAlerts = parsed.enableComplianceAlerts
    if (parsed.enableTravelAlerts !== undefined) updateData.enableTravelAlerts = parsed.enableTravelAlerts

    const updated = await prisma.userPreferences.update({
      where: { therapistId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    })

    // Update therapist settings timestamp
    await prisma.therapist.update({
      where: { id: therapistId },
      data: {
        settingsLastUpdated: new Date(),
        settingsVersion: { increment: 1 },
      },
    })

    return NextResponse.json({ success: true, preferences: updated })
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('System settings update failed:', error)
    return NextResponse.json({ error: 'Failed to update system settings' }, { status: 500 })
  }
}