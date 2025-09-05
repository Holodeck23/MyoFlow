import { prisma, type AuditLog, type Role } from '@myoflow/db';

type AuditLogInput = {
  actorUserId?: string;
  therapistId: string;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'SECURITY';
  ip?: string;
  meta?: Record<string, any>;
};

/**
 * Creates an audit log entry.
 */
export async function createAuditLog(
  input: AuditLogInput
): Promise<AuditLog> {
  return prisma.auditLog.create({
    data: {
      ...input,
      meta: input.meta || undefined,
    },
  });
}

