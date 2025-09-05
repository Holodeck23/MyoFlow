export type Locale = 'de' | 'en'

export const defaultLocale: Locale = 'de'
export const locales: Locale[] = ['de', 'en']

export interface Dictionary {
  [key: string]: string | Dictionary
}

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  de: () => import('./dictionaries/de.json').then((module) => module.default),
  en: () => import('./dictionaries/en.json').then((module) => module.default),
}

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  return dictionaries[locale]?.() ?? dictionaries[defaultLocale]()
}

export function formatPrice(cents: number, locale: Locale): string {
  const currency = locale === 'de' ? 'EUR' : 'EUR'
  return new Intl.NumberFormat(locale === 'de' ? 'de-AT' : 'en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-AT' : 'en-US', {
    dateStyle: 'medium',
  }).format(date)
}

export function formatDateTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-AT' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}