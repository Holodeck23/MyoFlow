/**
 * Audit logging types
 *
 * NOTE: This interface is duplicated from @myoflow/db for package independence.
 * The canonical implementation with logAudit() function is in @myoflow/db/index.ts
 * Keep these in sync!
 */
export interface AuditLogEntry {
  actorUserId?: string
  therapistId: string
  entity: string
  entityId: string
  action: string
  ip?: string | null
  meta?: any
}
