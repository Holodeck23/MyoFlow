import NextAuth, { type Session, type User, type NextAuthConfig } from 'next-auth'
import { type JWT } from 'next-auth/jwt'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@myoflow/db'
import { AccountType } from '@prisma/client'

/**
 * Extended session interface with MyoFlow-specific fields
 */
export interface MyoFlowSession extends Session {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: string
    therapistId?: string
    organizationId?: string
    accountType: AccountType
    isTestAccount: boolean
    isAdmin: boolean
  }
}

/**
 * Extended JWT token interface with MyoFlow-specific claims
 */
export interface MyoFlowToken extends JWT {
  sub: string
  role: string
  therapistId?: string
  organizationId?: string
  accountType: AccountType
  isTestAccount: boolean
  isAdmin: boolean
}

const DEFAULT_ACCOUNT_TYPE = AccountType.TEST

async function resolveAccountContext(userId: string) {
  try {
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      include: { Therapist: { select: { id: true } } },
    })

    if (!userRecord) {
      return {
        accountType: DEFAULT_ACCOUNT_TYPE,
        role: 'OWNER',
        therapistId: undefined,
      } as const
    }

    return {
      accountType: userRecord.accountType ?? DEFAULT_ACCOUNT_TYPE,
      role: (userRecord.role as MyoFlowToken['role']) || 'OWNER',
      therapistId: userRecord.Therapist?.id,
    } as const
  } catch (error) {
    console.error('Failed to resolve account context', error)
    return {
      accountType: DEFAULT_ACCOUNT_TYPE,
      role: 'OWNER' as const,
      therapistId: undefined,
    } as const
  }
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
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

        // Check for database user
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

        // 3. Optional demo password fallback (dev only)
        if (process.env.AUTH_ENABLE_DEMO === 'true' && process.env.NODE_ENV !== 'production') {
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
        }

        return null
      },
    }),
  ],
  pages: {
    signIn: '/auth/sign-in',
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }): Promise<MyoFlowSession> {
      const typedToken = token as MyoFlowToken

      return {
        ...session,
        user: {
          id: typedToken.sub,
          email: session.user?.email || '',
          name: session.user?.name,
          image: session.user?.image,
          role: typedToken.role || 'OWNER',
          therapistId: typedToken.therapistId,
          organizationId: typedToken.organizationId,
          accountType: typedToken.accountType ?? DEFAULT_ACCOUNT_TYPE,
          isTestAccount: typedToken.isTestAccount ?? (typedToken.accountType === AccountType.TEST),
          isAdmin: typedToken.isAdmin ?? (typedToken.accountType === AccountType.ADMIN),
        },
      }
    },
    async jwt({ token, user }: { token: JWT; user?: User }): Promise<MyoFlowToken> {
      const typedToken = token as MyoFlowToken

      let accountType = typedToken?.accountType ?? DEFAULT_ACCOUNT_TYPE
      let role = typedToken?.role || 'OWNER'
      let therapistId = typedToken?.therapistId
      let organizationId = typedToken?.organizationId

      const userId = user?.id || typedToken.sub

      const isEdgeRuntime = typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge'

      if (userId && !isEdgeRuntime) {
        const context = await resolveAccountContext(userId)

        accountType = context.accountType ?? DEFAULT_ACCOUNT_TYPE
        role = context.role || 'OWNER'
        therapistId = context.therapistId ?? therapistId
      }

      if (isEdgeRuntime && typedToken?.accountType) {
        accountType = typedToken.accountType
      }

      if (user && (user as any).organizationId) {
        organizationId = (user as any).organizationId
      }

      if (user && (user as any).therapistId && !therapistId) {
        therapistId = (user as any).therapistId
      }

      return {
        ...typedToken,
        ...(user
          ? {
              role: (user as any).role || role,
            }
          : {}),
        sub: userId || typedToken.sub,
        role,
        therapistId,
        organizationId,
        accountType,
        isTestAccount: accountType === AccountType.TEST,
        isAdmin: accountType === AccountType.ADMIN,
      }
    },
  },
}

const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

export { handlers, auth, signIn, signOut }
export default auth
