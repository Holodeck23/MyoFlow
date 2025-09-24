'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { LogOut } from 'lucide-react'

export default function AdminSignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      // Call logout API to clear httpOnly cookie
      await fetch('/api/admin/logout', { method: 'POST' })

      // Force redirect to admin login
      window.location.href = '/admin/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback redirect even if API fails
      window.location.href = '/admin/login'
    }
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