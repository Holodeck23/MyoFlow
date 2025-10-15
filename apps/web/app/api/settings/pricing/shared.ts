import { ServiceCategory, VatStatus } from '@myoflow/db'
import { z } from 'zod'

export const SERVICE_RATE_SELECT = {
  id: true,
  therapistId: true,
  name: true,
  category: true,
  durationMin: true,
  priceCents: true,
  vatRate: true,
  description: true,
  isDefault: true,
  travelRateCents: true,
  travelIncluded: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const

export const serviceRateCreateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Service name is required')
      .max(200, 'Service name must be 200 characters or fewer'),
    category: z.nativeEnum(ServiceCategory),
    durationMin: z
      .number()
      .int()
      .min(15, 'Duration must be at least 15 minutes')
      .max(480, 'Duration cannot exceed 480 minutes'),
    priceCents: z
      .number()
      .int()
      .min(500, 'Price must be at least €5.00')
      .max(50_000, 'Price cannot exceed €500.00'),
    vatRate: z.nativeEnum(VatStatus),
    description: z
      .string()
      .trim()
      .max(500, 'Description must be 500 characters or fewer')
      .nullable()
      .optional(),
    isDefault: z.boolean().optional(),
    travelRateCents: z
      .number()
      .int()
      .min(0)
      .max(10_000, 'Travel rate cannot exceed €100')
      .nullable()
      .optional(),
    travelIncluded: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()

export const serviceRateUpdateSchema = serviceRateCreateSchema
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least one field to update',
      })
    }
  })

export type ServiceRateCreateInput = z.infer<typeof serviceRateCreateSchema>
export type ServiceRateUpdateInput = z.infer<typeof serviceRateUpdateSchema>

export function buildServiceRateData(payload: Partial<ServiceRateCreateInput>) {
  const data: Record<string, unknown> = {}

  if (payload.name !== undefined) data.name = payload.name.trim()
  if (payload.category !== undefined) data.category = payload.category
  if (payload.durationMin !== undefined) data.durationMin = payload.durationMin
  if (payload.priceCents !== undefined) data.priceCents = payload.priceCents
  if (payload.vatRate !== undefined) data.vatRate = payload.vatRate
  if (payload.description !== undefined) {
    const trimmed = payload.description?.trim()
    data.description = trimmed && trimmed.length > 0 ? trimmed : null
  }
  if (payload.isDefault !== undefined) data.isDefault = payload.isDefault
  if (payload.travelRateCents !== undefined) data.travelRateCents = payload.travelRateCents
  if (payload.travelIncluded !== undefined) data.travelIncluded = payload.travelIncluded
  if (payload.isActive !== undefined) data.isActive = payload.isActive

  return data
}

export function serializeServiceRate(rate: any) {
  return {
    id: rate.id,
    therapistId: rate.therapistId,
    name: rate.name,
    category: rate.category,
    durationMin: rate.durationMin,
    priceCents: rate.priceCents,
    vatRate: rate.vatRate,
    description: rate.description ?? null,
    isDefault: rate.isDefault ?? false,
    travelRateCents: rate.travelRateCents ?? null,
    travelIncluded: Boolean(rate.travelIncluded),
    isActive: rate.isActive ?? true,
    createdAt: rate.createdAt ? rate.createdAt.toISOString() : null,
    updatedAt: rate.updatedAt ? rate.updatedAt.toISOString() : null,
    isDefaultData: false,
  }
}

export function getDefaultServiceRates(therapistId: string) {
  return [
    {
      id: null,
      therapistId,
      name: 'Klassische Massage 60min',
      category: 'MASSAGE',
      durationMin: 60,
      priceCents: 8000,
      vatRate: 'KLEINUNTERNEHMER',
      description: 'Standard full-body massage treatment',
      isDefault: true,
      travelRateCents: 80,
      travelIncluded: false,
      isActive: true,
      isDefaultData: true,
    },
    {
      id: null,
      therapistId,
      name: 'Entspannungsmassage 45min',
      category: 'MASSAGE',
      durationMin: 45,
      priceCents: 6500,
      vatRate: 'KLEINUNTERNEHMER',
      description: 'Relaxation massage for stress relief',
      isDefault: false,
      travelRateCents: 80,
      travelIncluded: false,
      isActive: true,
      isDefaultData: true,
    },
    {
      id: null,
      therapistId,
      name: 'Triggerpunkt-Therapie 45min',
      category: 'MASSAGE',
      durationMin: 45,
      priceCents: 7500,
      vatRate: 'KLEINUNTERNEHMER',
      description: 'Targeted trigger point therapy',
      isDefault: false,
      travelRateCents: 80,
      travelIncluded: false,
      isActive: true,
      isDefaultData: true,
    },
  ]
}
