'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { DashboardNav } from '@/app/components/DashboardNav'
import { useTranslation } from '@myoflow/lib'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale } = useTranslation()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('common.loading', 'Loading...')}</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav active="dashboard">
        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          {t('nav.signOut', 'Abmelden')}
        </Button>
      </DashboardNav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              {t('dashboard.welcome', 'Welcome to MyoFlow')}
            </h2>
            <div className="bg-gray-100 px-3 py-1 rounded text-sm">
              Current Language: <strong>{locale === 'de' ? 'Deutsch' : 'English'}</strong> ({locale})
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-md">
              <h3 className="text-sm font-medium text-blue-800">
                {t('dashboard.authSuccess', '🎉 Authentication Working!')}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                {t('dashboard.signedInAs', 'You are successfully signed in as:')} <strong>{session.user?.email}</strong>
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="p-4 border rounded-lg hover:bg-gray-50">
                <Link href="/dashboard/clients" className="block">
                  <h4 className="font-medium text-gray-900">{t('nav.clients', 'Clients')}</h4>
                  <p className="text-sm text-gray-500 mt-1">{t('dashboard.manageClients', 'Manage your client list')}</p>
                  <p className="text-xs text-green-600 mt-2">{t('dashboard.availableNow', '✅ Available now')}</p>
                </Link>
              </div>
              
              <div className="p-4 border rounded-lg hover:bg-gray-50">
                <Link href="/dashboard/appointments" className="block">
                  <h4 className="font-medium text-gray-900">{t('nav.appointments', 'Appointments')}</h4>
                  <p className="text-sm text-gray-500 mt-1">{t('dashboard.scheduleAppointments', 'Schedule and manage appointments')}</p>
                  <p className="text-xs text-green-600 mt-2">{t('dashboard.availableNow', '✅ Available now')}</p>
                </Link>
              </div>
              
              <div className="p-4 border rounded-lg hover:bg-gray-50">
                <Link href="/dashboard/invoices" className="block">
                  <h4 className="font-medium text-gray-900">{t('nav.invoices', 'Invoices')}</h4>
                  <p className="text-sm text-gray-500 mt-1">{t('dashboard.austrianInvoicing', 'Austrian tax-compliant invoicing')}</p>
                  <p className="text-xs text-green-600 mt-2">{t('dashboard.availableNow', '✅ Available now')}</p>
                </Link>
              </div>

              <div className="p-4 border rounded-lg hover:bg-gray-50">
                <Link href="/dashboard/settings" className="block">
                  <h4 className="font-medium text-gray-900">{t('nav.settings', 'Settings')}</h4>
                  <p className="text-sm text-gray-500 mt-1">{t('dashboard.profileSettings', 'Profile and Austrian compliance')}</p>
                  <p className="text-xs text-blue-600 mt-2">{t('dashboard.availableNow', '✅ Available now')}</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}