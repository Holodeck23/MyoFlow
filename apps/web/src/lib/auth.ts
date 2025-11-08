import NextAuth, { type Session, type NextAuthConfig } from 'next-auth'
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
const JWT_CACHE_TTL_MS = Number(process.env.AUTH_JWT_CACHE_TTL_MS ?? 5 * 60 * 1000)
const JWT_CACHE_MAX_ENTRIES = 500
const AUTH_SLOW_THRESHOLD_MS = Number(process.env.AUTH_PERF_WARN_MS ?? 500)
const AUTH_LOGGING_ENABLED = process.env.AUTH_LOG_LEVEL !== 'silent'

interface AccountContext {
  accountType: AccountType
  role: MyoFlowToken['role']
  therapistId?: string
  therapistProfile?: {
    id: string
    businessName: string | null
    profileCompletionScore: number | null
  }
  email?: string
  isAdmin: boolean
  isTestAccount: boolean
}

interface JwtCacheEntry {
  expiresAt: number
  context: AccountContext
}

type Runtime = 'edge' | 'node'

type AuthHandler = ReturnType<typeof NextAuth>['auth']

const jwtClaimCache = new Map<string, JwtCacheEntry>()
const inflightHydrations = new Map<string, Promise<AccountContext>>()

const jwtCacheMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  cacheRepairs: 0,
  edgeSkips: 0,
  hydrations: 0,
}

const authPerformanceSamples: number[] = []
let lastAuthSampleMs = 0

function defaultAccountContext(): AccountContext {
  return {
    accountType: DEFAULT_ACCOUNT_TYPE,
    role: 'OWNER',
    therapistId: undefined,
    therapistProfile: undefined,
    email: undefined,
    isAdmin: false,
    isTestAccount: true,
  }
}

function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now()
  }
  return Date.now()
}

function detectRuntime(): Runtime {
  if (typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis) {
    return 'edge'
  }
  if (typeof process !== 'undefined' && process.env?.NEXT_RUNTIME === 'edge') {
    return 'edge'
  }
  return 'node'
}

function shouldRepairToken(token: Partial<MyoFlowToken> | undefined): boolean {
  if (!token) {
    return true
  }

  const missingCoreClaims = !token.accountType || !token.role || !token.email
  const missingTherapistContext = Boolean(token.therapistId) && typeof token.therapistBusinessName === 'undefined'

  return missingCoreClaims || missingTherapistContext
}

function coalesceEmail(
  userEmail?: string | null,
  tokenEmail?: string | null,
  contextEmail?: string | null
) {
  for (const candidate of [userEmail, tokenEmail, contextEmail]) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate
    }
  }
  return ''
}

function evictExpiredCacheEntries() {
  if (jwtClaimCache.size <= JWT_CACHE_MAX_ENTRIES) {
    return
  }

  const iterator = jwtClaimCache.keys()
  while (jwtClaimCache.size > JWT_CACHE_MAX_ENTRIES) {
    const oldestKey = iterator.next().value
    if (!oldestKey) {
      break
    }
    jwtClaimCache.delete(oldestKey)
  }
}

function computeAverage(values: number[]): number {
  if (!values.length) {
    return 0
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function computeP95(values: number[]): number {
  if (!values.length) {
    return 0
  }
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1)
  return sorted[index]
}

function logAuth(level: 'log' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
  if (!AUTH_LOGGING_ENABLED || process.env.NODE_ENV === 'test') {
    return
  }
  const payload = {
    ...meta,
    timestamp: new Date().toISOString(),
  }
  console[level](`[AUTH] ${message}`, payload)
}

export function obfuscateIdentifier(value?: string | null) {
  if (!value) {
    return undefined
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  if (!trimmed.includes('@')) {
    if (trimmed.length <= 4) {
      return `${trimmed.at(0) ?? ''}***`
    }
    return `${trimmed.slice(0, 2)}***${trimmed.at(-1) ?? ''}`
  }

  const [local, domain] = trimmed.split('@')
  if (!domain) {
    return `${local?.at(0) ?? ''}***`
  }
  return `${local?.at(0) ?? ''}***@${domain}`
}

async function resolveAccountContext(userId: string): Promise<AccountContext> {
  try {
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Therapist: {
          select: {
            id: true,
            businessName: true,
            profileCompletionScore: true,
          },
        },
      },
    })

    if (!userRecord) {
      logAuth('warn', 'User missing while hydrating JWT', { userId: obfuscateIdentifier(userId) })
      return defaultAccountContext()
    }

    const therapistProfile = userRecord.Therapist
      ? {
          id: userRecord.Therapist.id,
          businessName: userRecord.Therapist.businessName ?? null,
          profileCompletionScore: userRecord.Therapist.profileCompletionScore ?? null,
        }
      : undefined

    const accountType = userRecord.accountType ?? DEFAULT_ACCOUNT_TYPE
    const role = (userRecord.role as MyoFlowToken['role']) || 'OWNER'

    return {
      accountType,
      role,
      therapistId: therapistProfile?.id,
      therapistProfile,
      email: userRecord.email ?? undefined,
      isAdmin: role === 'SUPER_ADMIN' || role === 'OWNER' || accountType === AccountType.ADMIN,
      isTestAccount: accountType === AccountType.TEST,
    }
  } catch (error) {
    logAuth('error', 'Failed to resolve account context', {
      userId: obfuscateIdentifier(userId),
      error: error instanceof Error ? error.message : String(error),
    })
    return defaultAccountContext()
  }
}

