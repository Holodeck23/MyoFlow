export type UserRole = 'OWNER' | 'STAFF' | 'ACCOUNTANT' | 'AFFILIATE'

export function hasRole(role: UserRole | undefined, allowed: UserRole[]): boolean {
  if (!role) return false
  return allowed.includes(role)
}

export function requireRole(role: UserRole | undefined, allowed: UserRole[]): void {
  if (!hasRole(role, allowed)) {
    throw new Error('Forbidden')
  }
}
