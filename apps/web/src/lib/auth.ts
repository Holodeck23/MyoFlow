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
    therapist?: {
      id: string
      businessName?: string | null
      profileCompletionScore?: number | null
    }
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
  therapistProfileCompletionScore?: number | null
  therapistBusinessName?: string | null
}

const DEFAULT_ACCOUNT_TYPE = AccountType.TEST

async function resolveAccountContext(userId: string) {
  try {
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Therapist: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!userRecord) {
      return {
        accountType: DEFAULT_ACCOUNT_TYPE,
        role: 'OWNER' as const,
        therapistId: undefined,
        therapistProfile: undefined,
        email: undefined,
        isAdmin: false,
        isTestAccount: true,
      } as const
    }

    const therapistRecord = userRecord.Therapist?.id && typeof prisma.therapist?.findUnique === 'function'
      ? await prisma.therapist.findUnique({
          where: { id: userRecord.Therapist.id },
          select: {
            id: true,
            businessName: true,
            profileCompletionScore: true,
          },
        })
      : null

    const accountType = userRecord.accountType ?? DEFAULT_ACCOUNT_TYPE
    const role = (userRecord.role as MyoFlowToken['role']) || 'OWNER'
    const therapistId = userRecord.Therapist?.id

    return {
      accountType,
      role,
      therapistId,
      therapistProfile: therapistRecord
        ? {
            id: therapistRecord.id,
            businessName: therapistRecord.businessName ?? null,
            profileCompletionScore: therapistRecord.profileCompletionScore ?? 0,
          }
        : undefined,
      email: userRecord.email ?? undefined,
      isAdmin: role === 'SUPER_ADMIN' || role === 'OWNER' || accountType === AccountType.ADMIN,
      isTestAccount: accountType === AccountType.TEST,
    } as const
  } catch (error) {
    console.error('Failed to resolve account context', error)
    return {
      accountType: DEFAULT_ACCOUNT_TYPE,
      role: 'OWNER' as const,
      therapistId: undefined,
      therapistProfile: undefined,
      email: undefined,
      isAdmin: false,
      isTestAccount: true,
    } as const
  }
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax', // Required for localhost navigation
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
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

        // Normalize email to prevent case-sensitivity issues
        const email = (credentials.email as string).trim().toLowerCase()
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
          if (password === 'demo' || password === 'demo123') {
            // Find user by email to link to the correct account (email already normalized above)
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
          therapist: typedToken.therapistId
            ? {
                id: typedToken.therapistId,
                businessName: typedToken.therapistBusinessName ?? null,
                profileCompletionScore:
                  typeof typedToken.therapistProfileCompletionScore === 'number'
                    ? typedToken.therapistProfileCompletionScore
                  : null,
              }
            : undefined,
        },
      }
    },
    async jwt({ token, user, trigger }) {
      const userId = user?.id ?? token?.sub
      if (!userId) {
        return token
      }

      const runningInEdgeRuntime =
        (typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis) ||
        (typeof process !== 'undefined' && process.env?.NEXT_RUNTIME === 'edge')

      // In Edge runtime, ALWAYS skip Prisma - use cached token claims
      if (runningInEdgeRuntime) {
        return token
      }

      try {
        const context = await resolveAccountContext(userId)

        token.sub = userId
        if (user?.email) {
          token.email = user.email
        } else if (!token.email && context.email) {
          token.email = context.email
        }

        token.accountType = context.accountType
        token.role = context.role
        token.isAdmin = context.isAdmin
        token.isTestAccount = context.isTestAccount
        token.therapistId = context.therapistId ?? undefined
        token.therapistBusinessName = context.therapistProfile?.businessName ?? null
        token.therapistProfileCompletionScore = context.therapistProfile?.profileCompletionScore ?? null
      } catch (error) {
        console.error('Failed to refresh JWT session state', error)
      }

      return token
    },
  },
}

const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

export { handlers, auth, signIn, signOut }
export default auth
