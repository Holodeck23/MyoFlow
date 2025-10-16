'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from '@/components/ui'
import { CheckCircle2, AlertCircle, Loader2, Shield, ArrowLeft, X } from 'lucide-react'

interface ChecklistItem {
  id: string
  label: string
  description: string
  complete: boolean
}

interface UpgradeStatusResponse {
  checklist: ChecklistItem[]
  canUpgrade: boolean
  profileScore: number
  accountType: string
}

export default function UpgradeClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [canUpgrade, setCanUpgrade] = useState(false)
  const [profileScore, setProfileScore] = useState(0)
  const [acknowledge, setAcknowledge] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch('/api/settings/account/upgrade', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Failed to load upgrade status')
        }
        const data: UpgradeStatusResponse = await response.json()
        setItems(data.checklist)
        setCanUpgrade(data.canUpgrade)
        setProfileScore(data.profileScore)
      } catch (err) {
        console.error(err)
        setError('Unable to load upgrade readiness. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadStatus()
  }, [])

  const handleUpgrade = async () => {
    try {
      setSubmitting(true)
      setError(null)
      const response = await fetch('/api/settings/account/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmArchive: true }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        if (json?.checklist) {
          setItems(json.checklist)
          setCanUpgrade(json.checklist.every((item: ChecklistItem) => item.complete))
        }
        throw new Error(json?.error || 'Upgrade failed')
      }

      setSuccess(true)
      setTimeout(() => {
        signOut({ callbackUrl: '/auth/sign-in?upgraded=1' })
      }, 1500)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to upgrade account')
    } finally {
      setSubmitting(false)
    }
  }

  const renderChecklist = () => (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm"
        >
          {item.complete ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500" />
          )}
          <div>
            <p className="font-medium text-slate-900">{item.label}</p>
            <p className="text-slate-600">{item.description}</p>
          </div>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" className="mb-2 flex items-center gap-2 text-slate-600" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Upgrade to Production</h1>
          <p className="mt-1 text-slate-600">
            Archive your demo data and activate your live MyoFlow workspace.
          </p>
        </div>
        <Shield className="h-12 w-12 text-blue-500" />
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 p-8 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            Checking your account readiness...
          </CardContent>
        </Card>
      ) : (
        <>
          {error && (
            <Card className="border border-red-200 bg-red-50 text-red-800">
              <CardContent className="flex items-center gap-2 p-4">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </CardContent>
            </Card>
          )}

          {success && (
            <Card className="border border-emerald-200 bg-emerald-50 text-emerald-700">
              <CardContent className="flex items-center gap-2 p-4">
                <CheckCircle2 className="h-5 w-5" />
                <span>Upgrade successful! Redirecting you to sign in...</span>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Upgrade Checklist</CardTitle>
              <CardDescription>
                All items must be completed before you can upgrade. Current completion score: {profileScore}%
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderChecklist()}

              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Upgrading will archive demo clients, appointments, invoices, products, and notes. You&apos;ll start with a clean workspace.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="acknowledge"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={acknowledge}
                  onChange={(event) => setAcknowledge(event.target.checked)}
                />
                <label htmlFor="acknowledge" className="text-sm text-slate-700">
                  I understand that my test data will be archived and removed from the live workspace.
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => router.push('/dashboard/settings')}>
                  Cancel
                </Button>
                <Button
                  disabled={!canUpgrade || !acknowledge || submitting || success}
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setModalOpen(true)}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    'Upgrade to Production'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Confirm production upgrade</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Review the checklist below and confirm to archive demo data.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-slate-400 hover:text-slate-600"
                onClick={() => setModalOpen(false)}
                aria-label="Close upgrade confirmation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {renderChecklist()}

              <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-600">
                After confirming, your demo data will be archived and your account type will switch to Production. You’ll need to sign back in to continue.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Not now
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!canUpgrade || submitting || success}
                onClick={() => {
                  setModalOpen(false)
                  handleUpgrade()
                }}
              >
                Confirm & Upgrade
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
