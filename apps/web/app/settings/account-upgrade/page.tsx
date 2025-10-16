import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import UpgradeClient from './upgrade-client'

export default async function AccountUpgradePage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/sign-in')
  }

  if (session.user?.accountType !== 'TEST') {
    redirect('/dashboard')
  }

  return <UpgradeClient />
}
