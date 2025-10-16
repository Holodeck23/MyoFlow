import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AccountTypeBanner, AccountTypeBadge, getAccountTypeMeta } from '@/components/ui/AccountTypeBanner'

type MockAccountType = 'TEST' | 'PRODUCTION' | 'ADMIN' | 'DEV'

const mockUseSession = vi.hoisted(() => vi.fn())

vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}))

interface MockSessionUser {
  id?: string
  email?: string
  name?: string
  accountType: MockAccountType
  isTestAccount?: boolean
  isAdmin?: boolean
}

const buildSession = (user: MockSessionUser) => ({
  data: {
    user: {
      id: user.id ?? 'user-1',
      email: user.email ?? 'therapist@example.com',
      name: user.name ?? 'Therapist Example',
      accountType: user.accountType,
      isTestAccount: user.isTestAccount ?? user.accountType === 'TEST',
      isAdmin: user.isAdmin ?? user.accountType === 'ADMIN',
    },
  },
  status: 'authenticated' as const,
})

describe('AccountTypeBanner', () => {
  beforeEach(() => {
    mockUseSession.mockReset()
  })

  it('renders the TEST banner with yellow styling', () => {
    mockUseSession.mockReturnValue(buildSession({ accountType: 'TEST' }))

    const html = renderToStaticMarkup(<AccountTypeBanner />)

    expect(html).toContain('Test Account')
    expect(html).toContain('bg-yellow-50')
  })

  it('renders the DEV banner with blue styling', () => {
    mockUseSession.mockReturnValue(buildSession({ accountType: 'DEV' }))

    const html = renderToStaticMarkup(<AccountTypeBanner />)

    expect(html).toContain('Development Mode')
    expect(html).toContain('bg-blue-50')
  })

  it('renders the ADMIN banner with red styling', () => {
    mockUseSession.mockReturnValue(buildSession({ accountType: 'ADMIN', isAdmin: true }))

    const html = renderToStaticMarkup(<AccountTypeBanner />)

    expect(html).toContain('Admin Account')
    expect(html).toContain('bg-red-50')
  })

  it('does not render a banner for production accounts', () => {
    mockUseSession.mockReturnValue(buildSession({ accountType: 'PRODUCTION', isAdmin: false, isTestAccount: false }))

    const html = renderToStaticMarkup(<AccountTypeBanner />)

    expect(html).toBe('')
  })
})

describe('AccountType utilities', () => {
  it('returns badge details for each account type', () => {
    const types: MockAccountType[] = ['TEST', 'DEV', 'ADMIN', 'PRODUCTION']
    types.forEach((type) => {
      const meta = getAccountTypeMeta(type)
      expect(meta.label.length).toBeGreaterThan(0)
    })
  })

  it('renders account type badge with matching label', () => {
    const badgeHtml = renderToStaticMarkup(<AccountTypeBadge accountType="TEST" />)
    expect(badgeHtml).toContain('Test Account')
  })
})
