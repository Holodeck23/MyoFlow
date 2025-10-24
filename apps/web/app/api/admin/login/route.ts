import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { prisma } from '@myoflow/db'
import { createAdminToken, setAdminTokenCookie, AdminUser } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const isProduction = process.env.NODE_ENV === 'production'

export async function POST(request: Request) {
  try {
    const contentLengthHeader = request.headers.get('content-length')
    const hasBody = contentLengthHeader !== null ? Number(contentLengthHeader) > 0 : true

    if (!hasBody) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    let credentials: { email?: unknown; password?: unknown } | null = null

    try {
      credentials = await request.json()
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const email = typeof credentials?.email === 'string' ? credentials.email : ''
    const password = typeof credentials?.password === 'string' ? credentials.password : ''

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    let adminUser: AdminUser | null = null
    const allowDemoAuth = process.env.AUTH_ENABLE_DEMO === 'true' && !isProduction

    // Optional development backdoor - guard behind env flag and non-production
    if (
      allowDemoAuth &&
      email === 'admin@myoflow.at' &&
      password === 'admin123'
    ) {
      if (!isProduction) {
        console.info('Admin demo credentials matched')
      }
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
        return NextResponse.json({ error: 'Invalid credentials or insufficient permissions' }, { status: 401 })
      }

      // Check password for real admin users
      if (user.password) {
        const isValidPassword = await compare(password, user.password)
        if (isValidPassword) {
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
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Create secure JWT token
    const token = await createAdminToken(adminUser)

    // Create response with user data and set httpOnly cookie via shared helper
    const response = setAdminTokenCookie(token, {
      success: true,
      user: adminUser,
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
