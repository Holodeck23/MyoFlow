import AdminAuthWrapper from '@/components/admin/AdminAuthWrapper'
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'

export const dynamic = 'force-dynamic'

export default function AdminDashboard() {
  return (
    <AdminAuthWrapper>
      <AdminDashboardClient />
    </AdminAuthWrapper>
  )
}
