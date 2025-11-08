import { beforeAll, describe, expect, it } from 'vitest'

let setAdminTokenCookie: (typeof import('@/lib/admin-auth'))['setAdminTokenCookie']

beforeAll(async () => {
  if (!process.env.ADMIN_JWT_SECRET || process.env.ADMIN_JWT_SECRET.length < 32) {
    process.env.ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET && process.env.ADMIN_JWT_SECRET.length >= 32
      ? process.env.ADMIN_JWT_SECRET
      : 'admin-jwt-secret-for-tests-32-chars!!'
  }

  const adminAuthModule = await import('@/lib/admin-auth')
  setAdminTokenCookie = adminAuthModule.setAdminTokenCookie
})

describe('admin auth helpers', () => {
  it('sets admin token cookie with provided payload', async () => {
    const payload = { success: true, user: { id: 'admin-1', role: 'SUPER_ADMIN' } }
    const response = setAdminTokenCookie('signed-token', payload)

    await expect(response.json()).resolves.toEqual(payload)

    const setCookie = response.headers.get('set-cookie')
    expect(setCookie).toBeTruthy()
    const cookieHeader = setCookie ?? ''

    expect(cookieHeader).toContain('admin-token=')
    expect(cookieHeader).toContain('HttpOnly')
    expect(cookieHeader.toLowerCase()).toContain('samesite=lax')
    expect(cookieHeader).toContain('Path=/')
  })
})
