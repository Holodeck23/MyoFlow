import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Users, DollarSign, Activity, Shield, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { signOut } from 'next-auth/react'
import AdminSignOutButton from '@/components/admin/AdminSignOutButton'
import { PrismaClient } from '@myoflow/db'

const prisma = new PrismaClient()

export default async function AdminDashboard() {
  const session = await auth()

  // Redirect if not authenticated or not admin
  if (!session?.user?.role || !['SUPER_ADMIN', 'SUPPORT', 'FINANCE'].includes(session.user.role)) {
    redirect('/admin/login')
  }

  // Fetch dashboard stats
  const [totalTherapists, monthlyRevenue, totalInvoices] = await Promise.all([
    prisma.user.count({
      where: { role: { not: { in: ['SUPER_ADMIN', 'SUPPORT', 'FINANCE'] } } }
    }),
    prisma.invoice.aggregate({
      where: {
        status: { not: 'VOID' },
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: { totalGrossCents: true }
    }),
    prisma.invoice.count()
  ])

  const formatCurrency = (cents: number | null) => {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR'
    }).format((cents || 0) / 100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MyoFlow Admin</h1>
                <p className="text-sm text-gray-500">Platform Administration</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {session.user.role}
                </Badge>
              </div>
              <AdminSignOutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Welcome to MyoFlow Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              You have {session.user.role} access to the MyoFlow platform administration panel.
              Use the navigation below to manage therapist accounts, view analytics, and configure system settings.
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Therapists</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTherapists}</p>
                  <p className="text-xs text-gray-500">Registered users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyRevenue._sum.totalGrossCents)}</p>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
                  <p className="text-xs text-gray-500">All time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>User Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View and manage therapist accounts, enable/disable users, and reset passwords.
              </p>
              <Button asChild className="w-full">
                <a href="/admin/users">Manage Users</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Revenue Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View revenue summaries, growth metrics, and financial reports.
              </p>
              <Button asChild className="w-full">
                <a href="/admin/analytics">View Analytics</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>System Health</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Monitor system performance, view logs, and check service status.
              </p>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}