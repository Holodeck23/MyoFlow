'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { LogOut } from 'lucide-react'

export default function AdminSignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    // Clear admin session
    sessionStorage.removeItem('admin-user')
    // Redirect to admin login
    router.push('/admin/login')
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