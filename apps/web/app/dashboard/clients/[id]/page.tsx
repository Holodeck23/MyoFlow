'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface Note {
  id: string
  bodyEnc: string
  createdAt: string
}

interface Appointment {
  id: string
  start: string
  end: string
  status: string
  notes: string | null
  Service: {
    name: string
  }
  Location: {
    name: string
  }
}

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  street: string | null
  postalCode: string | null
  city: string | null
  country: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
  Notes: Note[]
  Appointments: Appointment[]
}

export default function ClientProfilePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const fetchClient = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clients/${params.id}`)
      
      if (response.status === 404) {
        setError('Client not found')
        return
      }
      
      if (!response.ok) throw new Error('Failed to fetch client')
      
      const data = await response.json()
      setClient(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load client')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
      return
    }
    if (status === 'authenticated') {
      fetchClient()
    }
  }, [status, router, fetchClient])

  const handleDeleteClient = async () => {
    if (!client || !confirm(`Are you sure you want to delete ${client.name}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete client')
      
      router.push('/dashboard/clients')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete client')
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim() || !client) return

    setAddingNote(true)
    try {
      const response = await fetch(`/api/clients/${client.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bodyEnc: newNote.trim()
        })
      })

      if (!response.ok) throw new Error('Failed to add note')

      const note = await response.json()
      setClient({
        ...client,
        Notes: [note, ...client.Notes]
      })
      setNewNote('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add note')
    } finally {
      setAddingNote(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) return null

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-xl font-semibold text-blue-600 hover:text-blue-700">
                  MyoFlow
                </Link>
                <Link href="/dashboard/clients" className="text-sm text-gray-500 hover:text-gray-700">
                  Clients
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h1 className="text-lg font-medium text-red-600 mb-2">Error</h1>
            <p className="text-gray-600">{error}</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/clients">
                Back to Clients
              </Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  if (!client) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-xl font-semibold text-blue-600 hover:text-blue-700">
                MyoFlow
              </Link>
              <Link href="/dashboard/clients" className="text-sm text-gray-500 hover:text-gray-700">
                Clients
              </Link>
              <span className="text-sm text-gray-500">{client.name}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {session.user?.email}
              </span>
              <Button asChild size="sm">
                <Link href={`/dashboard/clients/${client.id}/edit`}>
                  Edit Client
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                      Client since {new Date(client.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/dashboard/clients/${client.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                    >
                      Edit
                    </Link>
                    <Button
                      onClick={handleDeleteClient}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {client.email || <span className="text-gray-400">Not provided</span>}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {client.phone || <span className="text-gray-400">Not provided</span>}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500">Address</h3>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                      {client.street || client.postalCode || client.city || client.country ? (
                        [client.street, [client.postalCode, client.city].filter(Boolean).join(' ').trim(), client.country]
                          .filter(Boolean)
                          .join('\n')
                      ) : (
                        <span className="text-gray-400">Not provided</span>
                      )}
                    </p>
                  </div>
                </div>

                {client.tags.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {client.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Appointments</h2>
                {client.Appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No appointments found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Appointment scheduling will be available in Sprint 1.3
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {client.Appointments.map(appointment => (
                      <div key={appointment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{appointment.Service.name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(appointment.start).toLocaleString()} - {appointment.Location.name}
                            </p>
                            {appointment.notes && (
                              <p className="text-sm text-gray-600 mt-1">{appointment.notes}</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            appointment.status === 'NO_SHOW' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {appointment.status.toLowerCase().replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
              
              <form onSubmit={handleAddNote} className="mb-6">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this client..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    type="submit"
                    disabled={addingNote || !newNote.trim()}
                    size="sm"
                  >
                    {addingNote ? 'Adding...' : 'Add Note'}
                  </Button>
                </div>
              </form>

              {client.Notes.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">No notes yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add your first note above to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {client.Notes.map(note => (
                    <div key={note.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{note.bodyEnc}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button
                  disabled
                  variant="secondary"
                  className="w-full"
                  size="sm"
                >
                  Schedule Appointment (Sprint 1.3)
                </Button>
                <Button
                  onClick={() => document.querySelector('textarea')?.focus()}
                  className="w-full"
                  size="sm"
                >
                  Add Note
                </Button>
                <Button
                  disabled
                  variant="secondary"
                  className="w-full"
                  size="sm"
                >
                  Generate Invoice (Sprint 1.4)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
