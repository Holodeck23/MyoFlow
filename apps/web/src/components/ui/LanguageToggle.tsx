'use client'

import { Button } from './Button'
import { Globe } from 'lucide-react'
import { useLocale } from '@myoflow/lib'

export function LanguageToggle() {
  const { locale, setLocale } = useLocale()

  const toggleLanguage = () => {
    const newLanguage = locale === 'en' ? 'de' : 'en'
    setLocale(newLanguage)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center space-x-2 hover:bg-gray-100 hover:text-gray-900"
      title="Switch language"
    >
      <Globe className="w-4 h-4" />
      <span className="hidden sm:inline">
        {locale === 'en' ? 'EN' : 'DE'}
      </span>
    </Button>
  )
}