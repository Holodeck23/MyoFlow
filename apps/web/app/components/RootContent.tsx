'use client'

import { useLocale } from '@myoflow/lib'
import { useEffect } from 'react'

interface RootContentProps {
  children: React.ReactNode
}

export function RootContent({ children }: RootContentProps) {
  const { locale } = useLocale()

  useEffect(() => {
    // Update the html lang attribute when locale changes
    document.documentElement.lang = locale === 'de' ? 'de-AT' : 'en-US'
  }, [locale])

  return <>{children}</>
}