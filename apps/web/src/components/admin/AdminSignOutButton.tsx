'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { LogOut } from 'lucide-react'

export default function AdminSignOutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/admin/login' })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      className="flex items-center space-x-2"
    >
      <LogOut className="w-4 h-4" />
      <span>Sign Out</span>
    </Button>
  )
}