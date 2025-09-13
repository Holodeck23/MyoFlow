import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuditLogEntry {
  actorUserId?: string
  therapistId: string
  entity: string
  entityId: string
  action: string
  ip?: string | null
  meta?: any
}

export async function logAudit(entry: AuditLogEntry) {
  return prisma.auditLog.create({
    data: {
      ...entry,
      ip: entry.ip || undefined,
      meta: entry.meta || undefined
    }
  })
}
