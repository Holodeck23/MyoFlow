'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Shield, Users, Search, ArrowLeft, Mail, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface TherapistData {
  id: string
  slug: string
  designation: string
  businessName: string | null
  businessEmail: string | null
  profileCompletedAt: string | null
}

interface UserData {
  id: string
  email: string
  name: string | null
  role: string
  subscriptionStatus: string
  trialEndsAt: string | null
  createdAt: string
  emailVerified: string | null
  therapist: TherapistData | null
}

export default function AdminUsersClient() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      setError('Failed to load users')
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.therapist?.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'TRIAL': return 'bg-blue-100 text-blue-800'
      case 'PAST_DUE': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800'
      case 'SUPPORT': return 'bg-blue-100 text-blue-800'
      case 'FINANCE': return 'bg-green-100 text-green-800'
      case 'OWNER': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-sm text-gray-500">Manage therapist accounts and permissions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Search and Stats */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by email, name, or business..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{filteredUsers.length} users</span>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                          <User className="w-5 h-5 text-gray-500" />
                          <span>{user.name || 'Unnamed User'}</span>
                        </h3>
                        <div className="flex items-center space-x-2 text-gray-600 mt-1">
                          <Mail className="w-4 h-4" />
                          <span>{user.email}</span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                        <Badge className={getStatusColor(user.subscriptionStatus)}>
                          {user.subscriptionStatus}
                        </Badge>
                      </div>
                    </div>

                    {/* Therapist Info */}
                    {user.therapist ? (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <h4 className="font-medium text-gray-900 mb-2">Therapist Profile</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>Business: {user.therapist.businessName || 'Not set'}</div>
                          <div>Designation: {user.therapist.designation}</div>
                          <div>Slug: {user.therapist.slug}</div>
                          <div>
                            Profile: {user.therapist.profileCompletedAt ? 'Complete' : 'Incomplete'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-yellow-700">No therapist profile created</p>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Joined {format(new Date(user.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                      {user.trialEndsAt && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Trial ends {format(new Date(user.trialEndsAt), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      {user.emailVerified && (
                        <Badge className="text-xs">
                          Email Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 lg:w-48">
                    <Button variant="outline" size="sm" disabled>
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Reset Password
                    </Button>
                    <Button
                      variant={user.subscriptionStatus === 'CANCELED' ? 'default' : 'destructive'}
                      size="sm"
                      disabled
                    >
                      {user.subscriptionStatus === 'CANCELED' ? 'Enable' : 'Disable'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'No users have been registered yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}