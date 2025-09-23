'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, defaultLocale, Dictionary, getDictionary } from './config'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  dictionary: Dictionary
  isLoading: boolean
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

interface LocaleProviderProps {
  children: ReactNode
  initialLocale?: Locale
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  // Initialize with saved locale if available, otherwise use default
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('myoflow-locale') as Locale
      if (saved && (saved === 'de' || saved === 'en')) {
        return saved
      }
    }
    return initialLocale || defaultLocale
  })

  const [dictionary, setDictionary] = useState<Dictionary>({})
  const [isLoading, setIsLoading] = useState(true)

  // Load dictionary when locale changes
  useEffect(() => {
    const loadDictionary = async () => {
      setIsLoading(true)
      try {
        const dict = await getDictionary(locale)
        setDictionary(dict)
      } catch (error) {
        console.error('Failed to load dictionary:', error)
        // Fallback to default locale if we're not already on it
        if (locale !== defaultLocale) {
          try {
            const fallbackDict = await getDictionary(defaultLocale)
            setDictionary(fallbackDict)
          } catch (fallbackError) {
            console.error('Failed to load fallback dictionary:', fallbackError)
            // Set minimal fallback dictionary to prevent empty state
            setDictionary({
              common: { loading: "Loading...", error: "Error" },
              nav: { dashboard: "Dashboard" }
            })
          }
        } else {
          // We're already on default locale and it failed, provide minimal fallback
          console.error('Default locale dictionary failed to load, using minimal fallback')
          setDictionary({
            common: { loading: "Loading...", error: "Error" },
            nav: { dashboard: "Dashboard" }
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadDictionary()
  }, [locale])

  // Save locale to localStorage when changed
  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('myoflow-locale', newLocale)
    }
  }

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale: handleSetLocale,
        dictionary,
        isLoading,
      }}
    >
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}