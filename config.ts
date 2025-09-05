import i18n from 'i18next';

export const supportedLngs = ['de', 'en'];
export const defaultNS = 'common';

/**
 * Loads the dictionary for a given language.
 */
export async function getDictionary(lang: string) {
  if (lang === 'de') {
    return (await import('./dictionaries/de.json')).default;
  }
  return (await import('./dictionaries/en.json')).default;
}

// Basic i18n setup, can be expanded.
i18n.init({
  fallbackLng: 'de',
  supportedLngs,
  defaultNS,
  fallbackNS: defaultNS,
  debug: process.env.NODE_ENV === 'development',
});

export default i18n;

