'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslation } from '@myoflow/lib'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
      return
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">{t('common.loading', 'Loading...')}</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-gray-900">{t('settings.title', 'Einstellungen')}</h1>
          <p className="mt-2 text-neutral-gray-600">
            {t('settings.subtitle', 'Verwalten Sie Ihr Praxisprofil und Ihre Präferenzen.')}
          </p>
        </div>
      </div>

      {/* Simple Settings Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⚙️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('settings.placeholder.title', 'Settings overview')}</h3>
          <p className="text-gray-500">
            {t('settings.placeholder.description', 'Settings functionality is being developed in the user settings branch.')}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {t('settings.placeholder.note', 'This branch focuses on calendar implementation and appointment visualization.')}
          </p>
        </div>
      </div>
    </div>
  )
}
