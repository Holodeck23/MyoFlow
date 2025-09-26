import AdminAuthWrapper from '@/components/admin/AdminAuthWrapper'
import AdminUsersClient from '@/components/admin/AdminUsersClient'

export const dynamic = 'force-dynamic'

export default function AdminUsersPage() {
  return (
    <AdminAuthWrapper>
      <AdminUsersClient />
    </AdminAuthWrapper>
  )
}
