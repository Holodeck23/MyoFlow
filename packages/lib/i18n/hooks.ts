import { useLocale } from './context'
import { Dictionary } from './config'

export function useTranslation() {
  const { dictionary, locale, isLoading } = useLocale()

  const t = (key: string, fallback?: string): string => {
    if (isLoading) {
      return fallback || key
    }

    // Support nested keys like 'nav.dashboard'
    const keys = key.split('.')
    let value: any = dictionary

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Key not found, return fallback or key itself
        return fallback || key
      }
    }

    return typeof value === 'string' ? value : fallback || key
  }

  return {
    t,
    locale,
    isLoading
  }
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