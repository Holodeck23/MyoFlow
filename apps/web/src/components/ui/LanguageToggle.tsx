'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface LanguageToggleProps {
  className?: string
  size?: 'sm' | 'md'
}

export function LanguageToggle({ className, size = 'md' }: LanguageToggleProps) {
  const [currentLocale, setCurrentLocale] = useState<'de' | 'en'>('de')

  useEffect(() => {
    // Get current locale from localStorage
    const saved = localStorage.getItem('locale') as 'de' | 'en'
    if (saved && ['de', 'en'].includes(saved)) {
      setCurrentLocale(saved)
    }
  }, [])

  const toggleLanguage = () => {
    const newLocale = currentLocale === 'de' ? 'en' : 'de'
    setCurrentLocale(newLocale)
    localStorage.setItem('locale', newLocale)
    
    // For now, reload the page to apply the language change
    window.location.reload()
  }

  const sizes = {
    sm: {
      container: 'h-6 w-11',
      circle: 'h-4 w-4',
      text: 'text-xs',
      translate: 'translate-x-5'
    },
    md: {
      container: 'h-8 w-14',
      circle: 'h-6 w-6',
      text: 'text-sm',
      translate: 'translate-x-6'
    }
  }

  const currentSize = sizes[size]

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <span className={cn(
        'font-medium text-neutral-gray-600',
        currentSize.text,
        currentLocale === 'de' && 'text-medical-blue'
      )}>
        DE
      </span>
      
      <button
        onClick={toggleLanguage}
        className={cn(
          'relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-medical-blue focus:ring-offset-2',
          currentSize.container,
          currentLocale === 'en' ? 'bg-medical-blue' : 'bg-neutral-gray-200'
        )}
        role="switch"
        aria-checked={currentLocale === 'en'}
        aria-label={`Switch to ${currentLocale === 'de' ? 'English' : 'German'}`}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
            currentSize.circle,
            currentLocale === 'en' ? currentSize.translate : 'translate-x-0'
          )}
        />
      </button>
      
      <span className={cn(
        'font-medium text-neutral-gray-600',
        currentSize.text,
        currentLocale === 'en' && 'text-medical-blue'
      )}>
        EN
      </span>
    </div>
  )
}