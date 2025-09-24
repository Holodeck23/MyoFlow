import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { PrismaClient } from '@myoflow/db'

const prisma = new PrismaClient()

const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      id: 'email-demo',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        // 1. Check for hardcoded test user
        if (email === 'test@myoflow.at' && password === 'demo123') {
          return {
            id: 'test-user-id',
            email: email,
            name: 'Dr. Sarah Müller',
            role: 'OWNER',
          }
        }

        // 2. Check for database user
        const user = await prisma.user.findUnique({
          where: { email: email },
          include: { Therapist: true },
        })

        if (user && user.password) {
          const isValidPassword = await compare(password, user.password)
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

        // 3. Fallback to demo password for any user
        // This is a temporary measure for testing and should be removed
        if (password === 'demo') {
          // Find user by email to link to the correct account
          const demoUser = await prisma.user.findUnique({
            where: { email: email },
            include: { Therapist: true },
          });

          if (demoUser) {
            return {
              id: demoUser.id,
              email: demoUser.email,
              name: demoUser.name,
              role: demoUser.role,
              therapistId: demoUser.Therapist?.id,
              subscriptionStatus: demoUser.subscriptionStatus,
              trialEndsAt: demoUser.trialEndsAt,
            }
          }

          // If user doesn't exist, create a temporary session
          return {
            id: email,
            email: email,
            name: email.split('@')[0],
            role: 'OWNER',
          }
        }

        return null
      },
    }),
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        // Check for admin user in database
        const user = await prisma.user.findUnique({
          where: { email: email },
          include: { Therapist: true },
        })

        // Verify user exists and has admin role
        if (!user || !['SUPER_ADMIN', 'SUPPORT', 'FINANCE'].includes(user.role)) {
          return null
        }

        // For development - hardcoded admin credentials
        if (email === 'admin@myoflow.at' && password === 'admin123') {
          return {
            id: 'admin-user-id',
            email: email,
            name: 'Platform Admin',
            role: 'SUPER_ADMIN',
          }
        }

        // Check password for real admin users
        if (user.password) {
          const isValidPassword = await compare(password, user.password)
          if (isValidPassword) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            }
          }
        }

        return null
      },
    }),
  ],
  pages: {
    signIn: '/auth/sign-in',
  },
  callbacks: {
    async session({ session, token }: any) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as string
      }
      return session
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.sub = user.id
        token.role = user.role
      }
      return token
    },
  },
})

export { handlers, auth, signIn, signOut }
export default auth
