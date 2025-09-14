'use client'

import { useTranslation } from '@myoflow/lib'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({
  message,
  size = 'md',
  className = ''
}: LoadingSpinnerProps) {
  const { t } = useTranslation()

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div
            className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}
            role="status"
            aria-label="Loading"
          />
        </div>
        <div className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
          {message || t('common.loading', 'Loading...')}
        </div>
      </div>
    </div>
  )
}