'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { type Locale, defaultLocale, getDictionary, type Dictionary } from '@myoflow/lib/i18n/config'

interface LanguageContextType {
  locale: Locale
  dictionary: Dictionary | null
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [dictionary, setDictionary] = useState<Dictionary | null>(null)

  useEffect(() => {
    // Get saved locale from localStorage
    const saved = localStorage.getItem('locale') as Locale
    if (saved && ['de', 'en'].includes(saved)) {
      setLocaleState(saved)
    }
  }, [])

  useEffect(() => {
    // Load dictionary when locale changes
    getDictionary(locale).then(setDictionary)
  }, [locale])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  const t = (key: string): string => {
    if (!dictionary) {
      // Return fallback based on locale and key while dictionary loads
      const fallbacks: Record<string, Record<string, string>> = {
        'nav.dashboard': { de: 'Dashboard', en: 'Dashboard' },
        'nav.clients': { de: 'Klienten', en: 'Clients' },
        'nav.appointments': { de: 'Termine', en: 'Appointments' },
        'nav.invoices': { de: 'Rechnungen', en: 'Invoices' },
        'nav.settings': { de: 'Einstellungen', en: 'Settings' }
      }
      return fallbacks[key]?.[locale] || key
    }
    
    const keys = key.split('.')
    let value: any = dictionary
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key
  }

  return (
    <LanguageContext.Provider value={{ locale, dictionary, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}