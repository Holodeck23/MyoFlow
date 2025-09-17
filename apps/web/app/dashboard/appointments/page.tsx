'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AppointmentsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/calendar')
  }, [router])


  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Weiterleitung zum Kalender...</div>
    </div>
  )
}