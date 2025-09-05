import { Role } from '@myoflow/db'

export interface UserContext {
  id: string
  role: Role
  therapistId?: string
}

export function canReadEncryptedData(user: UserContext): boolean {
  return user.role !== Role.ACCOUNTANT
}

export function canAccessFinancials(user: UserContext): boolean {
  return [Role.OWNER, Role.ACCOUNTANT].includes(user.role)
}

export function canManageClients(user: UserContext): boolean {
  return [Role.OWNER, Role.STAFF].includes(user.role)
}

export function canManageAppointments(user: UserContext): boolean {
  return [Role.OWNER, Role.STAFF].includes(user.role)
}

export function canViewAffiliateEarnings(user: UserContext, affiliateId?: string): boolean {
  if (user.role === Role.OWNER) return true
  if (user.role === Role.AFFILIATE) {
    return user.id === affiliateId
  }
  return false
}

export function requirePermission(user: UserContext, permission: (user: UserContext) => boolean) {
  if (!permission(user)) {
    throw new Error('Insufficient permissions')
  }
}

export function requireOwnerRole(user: UserContext) {
  if (user.role !== Role.OWNER) {
    throw new Error('Owner role required')
  }
}