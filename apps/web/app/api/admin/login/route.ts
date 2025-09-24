import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { PrismaClient } from '@myoflow/db'
import { createAdminToken, setAdminTokenCookie, AdminUser } from '@/lib/admin-auth'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    console.log('Admin login attempt:', { email })

    let adminUser: AdminUser | null = null

    // For development - hardcoded admin credentials
    if (email === 'admin@myoflow.at' && password === 'admin123') {
      console.log('Admin credentials matched')
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
        console.log('User not found or not admin role:', { userExists: !!user, role: user?.role })
        return NextResponse.json({ error: 'Invalid credentials or insufficient permissions' }, { status: 401 })
      }

      // Check password for real admin users
      if (user.password) {
        const isValidPassword = await compare(password, user.password)
        if (isValidPassword) {
          console.log('Database admin user authenticated')
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
      console.log('Invalid credentials for admin user')
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
      secure: process.env.NODE_ENV === 'production',
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