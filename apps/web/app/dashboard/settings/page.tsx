'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ServiceRateManager from '@/app/components/ServiceRateManager'
import CSVExportManager from '@/app/components/CSVExportManager'

interface TherapistProfile {
  id: string
  designation: string
  vatStatus: string
  kleinunternehmer: boolean
  businessName?: string
  businessAddress?: string
  businessPhone?: string
  businessEmail?: string
  businessWebsite?: string
  uidNumber?: string
  brandColor?: string
  logoUrl?: string
}

interface ProfileData {
  therapist: TherapistProfile
  completionPercentage: number
  missingFields: string[]
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showServiceRates, setShowServiceRates] = useState(false)
  const [showCSVExports, setShowCSVExports] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
      return
    }

    if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/therapist/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      setProfileData(data)
    } catch (err) {
      setError('Failed to load profile data')
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="p-4 bg-red-50 rounded-md">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                MyoFlow
              </Link>
              <span className="text-sm text-gray-500">Settings</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session.user?.email}
              </span>
              <Link 
                href="/dashboard"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium text-gray-900">
              Settings
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage your practice profile and preferences
            </p>
          </div>

          {profileData && (
            <div className="p-6">
              {/* Profile Completion Status */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-blue-800">
                    Profile Completion
                  </h3>
                  <span className="text-sm font-medium text-blue-600">
                    {profileData.completionPercentage}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profileData.completionPercentage}%` }}
                  />
                </div>
                {profileData.missingFields.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-blue-700 mb-1">Missing fields:</p>
                    <div className="flex flex-wrap gap-1">
                      {profileData.missingFields.map((field) => (
                        <span 
                          key={field}
                          className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Current Profile Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Business Information</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs text-gray-500">Business Name</dt>
                      <dd className="text-sm text-gray-900">
                        {profileData.therapist.businessName || 'Not set'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Address</dt>
                      <dd className="text-sm text-gray-900">
                        {profileData.therapist.businessAddress || 'Not set'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Phone</dt>
                      <dd className="text-sm text-gray-900">
                        {profileData.therapist.businessPhone || 'Not set'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">
                        {profileData.therapist.businessEmail || 'Not set'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Austrian Tax Compliance</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs text-gray-500">Professional Designation</dt>
                      <dd className="text-sm text-gray-900">
                        {profileData.therapist.designation}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">VAT Status</dt>
                      <dd className="text-sm text-gray-900">
                        {profileData.therapist.vatStatus}
                        {profileData.therapist.kleinunternehmer && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-1 rounded">
                            Kleinunternehmer
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">UID Number</dt>
                      <dd className="text-sm text-gray-900">
                        {profileData.therapist.uidNumber || 'Not set'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex space-x-4">
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Edit Profile</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Update business details and Austrian compliance settings
                  </p>
                  <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    Coming Soon
                  </div>
                </div>

                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Service Rates</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Manage default pricing for different massage types
                  </p>
                  <button
                    onClick={() => setShowServiceRates(!showServiceRates)}
                    className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100"
                  >
                    {showServiceRates ? 'Hide' : 'Manage'} Service Rates
                  </button>
                </div>

                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Export Data</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    CSV exports for BMD/RZL/DATEV accounting software
                  </p>
                  <button
                    onClick={() => setShowCSVExports(!showCSVExports)}
                    className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100"
                  >
                    {showCSVExports ? 'Hide' : 'Manage'} CSV Exports
                  </button>
                </div>
              </div>

              {/* Service Rate Manager */}
              {showServiceRates && profileData && (
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <ServiceRateManager therapistVatStatus={profileData.therapist.vatStatus} />
                </div>
              )}

              {/* CSV Export Manager */}
              {showCSVExports && profileData && (
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <CSVExportManager therapistId={profileData.therapist.id} />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}