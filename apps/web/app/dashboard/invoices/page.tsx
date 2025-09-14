'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardNav } from '@/app/components/DashboardNav'
import { useTranslation } from '@myoflow/lib'

interface Invoice {
  id: string
  number: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'VOID'
  totalGrossCents: number
  createdAt: string
  Client: {
    id: string
    name: string
    email: string
  }
  Appointment?: {
    id: string
    start: string
    Service: {
      name: string
      category: string
    }
  }
}

export default function InvoicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
      return
    }

    if (status === 'authenticated') {
      fetchInvoices()
    }
  }, [status, router])

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices')
      if (!response.ok) {
        throw new Error(t('invoices.fetchError', 'Failed to fetch invoices'))
      }
      const data = await response.json()
      setInvoices(data.invoices)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error', 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('de-AT', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'SENT':
        return 'bg-blue-100 text-blue-800'
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'VOID':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t('invoices.loading', 'Loading invoices...')}</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav active="invoices" />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {t('invoices.title', 'Rechnungen')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('invoices.subtitle', 'Verwalten Sie Rechnungen mit Kleinunternehmer- und USt-Compliance')}
              </p>
            </div>
            <Link
              href="/dashboard/invoices/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {t('invoices.createNew', 'Neue Rechnung erstellen')}
            </Link>
          </div>

          {error && (
            <div className="p-6 bg-red-50 border-b border-red-200">
              <p className="text-red-800">{t('common.error', 'Error')}: {error}</p>
            </div>
          )}

          <div className="overflow-hidden">
            {invoices.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">{t('invoices.noInvoices', 'Keine Rechnungen gefunden.')}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {t('invoices.createFirst', 'Erstellen Sie Ihre erste österreichisch-konforme Rechnung, um zu beginnen.')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <Link 
                    key={invoice.id} 
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="block p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                            Invoice {invoice.number}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              invoice.status
                            )}`}
                          >
                            {invoice.status}
                          </span>
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">Client:</span>
                            <span className="ml-2">{invoice.Client.name}</span>
                            <span className="ml-2 text-gray-400">
                              {invoice.Client.email}
                            </span>
                          </div>
                          
                          {invoice.Appointment && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="font-medium">Service:</span>
                              <span className="ml-2">{invoice.Appointment.Service.name}</span>
                              <span className="ml-2 text-gray-400">
                                {formatDate(invoice.Appointment.start)}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">Amount:</span>
                            <span className="ml-2 font-semibold text-gray-900">
                              {formatCurrency(invoice.totalGrossCents)}
                            </span>
                            <span className="ml-2 text-gray-400">
                              Created {formatDate(invoice.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-shrink-0">
                        <div className="text-sm text-blue-600 font-medium">
                          View Details →
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-green-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800 mb-2">
            🇦🇹 Sprint 1.4 Complete
          </h3>
          <div className="text-sm text-green-700">
            <p>✅ Austrian-compliant invoice API with VAT handling</p>
            <p>✅ Kleinunternehmer and regular VAT support</p>
            <p>✅ Sequential invoice numbering (YYYY-NNN format)</p>
            <p>🔄 Next: PDF generation & invoice creation interface</p>
          </div>
        </div>
      </main>
    </div>
  )
}