import AdminAuthWrapper from '@/components/admin/AdminAuthWrapper'
import AdminUsersClient from '@/components/admin/AdminUsersClient'

export default function AdminUsersPage() {
  return (
    <AdminAuthWrapper>
      <AdminUsersClient />
    </AdminAuthWrapper>
  )
}