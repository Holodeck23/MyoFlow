import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockUserFindUnique = vi.hoisted(() => vi.fn())
const mockAuthImplementation = vi.hoisted(() =>
  vi.fn(async () => ({
    user: {
      id: 'session-user',
      email: 'session@example.com',
    },
  }))
)

const nextAuthMock = vi.hoisted(() =>
  vi.fn(() => ({
    handlers: {},
    auth: mockAuthImplementation,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }))
)

vi.mock('@myoflow/db', () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
    },
  },
}))

vi.mock('next-auth', () => ({
  __esModule: true,
  default: nextAuthMock,
}))

import { AccountType } from '@prisma/client'
import { authConfig, auth, authDiagnostics, resetAuthDiagnostics } from '@/lib/auth'
import type { MyoFlowSession, MyoFlowToken } from '@/lib/auth'

const originalNextRuntime = process.env.NEXT_RUNTIME

describe('auth callbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserFindUnique.mockReset()
    mockAuthImplementation.mockReset()
    mockAuthImplementation.mockImplementation(async () => ({
      user: {
        id: 'session-user',
        email: 'session@example.com',
      },
    }))
    resetAuthDiagnostics()
    process.env.NEXT_RUNTIME = originalNextRuntime
  })

  afterEach(() => {
    process.env.NEXT_RUNTIME = originalNextRuntime
  })

  describe('jwt callback', () => {
    it('hydrates token with account type and admin flags on sign-in', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'user-1',
        role: 'SUPER_ADMIN',
        accountType: AccountType.ADMIN,
        email: 'owner@example.com',
        Therapist: {
          id: 'therapist-42',
          businessName: 'Test Practice',
          profileCompletionScore: 85,
        },
      })

      const token = await authConfig.callbacks?.jwt?.({
        token: { sub: 'user-1' } as unknown as MyoFlowToken,
        user: { id: 'user-1', email: 'owner@example.com' } as any,
      } as any)

      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: {
          Therapist: {
            select: {
              id: true,
              businessName: true,
              profileCompletionScore: true,
            },
          },
        },
      })
      expect(token?.accountType).toBe(AccountType.ADMIN)
      expect(token?.isAdmin).toBe(true)
      expect(token?.therapistId).toBe('therapist-42')
      expect(token?.therapistBusinessName).toBe('Test Practice')
      expect(token?.therapistProfileCompletionScore).toBe(85)
    })

    it('skips database lookups in edge runtime and retains token claims', async () => {
      const tokenSnapshot: MyoFlowToken = {
        sub: 'user-1',
        role: 'OWNER',
        accountType: AccountType.TEST,
        isAdmin: false,
        isTestAccount: true,
      } as MyoFlowToken

      const originalEnv = process.env.NEXT_RUNTIME
      process.env.NEXT_RUNTIME = 'edge'

      const token = await authConfig.callbacks?.jwt?.({
        token: tokenSnapshot,
      } as any)

      expect(mockUserFindUnique).not.toHaveBeenCalled()
      expect(token).toMatchObject(tokenSnapshot)

      process.env.NEXT_RUNTIME = originalEnv
    })

    it('skips database lookups for regular session checks (cached token)', async () => {
      const cachedToken: MyoFlowToken = {
        sub: 'user-1',
        email: 'test@example.com',
        role: 'OWNER',
        accountType: AccountType.TEST,
        isAdmin: false,
        isTestAccount: true,
        therapistId: 'therapist-42',
        therapistBusinessName: 'Test Practice',
        therapistProfileCompletionScore: 85,
      } as MyoFlowToken

      const token = await authConfig.callbacks?.jwt?.({
        token: cachedToken,
        user: undefined,
        trigger: undefined,
      } as any)

      expect(mockUserFindUnique).not.toHaveBeenCalled()
      expect(token).toMatchObject(cachedToken)
    })

    it('rehydrates token on explicit update trigger', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'user-1',
        role: 'OWNER',
        accountType: AccountType.TEST,
        email: 'owner@example.com',
        Therapist: null,
      })

      await authConfig.callbacks?.jwt?.({
        token: { sub: 'user-1' } as unknown as MyoFlowToken,
        trigger: 'update',
      } as any)

      expect(mockUserFindUnique).toHaveBeenCalledTimes(1)
    })

    it('repairs missing claims by rehydrating from database', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'user-1',
        role: 'OWNER',
        accountType: AccountType.TEST,
        email: 'owner@example.com',
        Therapist: {
          id: 'therapist-99',
          businessName: 'Repair Practice',
          profileCompletionScore: 72,
        },
      })

      const repairedToken = await authConfig.callbacks?.jwt?.({
        token: {
          sub: 'user-1',
          email: '',
          role: '',
          accountType: undefined,
        } as unknown as MyoFlowToken,
        user: undefined,
      } as any)

      expect(mockUserFindUnique).toHaveBeenCalledTimes(1)
      expect(repairedToken?.email).toBe('owner@example.com')
      expect(repairedToken?.therapistId).toBe('therapist-99')
    })

    it('defaults to TEST account when user missing in database', async () => {
      mockUserFindUnique.mockResolvedValue(null)

      const token = await authConfig.callbacks?.jwt?.({
        token: { sub: 'missing-user' } as unknown as MyoFlowToken,
        user: { id: 'missing-user' } as any,
      } as any)

      expect(token?.accountType).toBe(AccountType.TEST)
      expect(token?.isTestAccount).toBe(true)
      expect(token?.isAdmin).toBe(false)
    })

    it('maintains session claims across multi-page navigation without re-querying DB', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'user-1',
        role: 'OWNER',
        accountType: AccountType.TEST,
        email: 'owner@example.com',
        Therapist: {
          id: 'therapist-10',
          businessName: 'Flow Practice',
          profileCompletionScore: 90,
        },
      })

      let tokenState = (await authConfig.callbacks?.jwt?.({
        token: { sub: 'user-1' } as unknown as MyoFlowToken,
        user: { id: 'user-1', email: 'owner@example.com' } as any,
      } as any)) as MyoFlowToken

      expect(mockUserFindUnique).toHaveBeenCalledTimes(1)
      mockUserFindUnique.mockClear()

      const navigationSteps = ['dashboard', 'settings', 'clients', 'calendar', 'dashboard']
      for (const step of navigationSteps) {
        tokenState = (await authConfig.callbacks?.jwt?.({
          token: tokenState as MyoFlowToken,
          user: undefined,
        } as any)) as MyoFlowToken
        expect(tokenState?.therapistBusinessName).toBe('Flow Practice')
      }

      expect(mockUserFindUnique).not.toHaveBeenCalled()
    })
  })

  describe('session callback', () => {
    it('exposes account type flags on the session user', async () => {
      const session = (await authConfig.callbacks?.session?.({
        session: {
          user: {
            id: 'user-1',
            email: 'therapist@example.com',
            name: 'Therapist Example',
            image: null,
            role: 'OWNER',
          },
        },
        token: {
          sub: 'user-1',
          accountType: AccountType.TEST,
          isTestAccount: true,
          isAdmin: false,
          role: 'OWNER',
        },
      } as any)) as MyoFlowSession

      expect(session.user.accountType).toBe(AccountType.TEST)
      expect(session.user.isTestAccount).toBe(true)
      expect(session.user.isAdmin).toBe(false)
    })
  })

  describe('auth() performance diagnostics', () => {
    it('records auth() call durations under 500ms', async () => {
      await auth()
      expect(authDiagnostics.performance.lastSampleMs).toBeGreaterThanOrEqual(0)
      expect(authDiagnostics.performance.lastSampleMs).toBeLessThan(500)
    })

    it('handles concurrent auth() calls efficiently', async () => {
      await Promise.all(Array.from({ length: 50 }, () => auth()))
      expect(authDiagnostics.performance.sampleCount).toBeGreaterThan(0)
      expect(authDiagnostics.performance.averageMs).toBeLessThan(100)
    })
  })
})
