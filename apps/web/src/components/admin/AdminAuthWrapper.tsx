import { redirect } from 'next/navigation'
import { getAdminUserFromCookies } from '@/lib/admin-auth'
import AdminUserProvider from './AdminUserProvider'

interface AdminAuthWrapperProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

export default async function AdminAuthWrapper({
  children,
  requiredRoles = ['SUPER_ADMIN', 'SUPPORT', 'FINANCE']
}: AdminAuthWrapperProps) {
  // Server-side admin authentication check
  const adminUser = await getAdminUserFromCookies()

  // Redirect if no admin user
  if (!adminUser) {
    redirect('/admin/login')
  }

  // Check role permissions
  if (requiredRoles.length > 0 && !requiredRoles.includes(adminUser.role)) {
    redirect('/admin/login')
  }

  // Pass admin user data to children via context
  return (
    <AdminUserProvider adminUser={adminUser}>
      {children}
    </AdminUserProvider>
  )
}