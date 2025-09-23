'use client'

import { Button } from './Button'
import { Globe } from 'lucide-react'
import { useLocale, useTranslation } from '@myoflow/lib'
import { useEffect, useState } from 'react'

export function LanguageToggle() {
  const { locale, setLocale, isLoading } = useLocale()
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)


  // Ensure component only renders on client to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleLanguage = () => {
    const newLanguage = locale === 'en' ? 'de' : 'en'
    setLocale(newLanguage)
  }

  // Show loading state during hydration
  if (!mounted || isLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="flex items-center space-x-2 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300"
        disabled
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">
          --
        </span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center space-x-2 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300"
      title="Switch language"
    >
      <Globe className="w-4 h-4" />
      <span className="hidden sm:inline">
        {locale === 'en' ? 'English' : 'Deutsch'}
      </span>
    </Button>
  )
}