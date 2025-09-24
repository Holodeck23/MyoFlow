import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminAnalyticsClient from '@/components/admin/AdminAnalyticsClient'

export default async function AdminAnalyticsPage() {
  const session = await auth()

  // Redirect if not authenticated or not admin
  if (!session?.user?.role || !['SUPER_ADMIN', 'SUPPORT', 'FINANCE'].includes(session.user.role)) {
    redirect('/admin/login')
  }

  return <AdminAnalyticsClient />
}