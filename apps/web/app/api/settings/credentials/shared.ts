import {
  CredentialStatus,
  CredentialType,
  CredentialVerificationStatus,
} from '@myoflow/db'
import { z } from 'zod'

export const CREDENTIAL_SELECT = {
  id: true,
  therapistId: true,
  credentialType: true,
  title: true,
  issuingAuthority: true,
  credentialNumber: true,
  specialization: true,
  issueDate: true,
  expirationDate: true,
  renewalRequired: true,
  status: true,
  verificationUrl: true,
  verificationStatus: true,
  documentStorageKey: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const

export const credentialCreateSchema = z
  .object({
    credentialType: z.nativeEnum(CredentialType),
    title: z
      .string()
      .trim()
      .min(2, 'Title must be at least 2 characters')
      .max(200, 'Title must be 200 characters or fewer'),
    issuingAuthority: z
      .string()
      .trim()
      .min(2, 'Issuing authority must be at least 2 characters')
      .max(200, 'Issuing authority must be 200 characters or fewer'),
    credentialNumber: z
      .string()
      .trim()
      .max(100, 'Credential number must be 100 characters or fewer')
      .nullable()
      .optional(),
    specialization: z
      .string()
      .trim()
      .max(200, 'Specialization must be 200 characters or fewer')
      .nullable()
      .optional(),
    issueDate: z.string().datetime('Issue date must be a valid ISO date'),
    expirationDate: z.string().datetime().nullable().optional(),
    renewalRequired: z.boolean().optional(),
    status: z.nativeEnum(CredentialStatus).optional(),
    verificationUrl: z
      .string()
      .trim()
      .url('Verification URL must be a valid link')
      .nullable()
      .optional(),
    verificationStatus: z.nativeEnum(CredentialVerificationStatus).optional(),
    notes: z
      .string()
      .trim()
      .max(1000, 'Notes must be 1000 characters or fewer')
      .nullable()
      .optional(),
  })
  .strict()

export const credentialUpdateSchema = credentialCreateSchema
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least one field to update',
      })
    }
  })

export type CredentialCreateInput = z.infer<typeof credentialCreateSchema>
export type CredentialUpdateInput = z.infer<typeof credentialUpdateSchema>

function normalizeNullableString(value: string | null | undefined) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

export function buildCredentialData(payload: Partial<CredentialCreateInput>) {
  const data: Record<string, unknown> = {}

  if (payload.credentialNumber !== undefined) {
    data.credentialNumber = normalizeNullableString(payload.credentialNumber)
  }
  if (payload.specialization !== undefined) {
    data.specialization = normalizeNullableString(payload.specialization)
  }
  if (payload.issueDate !== undefined) {
    data.issueDate = new Date(payload.issueDate)
  }
  if (payload.expirationDate !== undefined) {
    data.expirationDate = payload.expirationDate ? new Date(payload.expirationDate) : null
  }
  if (payload.renewalRequired !== undefined) {
    data.renewalRequired = payload.renewalRequired
  }
  if (payload.status !== undefined) {
    data.status = payload.status
  }
  if (payload.verificationUrl !== undefined) {
    data.verificationUrl = normalizeNullableString(payload.verificationUrl)
  }
  if (payload.verificationStatus !== undefined) {
    data.verificationStatus = payload.verificationStatus
  }
  if (payload.notes !== undefined) {
    data.notes = normalizeNullableString(payload.notes)
  }

  return data
}

export function serializeCredential(credential: any) {
  return {
    id: credential.id,
    therapistId: credential.therapistId,
    credentialType: credential.credentialType,
    title: credential.title,
    issuingAuthority: credential.issuingAuthority,
    credentialNumber: credential.credentialNumber ?? null,
    specialization: credential.specialization ?? null,
    issueDate: credential.issueDate ? credential.issueDate.toISOString() : null,
    expirationDate: credential.expirationDate ? credential.expirationDate.toISOString() : null,
    renewalRequired: Boolean(credential.renewalRequired),
    status: credential.status ?? 'ACTIVE',
    verificationUrl: credential.verificationUrl ?? null,
    verificationStatus: credential.verificationStatus ?? 'UNVERIFIED',
    documentStorageKey: credential.documentStorageKey ?? null,
    notes: credential.notes ?? null,
    createdAt: credential.createdAt ? credential.createdAt.toISOString() : null,
    updatedAt: credential.updatedAt ? credential.updatedAt.toISOString() : null,
  }
}
