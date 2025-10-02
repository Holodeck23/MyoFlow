import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { getAdminJwtSecret } from './config-validation'

// Admin user interface
export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'SUPPORT' | 'FINANCE'
}

// JWT secret for admin tokens (validated at boot time)
const ADMIN_JWT_SECRET = getAdminJwtSecret()

const ADMIN_TOKEN_COOKIE = 'admin-token'
const TOKEN_EXPIRY = '24h'

/**
 * Create a secure admin JWT token
 */
export async function createAdminToken(adminUser: AdminUser): Promise<string> {
  return await new SignJWT({
    sub: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    role: adminUser.role
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(ADMIN_JWT_SECRET)
}

/**
 * Verify and decode admin JWT token
 */
export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET)

    if (!payload.sub || !payload.email || !payload.role) {
      return null
    }

    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as 'SUPER_ADMIN' | 'SUPPORT' | 'FINANCE'
    }
  } catch (error) {
    console.error('Admin token verification failed:', error)
    return null
  }
}

/**
 * Set admin token as httpOnly cookie
 */
export function setAdminTokenCookie(token: string): NextResponse {
  const response = NextResponse.json({ success: true })

  response.cookies.set(ADMIN_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  })

  return response
}

/**
 * Clear admin token cookie
 */
export function clearAdminTokenCookie(): NextResponse {
  const response = NextResponse.json({ success: true })

  response.cookies.delete(ADMIN_TOKEN_COOKIE)

  return response
}

/**
 * Get admin user from request cookies (server-side)
 */
export async function getAdminUserFromCookies(): Promise<AdminUser | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(ADMIN_TOKEN_COOKIE)?.value

    if (!token) {
      return null
    }

    return await verifyAdminToken(token)
  } catch (error) {
    console.error('Error getting admin user from cookies:', error)
    return null
  }
}

/**
 * Server-side admin authentication check for client components
 * Use this by calling it from a server component and passing the result as props
 *
 * @deprecated Use getAdminUserFromCookies() in server components instead
 * Client-side auth checks are not possible with httpOnly cookies (by design for security)
 */
export function useAdminAuth() {
  console.warn('useAdminAuth() is deprecated. Use getAdminUserFromCookies() in server components.')
  return false
}

/**
 * Middleware to protect admin API routes
 */
export async function withAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest, adminUser: AdminUser) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No admin token' }, { status: 401 })
    }

    const adminUser = await verifyAdminToken(token)

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized - Invalid admin token' }, { status: 401 })
    }

    // Verify admin role
    if (!['SUPER_ADMIN', 'SUPPORT', 'FINANCE'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 })
    }

    return await handler(request, adminUser)
  } catch (error) {
    console.error('Admin auth middleware error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Check if user has specific admin permissions
 */
export function hasAdminPermission(adminUser: AdminUser | null, requiredRoles: string[]): boolean {
  if (!adminUser) return false
  return requiredRoles.includes(adminUser.role)
}