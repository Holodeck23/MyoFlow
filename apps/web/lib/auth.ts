import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { PrismaClient } from '@myoflow/db'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth - temporarily disabled due to missing credentials
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    // Email demo authentication
    CredentialsProvider({
      id: 'email-demo',
      name: 'Email',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Check for database user first
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { Therapist: true }
          })

          if (user && user.password) {
            // Verify password for database users
            const isValidPassword = await compare(credentials.password, user.password)
            if (isValidPassword) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                therapistId: user.Therapist?.id,
                subscriptionStatus: user.subscriptionStatus,
                trialEndsAt: user.trialEndsAt,
              }
            }
          }

          // Fallback to demo authentication for testing
          if (credentials.email === 'test@myoflow.at' && credentials.password === 'demo123') {
            return {
              id: 'test-user-id',
              email: credentials.email,
              name: 'Dr. Sarah Müller',
              role: 'OWNER',
            }
          }

          // For demo, accept any email with password "demo"
          if (credentials.password === 'demo') {
            return {
              id: credentials.email,
              email: credentials.email,
              name: credentials.email.split('@')[0],
              role: 'OWNER',
            }
          }

          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        } finally {
          await prisma.$disconnect()
        }
      }
    }),
  ],
  pages: {
    signIn: '/auth/sign-in',
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
        if (token.role) {
          session.user.role = token.role
        }
      }
      return session
    },
    async jwt({ user, token }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
