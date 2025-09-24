import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminUsersClient from '@/components/admin/AdminUsersClient'

export default async function AdminUsersPage() {
  const session = await auth()

  // Redirect if not authenticated or not admin
  if (!session?.user?.role || !['SUPER_ADMIN', 'SUPPORT', 'FINANCE'].includes(session.user.role)) {
    redirect('/admin/login')
  }

  return <AdminUsersClient />
}