async function getAccountContext(
  userId: string,
  { forceRefresh = false }: { forceRefresh?: boolean } = {}
): Promise<AccountContext> {
  const now = Date.now()
  const cachedEntry = jwtClaimCache.get(userId)

  if (!forceRefresh && cachedEntry && cachedEntry.expiresAt > now) {
    jwtCacheMetrics.cacheHits += 1
    return cachedEntry.context
  }

  jwtCacheMetrics.cacheMisses += 1

  let pendingLookup = inflightHydrations.get(userId)
  if (!pendingLookup) {
    pendingLookup = resolveAccountContext(userId)
    inflightHydrations.set(userId, pendingLookup)
  }

  const context = await pendingLookup
  inflightHydrations.delete(userId)

  jwtClaimCache.set(userId, {
    context,
    expiresAt: Date.now() + JWT_CACHE_TTL_MS,
  })
  evictExpiredCacheEntries()

  jwtCacheMetrics.hydrations += 1
  return context
}

function logTokenExpiryIfNeeded(token: JWT, userId: string) {
  if (!AUTH_LOGGING_ENABLED || typeof token?.exp !== 'number' || process.env.NODE_ENV === 'test') {
    return
  }
  const secondsUntilExpiry = token.exp - Math.floor(Date.now() / 1000)
  if (secondsUntilExpiry <= 60) {
    logAuth('warn', 'JWT token expiring soon', {
      userId: obfuscateIdentifier(userId),
      secondsUntilExpiry,
    })
  }
}

function recordAuthSample(duration: number) {
  lastAuthSampleMs = duration
  authPerformanceSamples.push(duration)
  if (authPerformanceSamples.length > 100) {
    authPerformanceSamples.shift()
  }

  if (duration > AUTH_SLOW_THRESHOLD_MS) {
    logAuth('warn', 'auth() call exceeded performance threshold', {
      durationMs: Math.round(duration),
      thresholdMs: AUTH_SLOW_THRESHOLD_MS,
    })
  }
}

export const authDiagnostics = {
  performance: {
    get lastSampleMs() {
      return lastAuthSampleMs
    },
    get averageMs() {
      return computeAverage(authPerformanceSamples)
    },
    get p95Ms() {
      return computeP95(authPerformanceSamples)
    },
    get sampleCount() {
      return authPerformanceSamples.length
    },
  },
  jwtCache: {
    get cacheHits() {
      return jwtCacheMetrics.cacheHits
    },
    get cacheMisses() {
      return jwtCacheMetrics.cacheMisses
    },
    get cacheRepairs() {
      return jwtCacheMetrics.cacheRepairs
    },
    get edgeSkips() {
      return jwtCacheMetrics.edgeSkips
    },
    get hydrations() {
      return jwtCacheMetrics.hydrations
    },
  },
}

export function resetAuthDiagnostics() {
  jwtClaimCache.clear()
  inflightHydrations.clear()
  authPerformanceSamples.length = 0
  lastAuthSampleMs = 0
  jwtCacheMetrics.cacheHits = 0
  jwtCacheMetrics.cacheMisses = 0
  jwtCacheMetrics.cacheRepairs = 0
  jwtCacheMetrics.edgeSkips = 0
  jwtCacheMetrics.hydrations = 0
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
          where: { email },
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

        // Optional demo password fallback (dev only)
        if (process.env.AUTH_ENABLE_DEMO === 'true' && process.env.NODE_ENV !== 'production') {
          if (password === 'demo' || password === 'demo123') {
            const demoUser = await prisma.user.findUnique({
              where: { email },
              include: { Therapist: true },
            })

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
              email,
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

      const runtime = detectRuntime()
      logTokenExpiryIfNeeded(token, userId)

      if (runtime === 'edge') {
        jwtCacheMetrics.edgeSkips += 1
        return token
      }

      const tokenNeedsRepair = shouldRepairToken(token as MyoFlowToken)
      const shouldReturnCachedToken = !user && trigger !== 'update' && !tokenNeedsRepair

      if (shouldReturnCachedToken) {
        jwtCacheMetrics.cacheHits += 1
        return token
      }

      if (tokenNeedsRepair) {
        jwtCacheMetrics.cacheRepairs += 1
        logAuth('warn', 'JWT cache repair triggered', {
          userId: obfuscateIdentifier(userId),
          trigger: trigger ?? 'session',
        })
      }

      try {
        const context = await getAccountContext(userId, {
          forceRefresh: Boolean(user) || trigger === 'update',
        })

        token.sub = userId
        token.email = coalesceEmail(user?.email, token.email, context.email)
        token.accountType = context.accountType
        token.role = context.role
        token.isAdmin = context.isAdmin
        token.isTestAccount = context.isTestAccount
        token.therapistId = context.therapistId ?? undefined
        token.therapistBusinessName = context.therapistProfile?.businessName ?? null
        token.therapistProfileCompletionScore = context.therapistProfile?.profileCompletionScore ?? null

        logAuth('log', 'JWT token rehydrated', {
          userId: obfuscateIdentifier(userId),
          trigger: trigger ?? (user ? 'sign-in' : 'session'),
          repaired: tokenNeedsRepair,
        })
      } catch (error) {
        logAuth('error', 'Failed to refresh JWT session state', {
          userId: obfuscateIdentifier(userId),
          error: error instanceof Error ? error.message : String(error),
        })
      }

      return token
    },
  },
}

const { handlers, auth: baseAuth, signIn, signOut } = NextAuth(authConfig)

const instrumentedAuth = async (...args: any[]) => {
  const start = nowMs()
  try {
    return await (baseAuth as any)(...args)
  } finally {
    const duration = nowMs() - start
    recordAuthSample(duration)
  }
}

// Export both the instrumented version (for API routes) and raw base (for middleware)
export { handlers, instrumentedAuth as auth, baseAuth as authMiddleware, signIn, signOut }
export default instrumentedAuth
