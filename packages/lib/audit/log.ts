// Audit logging types - no Prisma dependency in shared package
export interface AuditLogEntry {
  actorUserId?: string
  therapistId: string
  entity: string
  entityId: string
  action: string
  ip?: string | null
  meta?: any
}

// Note: logAudit implementation moved to API routes
// Use: POST /api/audit with AuditLogEntry data
