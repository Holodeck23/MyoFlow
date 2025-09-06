'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">MyoFlow</h1>
              <span className="text-sm text-gray-500">Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Welcome to MyoFlow
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-md">
              <h3 className="text-sm font-medium text-blue-800">
                🎉 Authentication Working!
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                You are successfully signed in as: <strong>{session.user?.email}</strong>
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 border rounded-lg hover:bg-gray-50">
                <Link href="/dashboard/clients" className="block">
                  <h4 className="font-medium text-gray-900">Clients</h4>
                  <p className="text-sm text-gray-500 mt-1">Manage your client list</p>
                  <p className="text-xs text-green-600 mt-2">✅ Available now</p>
                </Link>
              </div>
              
              <div className="p-4 border rounded-lg hover:bg-gray-50">
                <Link href="/dashboard/appointments" className="block">
                  <h4 className="font-medium text-gray-900">Appointments</h4>
                  <p className="text-sm text-gray-500 mt-1">Schedule and manage appointments</p>
                  <p className="text-xs text-green-600 mt-2">✅ Available now</p>
                </Link>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900">Invoices</h4>
                <p className="text-sm text-gray-500 mt-1">Austrian tax-compliant invoicing</p>
                <p className="text-xs text-gray-400 mt-2">Coming in Sprint 1.4</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}