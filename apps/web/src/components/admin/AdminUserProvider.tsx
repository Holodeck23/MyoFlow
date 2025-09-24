'use client'

import { createContext, useContext } from 'react'
import { AdminUser } from '@/lib/admin-auth'

// Context to provide admin user data to child components
const AdminUserContext = createContext<AdminUser | null>(null)

export function useAdminUser() {
  const context = useContext(AdminUserContext)
  if (!context) {
    throw new Error('useAdminUser must be used within AdminUserProvider')
  }
  return context
}

interface AdminUserProviderProps {
  children: React.ReactNode
  adminUser: AdminUser
}

export default function AdminUserProvider({
  children,
  adminUser
}: AdminUserProviderProps) {
  return (
    <AdminUserContext.Provider value={adminUser}>
      {children}
    </AdminUserContext.Provider>
  )
}