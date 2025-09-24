import AdminAuthWrapper from '@/components/admin/AdminAuthWrapper'
import AdminAnalyticsClient from '@/components/admin/AdminAnalyticsClient'

export default function AdminAnalyticsPage() {
  return (
    <AdminAuthWrapper>
      <AdminAnalyticsClient />
    </AdminAuthWrapper>
  )
}