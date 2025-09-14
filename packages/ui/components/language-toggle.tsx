'use client'

import React, { useState } from 'react'
import { useLocale, Locale } from '@myoflow/lib'

interface LanguageToggleProps {
  variant?: 'dropdown' | 'switch'
  className?: string
}

export function LanguageToggle({ variant = 'dropdown', className = '' }: LanguageToggleProps) {
  const { locale, setLocale } = useLocale()
  const [isOpen, setIsOpen] = useState(false)

  if (variant === 'switch') {
    return (
      <div className={`flex items-center space-x-4 px-3 py-2 ${className}`}>
        <span className={`text-xs font-medium transition-colors ${locale === 'en' ? 'text-blue-600' : 'text-gray-400'}`}>
          EN
        </span>
        <button
          onClick={() => setLocale(locale === 'de' ? 'en' : 'de')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md border ${
            locale === 'de' ? 'bg-blue-600 hover:bg-blue-700 border-blue-600' : 'bg-gray-200 hover:bg-gray-300 border-gray-300'
          }`}
          role="switch"
          aria-checked={locale === 'de'}
          aria-label={`Current language: ${locale === 'de' ? 'German' : 'English'}. Click to switch.`}
          title={`Switch to ${locale === 'de' ? 'English' : 'German'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
              locale === 'de' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-xs font-medium transition-colors ${locale === 'de' ? 'text-blue-600' : 'text-gray-400'}`}>
          DE
        </span>
      </div>
    )
  }

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        id="language-menu"
        aria-expanded="true"
        aria-haspopup="true"
      >
        <span className="flex items-center space-x-2">
          {locale === 'de' ? (
            <>
              <span className="text-base">🇩🇪</span>
              <span>Deutsch</span>
            </>
          ) : (
            <>
              <span className="text-base">🇬🇧</span>
              <span>English</span>
            </>
          )}
        </span>
        <svg
          className="-mr-1 ml-2 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="language-menu">
            <button
              onClick={() => {
                setLocale('de')
                setIsOpen(false)
              }}
              className={`flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                locale === 'de' ? 'bg-blue-50 text-blue-900' : 'text-gray-700'
              }`}
              role="menuitem"
            >
              <span className="text-base mr-3">🇩🇪</span>
              <div>
                <div className="font-medium">Deutsch</div>
                <div className="text-xs text-gray-500">Österreich</div>
              </div>
              {locale === 'de' && (
                <svg className="ml-auto h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={() => {
                setLocale('en')
                setIsOpen(false)
              }}
              className={`flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                locale === 'en' ? 'bg-blue-50 text-blue-900' : 'text-gray-700'
              }`}
              role="menuitem"
            >
              <span className="text-base mr-3">🇬🇧</span>
              <div>
                <div className="font-medium">English</div>
                <div className="text-xs text-gray-500">International</div>
              </div>
              {locale === 'en' && (
                <svg className="ml-auto h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}