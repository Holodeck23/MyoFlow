import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SettingsClient from './settings-client'
import { Loader2 } from 'lucide-react'

/**
 * Server Component wrapper for Settings page
 * Handles authentication check on server-side before hydration
 */
export default async function SettingsPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/sign-in')
  }

  return (
    <Suspense fallback={<SettingsLoadingState />}>
      <SettingsClient />
    </Suspense>
  )
}

function SettingsLoadingState() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#1565C0]" />
        <div className="text-lg">Loading...</div>
      </div>
    </div>
  )
}
