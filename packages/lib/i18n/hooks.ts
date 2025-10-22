import { useCallback, useMemo } from 'react'
import { useLocale } from './context'
import { Dictionary } from './config'

export function useTranslation() {
  const { dictionary, locale, isLoading } = useLocale()

  const t = useCallback((key: string, fallback?: string): string => {
    // If loading, return a better fallback based on the key
    if (isLoading) {
      if (fallback) return fallback

      // Better fallbacks for common keys
      const keyParts = key.split('.')
      const lastPart = keyParts[keyParts.length - 1]

      // Convert camelCase to readable text
      const readableFallback = lastPart
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim()

      return readableFallback || key
    }

    // Support nested keys like 'nav.dashboard'
    const keys = key.split('.')
    let value: any = dictionary

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Key not found, return fallback or better readable key
        if (fallback) return fallback

        const lastPart = keys[keys.length - 1]
        const readableFallback = lastPart
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim()

        return readableFallback || key
      }
    }

    return typeof value === 'string' ? value : fallback || key
  }, [dictionary, isLoading])

  return useMemo(() => ({
    t,
    locale,
    isLoading
  }), [t, locale, isLoading])
}

// Utility function for translations outside of components
export function createTranslator(dictionary: Dictionary) {
  return (key: string, fallback?: string): string => {
    const keys = key.split('.')
    let value: any = dictionary

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return fallback || key
      }
    }

    return typeof value === 'string' ? value : fallback || key
  }
}
