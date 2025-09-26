import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { prisma } from '@myoflow/db'
import { createAdminToken, setAdminTokenCookie, AdminUser } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'test' | 'production'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Reduce noisy logging in production
if (nodeEnv !== 'production') {
      console.log('Admin login attempt:', { email })
    }

    let adminUser: AdminUser | null = null

    // Optional development backdoor - guard behind env flag and non-production
    if (
process.env.AUTH_ENABLE_DEMO === 'true' &&
nodeEnv !== 'production' &&
      email === 'admin@myoflow.at' &&
      password === 'admin123'
    ) {
        console.log('Admin demo credentials matched')
      adminUser = {
        id: 'admin-user-id',
        email: email,
        name: 'Platform Admin',
        role: 'SUPER_ADMIN',
      }
    } else {
      // Check for admin user in database
      const user = await prisma.user.findUnique({
        where: { email: email },
      })

      // Verify user exists and has admin role
if (!user || !['SUPER_ADMIN', 'SUPPORT', 'FINANCE'].includes(user.role)) {
        if (nodeEnv !== 'production') {
          console.log('User not found or not admin role:', { userExists: !!user, role: user?.role })
        }
        return NextResponse.json({ error: 'Invalid credentials or insufficient permissions' }, { status: 401 })
      }

      // Check password for real admin users
      if (user.password) {
        const isValidPassword = await compare(password, user.password)
        if (isValidPassword) {
if (nodeEnv !== 'production') { console.log('Database admin user authenticated') }
          adminUser = {
            id: user.id,
            email: user.email,
            name: user.name || 'Admin User',
            role: user.role as 'SUPER_ADMIN' | 'SUPPORT' | 'FINANCE',
          }
        }
      }
    }

    if (!adminUser) {
if (nodeEnv !== 'production') { console.log('Invalid credentials for admin user') }
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Create secure JWT token
    const token = await createAdminToken(adminUser)

    // Create response with user data and set httpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: adminUser
    })

    // Set the admin token cookie
    response.cookies.set('admin-token', token, {
      httpOnly: true,
secure: nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Admin login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}