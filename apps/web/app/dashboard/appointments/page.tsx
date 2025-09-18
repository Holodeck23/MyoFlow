'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTranslation } from '@myoflow/lib'

export default function AppointmentsRedirect() {
  const router = useRouter()
  const { status } = useSession()
  const { t } = useTranslation()

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
      return
    }

    router.replace('/dashboard/calendar')
  }, [status, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">
        {t('appointments.redirectingToCalendar', 'Weiterleitung zum Kalender...')}
      </div>
    </div>
  )
}
