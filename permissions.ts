import { type Role } from '@myoflow/db';

// Simple RBAC check helper
export function hasPermission(
  userRole: Role,
  requiredRole: Role | Role[]
): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(userRole);
}

// Example of a more complex check
export function canAccessSensitiveData(userRole: Role): boolean {
  return userRole === 'OWNER' || userRole === 'STAFF';
}

// Check if user can view notes and consents
export function canViewNotesAndConsents(userRole: Role): boolean {
  return userRole !== 'ACCOUNTANT';
}

// Check if user can create/edit sensitive data
export function canEditSensitiveData(userRole: Role): boolean {
  return userRole === 'OWNER' || userRole === 'STAFF';
}

