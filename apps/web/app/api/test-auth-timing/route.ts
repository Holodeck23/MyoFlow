import { NextResponse } from 'next/server'
import { auth, authDiagnostics } from '@/lib/auth'

export const runtime = 'nodejs' // Force Node.js runtime to ensure consistent behavior

export async function GET() {
  const timings = {
    start: Date.now(),
    authStart: 0,
    authEnd: 0,
    total: 0
  }

  try {
    timings.authStart = Date.now()
    const session = await auth()
    timings.authEnd = Date.now()
    timings.total = Date.now() - timings.start

    const authDuration = timings.authEnd - timings.authStart
    const averageMs = authDiagnostics.performance.averageMs
    const p95Ms = authDiagnostics.performance.p95Ms

    return NextResponse.json({
      success: true,
      hasSession: !!session,
      userEmail: session?.user?.email || null,
      timings: {
        authCallMs: authDuration,
        totalMs: timings.total
      },
      diagnostics: {
        lastAuthCallMs: authDiagnostics.performance.lastSampleMs,
        avgAuthMs: Number(averageMs.toFixed(2)),
        p95AuthMs: Number(p95Ms.toFixed(2)),
        jwtCache: {
          hits: authDiagnostics.jwtCache.cacheHits,
          misses: authDiagnostics.jwtCache.cacheMisses,
          repairs: authDiagnostics.jwtCache.cacheRepairs,
        },
      },
      diagnosis: authDuration > 1000
        ? 'SLOW: Auth call took more than 1 second - investigate database queries or session validation'
        : authDuration > 500
        ? 'WARNING: Auth call took more than 500ms - may cause UX issues'
        : 'OK: Auth call performed within acceptable time'
    })
  } catch (error) {
    timings.total = Date.now() - timings.start
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timings: {
        totalMs: timings.total
      }
    }, { status: 500 })
  }
}
