'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DashboardNav } from '@/app/components/DashboardNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge, EncryptionBadge } from '@/components/ui/Badge'
import { formatAustrianPhoneNumber, formatAustrianDate } from '@/lib/austrian-formatting'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

export default function ClientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('')

  const allTags = clients.reduce((tags: string[], client) => {
    client.tags.forEach(tag => {
      if (!tags.includes(tag)) tags.push(tag)
    })
    return tags.sort()
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
      return
    }
    if (status === 'authenticated') {
      fetchClients()
    }
  }, [status, router, search, selectedTag])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedTag) params.append('tag', selectedTag)

      const response = await fetch(`/api/clients?${params}`)
      if (!response.ok) throw new Error('Failed to fetch clients')
      
      const data = await response.json()
      setClients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete client')
      
      setClients(clients.filter(client => client.id !== clientId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete client')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-blue"></div>
          <p className="text-neutral-gray-600 font-medium">Laden...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav active="clients">
        <Button asChild>
          <Link href="/dashboard/clients/new">Neuen Klienten hinzufügen</Link>
        </Button>
      </DashboardNav>

      {/* Professional Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div>
            <h1 className="text-2xl font-semibold text-neutral-gray-900">Klienten verwalten</h1>
            <p className="mt-2 text-neutral-gray-600">
              Verwalten Sie Ihre Klientendaten sicher und GDPR-konform.
              <EncryptionBadge className="ml-2" />
            </p>
          </div>

          {/* Search and Filter Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Klienten suchen..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                {allTags.length > 0 && (
                  <div className="sm:w-48">
                    <select
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-medical-blue-500 focus:border-transparent transition-professional"
                    >
                      <option value="">Alle Tags</option>
                      {allTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content Section */}
          {error ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-austrian-red-600 flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Fehler: {error}</span>
                </div>
              </CardContent>
            </Card>
          ) : clients.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-neutral-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-neutral-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-neutral-gray-900 mb-2">
                    {search || selectedTag ? 'Keine Klienten gefunden' : 'Noch keine Klienten hinzugefügt'}
                  </h3>
                  <p className="text-neutral-gray-600 mb-6">
                    {search || selectedTag
                      ? 'Versuchen Sie, Ihre Suche oder Filter anzupassen.'
                      : 'Fügen Sie Ihren ersten Klienten hinzu, um zu beginnen.'}
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/clients/new">
                      {search || selectedTag ? 'Neuen Klienten hinzufügen' : 'Ersten Klienten hinzufügen'}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clients.map(client => (
                <Card key={client.id} className="hover:shadow-professional transition-professional cursor-pointer">
                  <Link href={`/dashboard/clients/${client.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{client.name}</CardTitle>
                          <p className="text-sm text-neutral-gray-500 mt-1">
                            Aktualisiert am {formatAustrianDate(new Date(client.updatedAt))}
                          </p>
                        </div>
                        <EncryptionBadge />
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        {/* Contact Information */}
                        <div className="space-y-2">
                          {client.email && (
                            <div className="flex items-center space-x-2 text-sm text-neutral-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                              </svg>
                              <span className="truncate">{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center space-x-2 text-sm text-neutral-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{formatAustrianPhoneNumber(client.phone)}</span>
                            </div>
                          )}
                          {!client.email && !client.phone && (
                            <div className="text-sm text-neutral-gray-400 italic">
                              Keine Kontaktdaten verfügbar
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {client.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {client.tags.map(tag => (
                              <Badge key={tag} variant="secondary" size="sm">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Link>
                  
                  {/* Action Buttons */}
                  <div className="px-6 pb-4 pt-0 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/dashboard/clients/${client.id}/edit`}>
                        Bearbeiten
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteClient(client.id, client.name)
                      }}
                      className="text-austrian-red-600 hover:text-austrian-red-700 hover:bg-austrian-red-50"
                    >
                      Löschen
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}