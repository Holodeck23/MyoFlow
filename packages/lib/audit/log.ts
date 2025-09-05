import { PrismaClient } from '@myoflow/db'

const prisma = new PrismaClient()

export interface AuditContext {
  actorUserId?: string
  therapistId: string
  ip?: string
}

export async function auditLog(
  context: AuditContext,
  entity: string,
  entityId: string,
  action: string,
  meta?: Record<string, any>
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: context.actorUserId,
        therapistId: context.therapistId,
        entity,
        entityId,
        action,
        ip: context.ip,
        meta: meta || null,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

export async function auditRead(
  context: AuditContext,
  entity: string,
  entityId: string,
  meta?: Record<string, any>
) {
  return auditLog(context, entity, entityId, 'READ', meta)
}

export async function auditCreate(
  context: AuditContext,
  entity: string,
  entityId: string,
  meta?: Record<string, any>
) {
  return auditLog(context, entity, entityId, 'CREATE', meta)
}

export async function auditUpdate(
  context: AuditContext,
  entity: string,
  entityId: string,
  meta?: Record<string, any>
) {
  return auditLog(context, entity, entityId, 'UPDATE', meta)
}

export async function auditDelete(
  context: AuditContext,
  entity: string,
  entityId: string,
  meta?: Record<string, any>
) {
  return auditLog(context, entity, entityId, 'DELETE', meta)
}