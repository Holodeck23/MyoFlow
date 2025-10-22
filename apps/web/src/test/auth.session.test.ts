import { beforeEach, describe, expect, it, vi } from 'vitest'
const mockFindUnique = vi.hoisted(() => vi.fn())

vi.mock('@myoflow/db', () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
    },
    therapist: {
      findUnique: mockFindUnique,
    }
  },
}))

const nextAuthMock = vi.hoisted(() =>
  vi.fn(() => ({
    handlers: {},
    auth: (handler: any) => handler,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }))
)

vi.mock('next-auth', () => ({
  __esModule: true,
  default: nextAuthMock,
}))

import { AccountType } from '@prisma/client'
import { authConfig } from '@/lib/auth'
import type { MyoFlowSession, MyoFlowToken } from '@/lib/auth'

describe('auth callbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindUnique.mockReset()
    nextAuthMock.mockClear()
  })

  describe('jwt callback', () => {
    it('hydrates token with account type and admin flags on sign-in', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user-1',
        role: 'SUPER_ADMIN',
        accountType: AccountType.ADMIN,
        Therapist: { id: 'therapist-42' },
      })

      const token = await authConfig.callbacks?.jwt?.({
        token: { sub: 'user-1' } as unknown as MyoFlowToken,
        user: { id: 'user-1' } as any,
      } as any)

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: { Therapist: { select: { id: true } } },
      })
      expect(token?.accountType).toBe(AccountType.ADMIN)
      expect(token?.isAdmin).toBe(true)
      expect(token?.isTestAccount).toBe(false)
      expect(token?.therapistId).toBe('therapist-42')
    })

    it('defaults to TEST account when user missing in database', async () => {
      mockFindUnique.mockResolvedValue(null)

      const token = await authConfig.callbacks?.jwt?.({
        token: { sub: 'missing-user' } as unknown as MyoFlowToken,
      } as any)

      expect(token?.accountType).toBe(AccountType.TEST)
      expect(token?.isTestAccount).toBe(true)
      expect(token?.isAdmin).toBe(false)
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
})
