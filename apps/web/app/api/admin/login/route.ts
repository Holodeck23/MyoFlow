import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { PrismaClient } from '@myoflow/db'
import { signIn } from 'next-auth/react'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    console.log('Admin login attempt:', { email })

    // For development - hardcoded admin credentials
    if (email === 'admin@myoflow.at' && password === 'admin123') {
      console.log('Admin credentials matched')

      // Create a session for the admin user
      // We'll use a simple approach here - return success and let the client handle the session
      return NextResponse.json({
        success: true,
        user: {
          id: 'admin-user-id',
          email: email,
          name: 'Platform Admin',
          role: 'SUPER_ADMIN',
        }
      })
    }

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
        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        })
      }
    }

    console.log('Invalid password for admin user')
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  } catch (error) {
    console.error('Admin login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}