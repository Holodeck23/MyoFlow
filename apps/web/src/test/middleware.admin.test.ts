import { describe, expect, it, vi } from 'vitest'
vi.mock('@/lib/auth', () => ({
  __esModule: true,
  default: (handler: any) => handler,
}))
import { NextResponse } from 'next/server'
import { middlewareLogic } from '~/middleware'
import { AccountType } from '@prisma/client'
import type { MyoFlowSession } from '@/lib/auth'

function createRequest(pathname: string, session?: Partial<MyoFlowSession['user']>) {
  const url = `https://example.com${pathname}`
  const request = {
    nextUrl: new URL(url),
    url,
    auth: session
      ? ({
          user: {
            id: 'user-1',
            email: 'user@example.com',
            name: 'Test User',
            role: 'OWNER',
            therapistId: undefined,
            organizationId: undefined,
            accountType: session.accountType ?? AccountType.TEST,
            isTestAccount: session.isTestAccount ?? session.accountType === AccountType.TEST,
            isAdmin: session.isAdmin ?? session.accountType === AccountType.ADMIN,
          },
        } as unknown as MyoFlowSession)
      : undefined,
  }

  return request as unknown as Parameters<typeof middlewareLogic>[0]
}

describe('middleware admin segregation', () => {
  it('redirects admin accounts away from dashboard paths', () => {
    const req = createRequest('/dashboard', {
      accountType: AccountType.ADMIN,
      isAdmin: true,
      isTestAccount: false,
    })

    const response = middlewareLogic(req)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.headers.get('location')).toBe('https://example.com/admin')
  })

  it('redirects non-admin accounts away from admin routes', () => {
    const req = createRequest('/admin/settings', {
      accountType: AccountType.TEST,
      isTestAccount: true,
      isAdmin: false,
    })

    const response = middlewareLogic(req)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.headers.get('location')).toBe('https://example.com/dashboard?error=unauthorized')
  })

  it('allows admin accounts to stay on admin routes', () => {
    const req = createRequest('/admin/reports', {
      accountType: AccountType.ADMIN,
      isAdmin: true,
      isTestAccount: false,
    })

    const response = middlewareLogic(req)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.headers.get('location')).toBeNull()
  })
})
