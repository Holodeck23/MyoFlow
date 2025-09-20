'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge, EncryptionBadge } from '@/components/ui/Badge'
import { formatAustrianPhoneNumber, formatAustrianDate } from '@/lib/austrian-formatting'
import { useTranslation } from '@myoflow/lib'

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
  const { t } = useTranslation()
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
      if (!response.ok) throw new Error(t('clients.fetchError'))
      
      const data = await response.json()
      setClients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('clients.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`${t('clients.deleteConfirm')} ${clientName}${t('clients.deleteConfirmContinue')}`)) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error(t('clients.deleteError'))
      
      setClients(clients.filter(client => client.id !== clientId))
    } catch (err) {
      alert(err instanceof Error ? err.message : t('clients.deleteError'))
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-blue"></div>
          <p className="text-neutral-gray-600 font-medium">{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">{t('clients.title')}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            {t('clients.subtitle')}
            <EncryptionBadge className="ml-1" />
          </p>
        </div>
        <Button asChild className="shadow-sm">
          <Link href="/dashboard/clients/new" className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('clients.addNew')}
          </Link>
        </Button>
      </div>

      {/* Search and Filter Section */}
      <Card className="shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  type="text"
                  placeholder={t('clients.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 shadow-sm border-border/60 focus:border-primary/60 focus:ring-primary/20"
                />
              </div>
            </div>

            {allTags.length > 0 && (
              <div className="sm:w-48">
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full h-11 px-3 py-2 border border-border/60 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 transition-colors shadow-sm"
                >
                  <option value="">{t('clients.allTags')}</option>
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
        <Card className="shadow-sm border-0 border-l-4 border-l-destructive">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 text-destructive">
              <div className="p-2 bg-destructive/10 rounded-full">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium">{t('common.error')}</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : clients.length === 0 ? (
        <Card className="shadow-sm border-0">
          <CardContent className="p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {search || selectedTag ? t('clients.noClientsFound') : t('clients.noClientsYet')}
              </h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {search || selectedTag ? t('clients.adjustSearch') : t('clients.addFirstClient')}
              </p>
              <Button asChild size="lg" className="shadow-sm">
                <Link href="/dashboard/clients/new" className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {search || selectedTag ? t('clients.addNew') : t('clients.addFirst')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {clients.map(client => (
                <Card key={client.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-md">
                  <Link href={`/dashboard/clients/${client.id}`} className="block">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{client.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t('clients.updatedOn', 'Aktualisiert am')} {formatAustrianDate(new Date(client.updatedAt))}
                          </p>
                        </div>
                        <EncryptionBadge />
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        {/* Contact Information */}
                        <div className="space-y-3">
                          {client.email && (
                            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                              <div className="p-1.5 bg-primary/10 rounded-full">
                                <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                              </div>
                              <span className="truncate font-medium">{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                              <div className="p-1.5 bg-success/10 rounded-full">
                                <svg className="w-3.5 h-3.5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                              </div>
                              <span className="font-medium">{formatAustrianPhoneNumber(client.phone)}</span>
                            </div>
                          )}
                          {!client.email && !client.phone && (
                            <div className="text-sm text-muted-foreground italic flex items-center space-x-2">
                              <div className="p-1.5 bg-muted/50 rounded-full">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span>{t('clients.noContactInfo', 'Keine Kontaktdaten verfügbar')}</span>
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
                  <div className="px-6 pb-6 pt-2 flex justify-end space-x-3 border-t border-border/50 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="hover:bg-primary/5 hover:text-primary hover:border-primary/20"
                    >
                      <Link href={`/dashboard/clients/${client.id}/edit`}>
                        {t('common.edit', 'Bearbeiten')}
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
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {t('common.delete', 'Löschen')}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
    </div>
  )
}
