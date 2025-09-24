'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

interface AdminDashboardWrapperProps {
  children: React.ReactNode
  adminUser?: AdminUser | null
}

export default function AdminDashboardWrapper({ children, adminUser }: AdminDashboardWrapperProps) {
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check for admin session
    const storedUser = sessionStorage.getItem('admin-user')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as AdminUser
        if (['SUPER_ADMIN', 'SUPPORT', 'FINANCE'].includes(user.role)) {
          setCurrentUser(user)
          setLoading(false)
          return
        }
      } catch (error) {
        console.error('Error parsing admin user:', error)
      }
    }

    // If no valid admin session, redirect to login
    router.push('/admin/login')
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null // Will redirect
  }

  return <>{children}</>
}