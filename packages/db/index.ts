import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export * from '@prisma/client'

// Audit logging functionality
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