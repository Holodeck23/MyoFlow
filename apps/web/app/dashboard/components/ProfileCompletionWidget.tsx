'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AlertTriangle, CheckCircle2, X, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/ui'
import type { MyoFlowSession } from '@/lib/auth'

interface CompletionResponse {
  profileCompletion: {
    score: number
    totalItems: number
    completedItems: number
    missingItems: Array<{ category: string; item: string; priority: 'high' | 'medium' | 'low' }>
  }
}

interface MissingItem {
  category: string
  item: string
  priority: 'high' | 'medium' | 'low'
}

const STORAGE_KEY = 'myoflow-profile-widget'

function getProgressClasses(score: number) {
  if (score >= 80) {
    return {
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-100 text-emerald-800',
    }
  }
  if (score >= 51) {
    return {
      bar: 'bg-amber-500',
      badge: 'bg-amber-100 text-amber-800',
    }
  }
  return {
    bar: 'bg-red-500',
    badge: 'bg-red-100 text-red-800',
  }
}

function resolveSettingsTab(category: string) {
  switch (category) {
    case 'compliance':
      return 'compliance'
    case 'branding':
      return 'invoice-branding'
    case 'profile':
    default:
      return 'profile'
  }
}

export function ProfileCompletionWidget() {
  const router = useRouter()
  const { data: rawSession } = useSession()
  const session = rawSession as MyoFlowSession | null
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [missingItems, setMissingItems] = useState<MissingItem[]>([])
  const [isDismissed, setIsDismissed] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)

  useEffect(() => {
    const fetchCompletion = async () => {
      try {
        const response = await fetch('/api/settings/overview', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Failed to load profile completion')
        }
        const json = await response.json()
        const data: CompletionResponse = json?.data ?? json
        const completion = data?.profileCompletion
        if (!completion) {
          throw new Error('Invalid completion response')
        }

        setScore(completion.score ?? 0)
        setMissingItems(completion.missingItems ?? [])

        if (typeof window !== 'undefined') {
          const storedRaw = window.localStorage.getItem(STORAGE_KEY)
          const stored = storedRaw ? JSON.parse(storedRaw) as { dismissed: boolean; score: number } : null

          if (stored?.dismissed) {
            if (completion.score < stored.score) {
              window.localStorage.removeItem(STORAGE_KEY)
              setIsDismissed(false)
            } else {
              setIsDismissed(true)
            }
          }
        }

        if (completion.score >= 80) {
          setJustCompleted(true)
          setTimeout(() => setIsDismissed(true), 3000)
        } else {
          setJustCompleted(false)
        }
      } catch (error) {
        console.error('[ProfileCompletionWidget] Failed to fetch completion status', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompletion()
  }, [])

  const shouldRender = useMemo(() => {
    if (loading) {
      return true
    }
    if (isDismissed) {
      return false
    }
    return score < 100
  }, [loading, isDismissed, score])

  const progressClasses = useMemo(() => getProgressClasses(score), [score])

  const handleDismiss = () => {
    setIsDismissed(true)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissed: true, score }))
    }
  }

  const handleNavigate = (category: string) => {
    const tab = resolveSettingsTab(category)
    router.push(`/dashboard/settings?tab=${tab}`)
  }

  if (!shouldRender || score === 100) {
    return null
  }

  const title = score >= 80 ? 'Profile 100% complete' : 'Complete your practice profile'
  const description =
    score >= 80
      ? 'Great work! Your profile is production-ready.'
      : 'Finish these final steps to unlock the full MyoFlow experience.'

  return (
    <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-white">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold text-blue-900 flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${score >= 80 ? 'text-emerald-500' : 'text-blue-500'}`} />
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-blue-700 mt-1">
            {description}
          </CardDescription>
        </div>
        {score < 80 && (
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label="Dismiss profile completion reminder"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2 text-sm font-medium text-blue-900">
            <span>{score}% completed</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${progressClasses.badge}`}>
              {missingItems.length === 0 ? 'All steps complete' : `${missingItems.length} steps remaining`}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-blue-100">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${progressClasses.bar}`}
              style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
            />
          </div>
        </div>

        {missingItems.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-blue-900">Next recommended steps</p>
            <ul className="space-y-2">
              {missingItems.slice(0, 4).map((item, index) => (
                <li
                  key={`${item.item}-${index}`}
                  className="flex items-center justify-between rounded-md border border-blue-100 bg-white px-3 py-2 text-sm text-blue-900 shadow-sm"
                >
                  <span>{item.item}</span>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-blue-600 hover:text-blue-800"
                    onClick={() => handleNavigate(item.category)}
                  >
                    Complete now
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {score < 80 && (
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => handleNavigate('profile')} className="bg-blue-600 hover:bg-blue-700">
              Go to settings
            </Button>
            {session?.user?.accountType === 'TEST' && (
              <Button variant="outline" onClick={() => router.push('/settings/account-upgrade')}>
                Upgrade requirements
              </Button>
            )}
          </div>
        )}

        {score >= 80 && justCompleted && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            <span>Profile complete! You&apos;re ready to upgrade when you&apos;re set.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
