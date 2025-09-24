import AdminAuthWrapper from '@/components/admin/AdminAuthWrapper'
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'

export default function AdminDashboard() {
  return (
    <AdminAuthWrapper>
      <AdminDashboardClient />
    </AdminAuthWrapper>
  )
}