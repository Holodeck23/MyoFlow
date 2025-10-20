'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white" suppressHydrationWarning>
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/logo.png" alt="MyoFlow" width={36} height={36} priority />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-slate-900">MyoFlow</span>
              <span className="text-xs uppercase tracking-wide text-slate-500">
                Onboarding-Assistent
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-slate-500">Praxisverwaltung für Therapeuten</span>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  )
}
