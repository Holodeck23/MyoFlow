import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@myoflow/db'
import { z } from 'zod'
import {
  ensureTherapistAccount,
  requireTherapist,
  handleAuthErrors,
} from '@/lib/shared-helpers'
import {
  SERVICE_RATE_SELECT,
  buildServiceRateData,
  serializeServiceRate,
  serviceRateUpdateSchema,
} from '../shared'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return handleAuthErrors(async () => {
    const { therapist } = await requireTherapist()
    const serviceRate = await prisma.serviceRateTemplate.findFirst({
      where: {
        id: params.id,
        therapistId: therapist.id,
        isActive: true,
      },
      select: SERVICE_RATE_SELECT,
    })

    if (!serviceRate) {
      return NextResponse.json(
        { success: false, error: 'Service rate not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: serializeServiceRate(serviceRate),
    })
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { therapist } = await ensureTherapistAccount(request)
    const payload = (await request.json()) as unknown
    const parsed = serviceRateUpdateSchema.parse(payload)

    const existingRate = await prisma.serviceRateTemplate.findFirst({
      where: { id: params.id, therapistId: therapist.id },
    })

    if (!existingRate) {
      return NextResponse.json(
        { success: false, error: 'Service rate not found' },
        { status: 404 },
      )
    }

    const updateData = buildServiceRateData(parsed)

    const updatedRate = await prisma.$transaction(async (tx) => {
      if (parsed.isDefault) {
        const targetCategory = parsed.category ?? existingRate.category
        await tx.serviceRateTemplate.updateMany({
          where: {
            therapistId: therapist.id,
            category: targetCategory,
            isDefault: true,
            NOT: { id: existingRate.id },
          },
          data: { isDefault: false },
        })
      }

      const rate = await tx.serviceRateTemplate.update({
        where: { id: existingRate.id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        select: SERVICE_RATE_SELECT,
      })

      await tx.therapist.update({
        where: { id: therapist.id },
        data: {
          settingsLastUpdated: new Date(),
          settingsVersion: { increment: 1 },
        },
      })

      return rate
    })

    return NextResponse.json({
      success: true,
      data: serializeServiceRate(updatedRate),
      message: 'Service rate updated successfully',
    })
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten() },
        { status: 400 },
      )
    }

    console.error('Service rate update failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update service rate' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { therapist } = await ensureTherapistAccount(request)

    const existingRate = await prisma.serviceRateTemplate.findFirst({
      where: { id: params.id, therapistId: therapist.id },
    })

    if (!existingRate) {
      return NextResponse.json(
        { success: false, error: 'Service rate not found' },
        { status: 404 },
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.serviceRateTemplate.update({
        where: { id: existingRate.id },
        data: {
          isActive: false,
          isDefault: false,
          updatedAt: new Date(),
        },
      })

      await tx.therapist.update({
        where: { id: therapist.id },
        data: {
          settingsLastUpdated: new Date(),
          settingsVersion: { increment: 1 },
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Service rate archived successfully',
    })
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }

    console.error('Service rate deletion failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete service rate' },
      { status: 500 },
    )
  }
}
