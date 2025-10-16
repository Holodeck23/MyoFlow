'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { AlertTriangle, Shield, Code, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type AccountTypeValue = 'TEST' | 'PRODUCTION' | 'ADMIN' | 'DEV'

type BannerMeta = {
  label: string
  description: string
  tooltip: string
  classes: string
  badgeClasses: string
  icon: React.ComponentType<{ className?: string }>
  iconClassName: string
  dismissButtonClassName: string
  showBanner: boolean
}

const ACCOUNT_TYPE_META: Record<AccountTypeValue, BannerMeta> = {
  TEST: {
    label: 'Test Account',
    description: 'You are working with sample data. Upgrade when you are ready to go live.',
    tooltip: 'This is a test account with sample data. Upgrade when you are ready to onboard real clients.',
    classes: 'bg-yellow-50 border-b border-yellow-200 text-yellow-900',
    badgeClasses: 'bg-yellow-100 text-yellow-800',
    icon: AlertTriangle,
    iconClassName: 'text-yellow-700',
    dismissButtonClassName: 'text-yellow-800 hover:text-yellow-900 hover:bg-yellow-200/60',
    showBanner: true,
  },
  DEV: {
    label: 'Development Mode',
    description: 'Developer environment detected. Features and data may be experimental.',
    tooltip: 'Development account with debug features enabled. Not intended for real client data.',
    classes: 'bg-blue-50 border-b border-blue-200 text-blue-900',
    badgeClasses: 'bg-blue-100 text-blue-800',
    icon: Code,
    iconClassName: 'text-blue-700',
    dismissButtonClassName: 'text-blue-800 hover:text-blue-900 hover:bg-blue-200/60',
    showBanner: true,
  },
  ADMIN: {
    label: 'Admin Account',
    description: 'Administrative tools enabled. Access limited to the MyoFlow admin panel.',
    tooltip: 'Admin account with elevated permissions. Use a therapist account for practice management.',
    classes: 'bg-red-50 border-b border-red-200 text-red-900',
    badgeClasses: 'bg-red-100 text-red-800',
    icon: Shield,
    iconClassName: 'text-red-700',
    dismissButtonClassName: 'text-red-800 hover:text-red-900 hover:bg-red-200/60',
    showBanner: true,
  },
  PRODUCTION: {
    label: 'Production Account',
    description: '',
    tooltip: '',
    classes: 'bg-emerald-50 border-b border-emerald-200 text-emerald-900',
    badgeClasses: 'bg-emerald-100 text-emerald-800',
    icon: AlertTriangle,
    iconClassName: '',
    dismissButtonClassName: '',
    showBanner: false,
  },
}

const DISMISS_KEY_PREFIX = 'myoflow-account-banner-dismissed'

export function getAccountTypeMeta(accountType: AccountTypeValue | undefined) {
  if (!accountType) {
    return ACCOUNT_TYPE_META.TEST
  }

  return ACCOUNT_TYPE_META[accountType] ?? ACCOUNT_TYPE_META.TEST
}

interface AccountTypeBadgeProps {
  accountType?: AccountTypeValue
  className?: string
}

export function AccountTypeBadge({ accountType, className }: AccountTypeBadgeProps) {
  const meta = getAccountTypeMeta(accountType)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        meta.badgeClasses,
        className
      )}
    >
      <span className="block h-2 w-2 rounded-full bg-current opacity-70" aria-hidden="true" />
      {meta.label}
    </span>
  )
}

export function AccountTypeBanner() {
  const { data: session, status } = useSession()
  const accountType = useMemo(
    () => (session?.user?.accountType as AccountTypeValue | undefined) ?? undefined,
    [session?.user?.accountType]
  )

  const meta = useMemo(() => getAccountTypeMeta(accountType), [accountType])
  const storageKey = useMemo(
    () => `${DISMISS_KEY_PREFIX}-${accountType ?? 'unknown'}`,
    [accountType]
  )
  const [isDismissed, setIsDismissed] = useState<boolean>(() => false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const tooltipId = useMemo(() => `account-type-tooltip-${accountType ?? 'unknown'}`, [accountType])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const stored = window.sessionStorage.getItem(storageKey)
      setIsDismissed(stored === 'true')
    } catch (error) {
      console.error('Unable to read banner dismissal state', error)
    }
  }, [storageKey])

  useEffect(() => {
    if (session?.user && meta.showBanner === false) {
      setIsDismissed(true)
    }
  }, [meta.showBanner, session?.user])

  if (status === 'loading' || !session?.user) {
    return null
  }

  if (!meta.showBanner || isDismissed) {
    return null
  }

  const Icon = meta.icon

  const handleDismiss = () => {
    setIsDismissed(true)

    if (typeof window === 'undefined') {
      return
    }

    try {
      window.sessionStorage.setItem(storageKey, 'true')
    } catch (error) {
      console.error('Unable to persist banner dismissal', error)
    }
  }

  return (
    <div className={cn('w-full', meta.classes)}>
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4 sm:h-10">
        <div className="flex items-center gap-3">
          <Icon className={cn('h-5 w-5 flex-shrink-0', meta.iconClassName)} aria-hidden="true" />
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <AccountTypeBadge accountType={accountType} />
            <p className="text-sm font-medium leading-tight">{meta.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setTooltipOpen(true)}
              onMouseLeave={() => setTooltipOpen(false)}
              onFocus={() => setTooltipOpen(true)}
              onBlur={() => setTooltipOpen(false)}
              aria-describedby={tooltipOpen ? tooltipId : undefined}
              className="inline-flex items-center rounded-full p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
            >
              <Info className="h-4 w-4 opacity-80" aria-hidden="true" />
            </button>
            {tooltipOpen && (
              <div
                id={tooltipId}
                role="tooltip"
                className="absolute right-0 top-full z-10 mt-2 max-w-xs rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-md"
              >
                {meta.tooltip}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500',
              meta.dismissButtonClassName
            )}
            aria-label="Dismiss account type banner"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
